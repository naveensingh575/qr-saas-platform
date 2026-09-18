import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { checkRateLimit } from '@/lib/rate-limiter';
import { generateDynamicQrSvg } from '@/lib/qr-generator';
import { memoryQrStore, addMemoryQr, QrRecordItem } from '@/lib/memory-store';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Helper to extract session payload from request cookie or auth header
 */
function getSessionPayload(request: NextRequest) {
  const token =
    request.cookies.get('omni_session_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * GET /api/v1/qr - List dynamic QRs partitioned for the authenticated user's team
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || 'default_demo_key';
  
  // Enforce sliding-window rate limit
  const rateLimit = await checkRateLimit(apiKey, 60, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in ' + rateLimit.resetSeconds + ' seconds.' },
      { status: 429, headers: { 'X-RateLimit-Reset': rateLimit.resetSeconds.toString() } }
    );
  }

  const session = getSessionPayload(request);
  const teamId = session?.teamId;

  if (!teamId) {
    // Unauthenticated user - return empty data partition
    return NextResponse.json({
      data: [],
      rateLimit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
    });
  }

  try {
    const qrCodes = await prisma.qrCode.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      data: qrCodes || [],
      rateLimit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
    });
  } catch (error) {
    console.warn('[API /api/v1/qr GET] Using fallback memory store:', error);
    const userMems = memoryQrStore.filter((i) => i.teamId === teamId);
    return NextResponse.json({
      data: userMems,
      rateLimit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
    });
  }
}

/**
 * POST /api/v1/qr - Create a new Dynamic QR code for the authenticated team
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || 'default_demo_key';
  const rateLimit = await checkRateLimit(apiKey, 60, 60);
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429 }
    );
  }

  const session = getSessionPayload(request);
  if (!session || !session.teamId) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to create dynamic QRs for your workspace.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { destinationUrl, title, logoUrl, darkColor, lightColor } = body;

    if (!destinationUrl) {
      return NextResponse.json({ error: 'destinationUrl is required.' }, { status: 400 });
    }

    const shortCode = Math.random().toString(36).substring(2, 8);
    const redirectUrl = `${request.nextUrl.origin}/r/${shortCode}`;

    // Generate Server-side QR SVG with Level H + Center Logo
    const svgCode = await generateDynamicQrSvg({
      text: redirectUrl,
      darkColor: darkColor || '#0f172a',
      lightColor: lightColor || '#ffffff',
      logoUrl: logoUrl || undefined,
    });

    const now = new Date().toISOString();
    let newRecord: QrRecordItem = {
      id: 'qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      teamId: session.teamId,
      shortCode,
      title: title || `Dynamic QR (${shortCode})`,
      type: 'DYNAMIC',
      destinationUrl,
      logoUrl: logoUrl || null,
      isActive: true,
      scansCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const dbRecord = await prisma.qrCode.create({
        data: {
          teamId: session.teamId,
          shortCode,
          title: newRecord.title,
          type: 'DYNAMIC',
          destinationUrl,
          logoUrl: newRecord.logoUrl,
          config: { darkColor, lightColor },
          isActive: true,
        },
      });

      newRecord.id = dbRecord.id;
      newRecord.teamId = dbRecord.teamId;
    } catch (dbErr) {
      console.warn('[API /api/v1/qr POST] DB insert fallback to memory store:', dbErr);
    }

    // Persist to memory store
    addMemoryQr(newRecord);

    // Warm Redis cache for ultra-fast edge redirect
    await redis.set(
      `qr:code:${shortCode}`,
      JSON.stringify({ id: newRecord.id, destinationUrl, isActive: true }),
      'EX',
      3600
    );

    return NextResponse.json({
      success: true,
      data: {
        ...newRecord,
        redirectUrl,
        svgContent: svgCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

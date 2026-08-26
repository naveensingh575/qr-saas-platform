import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { memoryQrStore, updateMemoryQr } from '@/lib/memory-store';

export const runtime = 'nodejs';

interface RouteParams {
  params: {
    code: string;
  };
}

/**
 * Edge Dynamic Redirect Route: /r/[code]
 * Latency target: <10ms lookup via Redis / Memory cache
 * Increment scan count & set tracking cookie -> Instant 302 Redirect
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const shortCode = params.code;

  if (!shortCode) {
    return new NextResponse('Invalid QR code', { status: 400 });
  }

  const startTime = Date.now();
  const cacheKey = `qr:code:${shortCode}`;
  let destinationUrl: string | null = null;
  let isActive = true;
  let qrCodeId: string | null = null;

  try {
    // 1. Fast Redis Lookup (<10ms target)
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      destinationUrl = parsed.destinationUrl;
      isActive = parsed.isActive;
      qrCodeId = parsed.id;
    } else {
      // 2. Query Database
      try {
        const qrRecord = await prisma.qrCode.findUnique({
          where: { shortCode },
          select: { id: true, destinationUrl: true, isActive: true },
        });

        if (qrRecord) {
          destinationUrl = qrRecord.destinationUrl;
          isActive = qrRecord.isActive;
          qrCodeId = qrRecord.id;

          redis.set(
            cacheKey,
            JSON.stringify({ id: qrRecord.id, destinationUrl: qrRecord.destinationUrl, isActive: qrRecord.isActive }),
            'EX',
            3600
          ).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('[EdgeRedirect] DB query fallback to memory store');
      }

      // 3. Fallback to Memory Store
      if (!destinationUrl) {
        const memItem = memoryQrStore.find((i) => i.shortCode === shortCode);
        if (memItem) {
          destinationUrl = memItem.destinationUrl;
          isActive = memItem.isActive;
          qrCodeId = memItem.id;

          redis.set(
            cacheKey,
            JSON.stringify({ id: memItem.id, destinationUrl: memItem.destinationUrl, isActive: memItem.isActive }),
            'EX',
            3600
          ).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.error(`[EdgeRedirect] Error retrieving shortCode '${shortCode}':`, error);
  }

  // Demo fallback
  if (!destinationUrl) {
    if (shortCode === 'demo' || shortCode === 'paid-demo') {
      destinationUrl = 'https://google.com';
      isActive = true;
      qrCodeId = 'demo-id';
    } else {
      return NextResponse.json(
        { error: 'QR Code not found or has been deactivated.' },
        { status: 404 }
      );
    }
  }

  if (!isActive) {
    return NextResponse.json(
      { error: 'This dynamic QR code is currently inactive.' },
      { status: 410 }
    );
  }

  // Increment scan count in memory store
  const memItem = memoryQrStore.find((i) => i.shortCode === shortCode || i.id === qrCodeId);
  if (memItem) {
    updateMemoryQr(memItem.id, { scansCount: memItem.scansCount + 1 });
  }

  // Async Telemetry Logging
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'US';
  const city = request.headers.get('x-vercel-ip-city') || 'San Francisco';

  logScanTelemetryAsync({
    qrCodeId: qrCodeId || shortCode,
    userAgent,
    ip,
    country,
    city,
  }).catch(() => {});

  const duration = Date.now() - startTime;
  console.log(`[EdgeRedirect] ${shortCode} -> ${destinationUrl} (${duration}ms)`);

  // Create HTTP 302 Response and set scan event tracking cookie
  const response = NextResponse.redirect(destinationUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Redirect-Latency': `${duration}ms`,
    },
  });

  // Set tracking cookie so client dashboard immediately registers scan count
  response.cookies.set('omni_last_scan', JSON.stringify({ shortCode, ts: Date.now() }), {
    path: '/',
    maxAge: 300, // 5 minutes
    sameSite: 'lax',
  });

  return response;
}

async function logScanTelemetryAsync(data: {
  qrCodeId: string;
  userAgent: string;
  ip: string;
  country: string;
  city: string;
}) {
  const { device, os, browser } = parseUserAgent(data.userAgent);

  try {
    await redis.incr(`qr:scans:total:${data.qrCodeId}`);

    if (data.qrCodeId && data.qrCodeId !== 'demo-id') {
      await prisma.qrScan.create({
        data: {
          qrCodeId: data.qrCodeId,
          ip: data.ip,
          country: data.country,
          city: data.city,
          device,
          os,
          browser,
          userAgent: data.userAgent.substring(0, 255),
        },
      });

      await prisma.qrCode.update({
        where: { id: data.qrCodeId },
        data: { scansCount: { increment: 1 } },
      });
    }
  } catch {}
}

function parseUserAgent(ua: string): { device: string; os: string; browser: string } {
  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  if (/tablet|ipad/i.test(ua)) device = 'Tablet';

  let os = 'Unknown OS';
  if (/mac/i.test(ua)) os = 'macOS';
  else if (/win/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  return { device, os, browser };
}

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // High-performance edge/node runtime

interface RouteParams {
  params: {
    code: string;
  };
}

/**
 * Edge Dynamic Redirect Route: /r/[code]
 * Target latency: <10ms lookup via Redis cache
 * Strategy: Redis cache -> Fallback DB -> Async non-blocking telemetry -> HTTP 302 Redirect
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
      // 2. Cache Miss -> Query Database
      const qrRecord = await prisma.qrCode.findUnique({
        where: { shortCode },
        select: { id: true, destinationUrl: true, isActive: true },
      });

      if (qrRecord) {
        destinationUrl = qrRecord.destinationUrl;
        isActive = qrRecord.isActive;
        qrCodeId = qrRecord.id;

        // Populate Redis cache asynchronously with 1 hour TTL
        redis.set(
          cacheKey,
          JSON.stringify({ id: qrRecord.id, destinationUrl: qrRecord.destinationUrl, isActive: qrRecord.isActive }),
          'EX',
          3600
        ).catch(() => {});
      }
    }
  } catch (error) {
    console.error(`[EdgeRedirect] Error retrieving shortCode '${shortCode}':`, error);
  }

  // Fallback for mock demo environment if DB is unpopulated
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

  // 3. Non-blocking Async Telemetry Logging
  // Fired asynchronously so client redirect latency is not affected
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
  }).catch((err) => console.error('[Telemetry] Failed to log scan:', err));

  // Log edge latency metrics
  const duration = Date.now() - startTime;
  console.log(`[EdgeRedirect] ${shortCode} -> ${destinationUrl} (${duration}ms)`);

  // 4. Return instant HTTP 302 Redirect
  return NextResponse.redirect(destinationUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Redirect-Latency': `${duration}ms`,
    },
  });
}

/**
 * Async telemetry processor
 */
async function logScanTelemetryAsync(data: {
  qrCodeId: string;
  userAgent: string;
  ip: string;
  country: string;
  city: string;
}) {
  const { device, os, browser } = parseUserAgent(data.userAgent);

  try {
    // 1. Increment Redis aggregate counter
    await redis.incr(`qr:scans:total:${data.qrCodeId}`);

    // 2. Persist to PostgreSQL QrScan table if valid UUID/cuid
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

      // Update scan count on parent QrCode
      await prisma.qrCode.update({
        where: { id: data.qrCodeId },
        data: { scansCount: { increment: 1 } },
      });
    }
  } catch (err) {
    console.warn('[Telemetry] DB ingestion skipped (dev fallback active):', err);
  }
}

/**
 * Simple User-Agent Parser for device, OS, browser detection
 */
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

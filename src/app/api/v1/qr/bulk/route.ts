import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { enqueueBulkQrJob } from '@/lib/queue';

export const runtime = 'nodejs';

/**
 * POST /api/v1/qr/bulk - Enqueue Bulk CSV QR Generation Job
 * Expects JSON payload with array of items: [{ destinationUrl, title, type }]
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || 'default_demo_key';
  
  // Rate limit check
  const rateLimit = await checkRateLimit(apiKey, 600, 60); // Higher limit for Business tier
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for bulk processing.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { items, teamId = 'team-business-demo' } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Payload must contain a non-empty "items" array.' },
        { status: 400 }
      );
    }

    const jobId = `bulk_job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Dispatch job to BullMQ queue or inline executor
    const queueResult = await enqueueBulkQrJob({
      jobId,
      teamId,
      items,
    });

    return NextResponse.json({
      success: true,
      message: `Enqueued ${items.length} items for background QR generation.`,
      jobId,
      status: 'PROCESSING',
      queueResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to dispatch bulk job' }, { status: 500 });
  }
}

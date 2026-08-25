import { Queue, Worker, Job } from 'bullmq';
import { generateDynamicQrSvg } from './qr-generator';

export interface BulkQrItem {
  destinationUrl: string;
  title?: string;
  type?: 'STATIC' | 'DYNAMIC';
}

export interface BulkQrJobPayload {
  teamId: string;
  jobId: string;
  items: BulkQrItem[];
}

const QUEUE_NAME = 'bulk-qr-processing';

let bulkQueue: Queue<BulkQrJobPayload> | null = null;

try {
  if (process.env.REDIS_URL) {
    bulkQueue = new Queue(QUEUE_NAME, {
      connection: {
        url: process.env.REDIS_URL,
      },
    });
  }
} catch (e) {
  console.warn('[BullMQ] Redis queue initialization fallback to internal job processor');
}

export { bulkQueue };

/**
 * Executes batch generation task inline or enqueues into BullMQ
 */
export async function enqueueBulkQrJob(payload: BulkQrJobPayload) {
  if (bulkQueue) {
    await bulkQueue.add('process-bulk-csv', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    return { queued: true, jobId: payload.jobId };
  } else {
    // Process asynchronously in background without blocking response
    setTimeout(() => {
      processBulkTask(payload).catch((err) =>
        console.error('[BulkTask] Background task error:', err)
      );
    }, 10);
    return { queued: true, jobId: payload.jobId, inline: true };
  }
}

/**
 * Core Batch QR Generator logic
 */
export async function processBulkTask(payload: BulkQrJobPayload) {
  const { teamId, items } = payload;
  const results = [];

  for (const item of items) {
    const shortCode = Math.random().toString(36).substring(2, 8);
    const redirectUrl = `/r/${shortCode}`;
    const svgContent = await generateDynamicQrSvg({ text: item.destinationUrl });

    results.push({
      shortCode,
      destinationUrl: item.destinationUrl,
      title: item.title || `QR ${shortCode}`,
      redirectUrl,
      svgContent,
      createdAt: new Date().toISOString(),
    });
  }

  return { teamId, count: results.length, results };
}

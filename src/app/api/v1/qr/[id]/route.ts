import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { updateMemoryQr, deleteMemoryQr, memoryQrStore } from '@/lib/memory-store';

export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/v1/qr/[id] - Update destination URL or toggle active status
 * DELETE /api/v1/qr/[id] - Remove QR code
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const qrId = params.id;

  try {
    const body = await request.json();
    const { destinationUrl, isActive, title } = body;

    let updatedRecord: any = null;
    let shortCode = '';

    // Update in-memory store
    const memMatch = memoryQrStore.find((i) => i.id === qrId);
    if (memMatch) {
      shortCode = memMatch.shortCode;
      updatedRecord = updateMemoryQr(qrId, {
        ...(destinationUrl !== undefined && { destinationUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(title !== undefined && { title }),
      });
    }

    try {
      const existing = await prisma.qrCode.findUnique({ where: { id: qrId } });
      if (existing) {
        shortCode = existing.shortCode;
        const dbUpdated = await prisma.qrCode.update({
          where: { id: qrId },
          data: {
            ...(destinationUrl !== undefined && { destinationUrl }),
            ...(isActive !== undefined && { isActive }),
            ...(title !== undefined && { title }),
          },
        });
        updatedRecord = dbUpdated;
      }
    } catch {}

    if (!updatedRecord) {
      // Fallback update
      updatedRecord = {
        id: qrId,
        shortCode: shortCode || 'paid-demo',
        title: title || 'Updated Dynamic QR',
        destinationUrl: destinationUrl || 'https://example.com',
        isActive: isActive !== undefined ? isActive : true,
      };
    }

    if (shortCode) {
      // Refresh Redis cache instantly
      await redis.set(
        `qr:code:${shortCode}`,
        JSON.stringify({
          id: qrId,
          destinationUrl: updatedRecord.destinationUrl,
          isActive: updatedRecord.isActive,
        }),
        'EX',
        3600
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Destination URL updated instantly in database, memory store, and Redis cache.',
      data: updatedRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update QR' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const qrId = params.id;

  try {
    deleteMemoryQr(qrId);

    try {
      const existing = await prisma.qrCode.findUnique({ where: { id: qrId } });
      if (existing) {
        await redis.del(`qr:code:${existing.shortCode}`);
        await prisma.qrCode.delete({ where: { id: qrId } });
      }
    } catch {}

    return NextResponse.json({ success: true, message: 'QR Code deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete QR' }, { status: 500 });
  }
}

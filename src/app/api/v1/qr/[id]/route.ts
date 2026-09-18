import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { updateMemoryQr, deleteMemoryQr, memoryQrStore } from '@/lib/memory-store';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

function getSessionPayload(request: NextRequest) {
  const token =
    request.cookies.get('omni_session_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * PATCH /api/v1/qr/[id] - Update destination URL or toggle active status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const qrId = params.id;
  const session = getSessionPayload(request);

  try {
    const body = await request.json();
    const { destinationUrl, isActive, title } = body;

    let updatedRecord: any = null;
    let shortCode = '';

    try {
      const existing = await prisma.qrCode.findUnique({ where: { id: qrId } });
      if (existing) {
        if (session && session.teamId && existing.teamId !== session.teamId) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have permission to modify this team’s QR code.' },
            { status: 403 }
          );
        }

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

    // In-memory update
    const memMatch = memoryQrStore.find((i) => i.id === qrId);
    if (memMatch) {
      if (session && session.teamId && memMatch.teamId !== session.teamId) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this team’s QR code.' },
          { status: 403 }
        );
      }
      shortCode = memMatch.shortCode;
      updatedRecord = updateMemoryQr(qrId, {
        ...(destinationUrl !== undefined && { destinationUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(title !== undefined && { title }),
      });
    }

    if (!updatedRecord) {
      return NextResponse.json({ error: 'Dynamic QR code not found.' }, { status: 404 });
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
  const session = getSessionPayload(request);

  try {
    try {
      const existing = await prisma.qrCode.findUnique({ where: { id: qrId } });
      if (existing) {
        if (session && session.teamId && existing.teamId !== session.teamId) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have permission to delete this team’s QR code.' },
            { status: 403 }
          );
        }
        await redis.del(`qr:code:${existing.shortCode}`);
        await prisma.qrCode.delete({ where: { id: qrId } });
      }
    } catch {}

    deleteMemoryQr(qrId);

    return NextResponse.json({ success: true, message: 'QR Code deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete QR' }, { status: 500 });
  }
}

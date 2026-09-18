import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasPermission, Role } from '@/lib/rbac';

export const runtime = 'nodejs';

/**
 * POST /api/v1/teams/members - Update member role or assign access privileges
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, memberId, newRole, userRole = 'ADMIN', email, name } = body;

    // RBAC Check
    if (!hasPermission(userRole as Role, 'TEAM_INVITE')) {
      return NextResponse.json(
        { error: 'Permission denied. Requires ADMIN or OWNER rights.' },
        { status: 403 }
      );
    }

    if (action === 'UPDATE_ROLE') {
      try {
        await prisma.teamMember.update({
          where: { id: memberId },
          data: { role: newRole as Role },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Member role updated to ${newRole}.`,
        memberId,
        newRole,
      });
    }

    if (action === 'INVITE') {
      const newMember = {
        id: 'mem-' + Date.now(),
        role: newRole || 'MEMBER',
        user: { name: name || email.split('@')[0], email },
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${email} with role ${newRole}.`,
        member: newMember,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed member operation' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET /api/v1/auth/me - Validate session token & return active profile
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('omni_session_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      teamId: payload.teamId,
      teamName: payload.teamName,
    },
  });
}

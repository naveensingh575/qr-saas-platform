import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/v1/auth/logout - Clear session token cookie
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.set('omni_session_token', '', {
    path: '/',
    expires: new Date(0),
  });
  return response;
}

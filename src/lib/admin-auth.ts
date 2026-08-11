import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'ykp_admin';
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || '';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyAdmin(request: NextRequest): boolean {
  if (!ADMIN_HASH) return true; // No password configured = open access
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const tokenBuf = Buffer.from(token, 'hex');
    const hashBuf = Buffer.from(ADMIN_HASH, 'hex');
    if (tokenBuf.length !== hashBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, hashBuf);
  } catch {
    return false;
  }
}

export function adminLoginResponse(success: boolean): NextResponse {
  const res = NextResponse.json({ success });
  if (success) {
    res.cookies.set(ADMIN_COOKIE_NAME, ADMIN_HASH, {
      httpOnly: true,
      secure: false, // dev
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  }
  return res;
}

export function adminLogoutResponse(): NextResponse {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}

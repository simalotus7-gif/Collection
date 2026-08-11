import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, adminLoginResponse } from '@/lib/admin-auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password) {
      return adminLoginResponse(false);
    }
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    const adminHash = process.env.ADMIN_PASSWORD_HASH || '';
    const success = inputHash === adminHash;
    if (success) {
      return adminLoginResponse(true);
    }
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
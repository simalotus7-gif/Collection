import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const isAdmin = verifyAdmin(request);
  return NextResponse.json({ isAdmin });
}
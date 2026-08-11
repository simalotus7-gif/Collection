import { adminLogoutResponse } from '@/lib/admin-auth';

export async function POST() {
  return adminLogoutResponse();
}
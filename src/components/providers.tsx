'use client';

import { AdminProvider } from '@/contexts/AdminContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}

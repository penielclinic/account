'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Supabase 세션 복원
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        router.push('/login/');
        return;
      }
      const role = session.user.user_metadata?.accounting_role;
      if (!role) {
        supabase.auth.signOut();
        setLoading(false);
        router.push('/login/');
        return;
      }
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name ?? '',
        role,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  FileText,
  PiggyBank,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',             icon: LayoutDashboard, label: '대시보드' },
  { href: '/transactions', icon: ArrowLeftRight,  label: '거래 내역' },
  { href: '/analytics',    icon: BarChart3,        label: '분석' },
  { href: '/reports',      icon: FileText,         label: '보고서' },
  { href: '/budgets',      icon: PiggyBank,        label: '예산' },
  { href: '/accounts',     icon: BookOpen,         label: '계정과목' },
  { href: '/ai-query',     icon: MessageSquare,    label: 'AI 질의' },
  { href: '/settings',     icon: Settings,         label: '설정' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login/');
  };

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-200 flex-shrink-0 ${
        isSidebarCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center h-14 px-3 border-b border-gray-200">
        {!isSidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">이음 회계</p>
            <p className="text-xs text-gray-500 truncate">해운대순복음교회</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-100 flex-shrink-0 ml-auto"
          aria-label="사이드바 접기/펼치기"
        >
          <ChevronLeft
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isSidebarCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* 푸터 */}
      <div className="p-2 border-t border-gray-200">
        {!isSidebarCollapsed && user && (
          <p className="px-3 py-1 text-xs text-gray-400 truncate" title={user.email}>
            {user.email}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
          title={isSidebarCollapsed ? '로그아웃' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isSidebarCollapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}

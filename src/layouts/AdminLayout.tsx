import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Clapperboard,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/movies', label: 'Quản lý phim', icon: Film },
  { to: '/admin/bookings', label: 'Đơn đặt vé', icon: Ticket },
  { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
];

const breadcrumbLabels: Record<string, string> = {
  admin: 'Quản trị',
  movies: 'Phim',
  users: 'Người dùng',
  bookings: 'Đơn đặt vé',
  create: 'Thêm mới',
  edit: 'Chỉnh sửa',
  showtimes: 'Lịch chiếu',
};

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const segments = location.pathname.split('/').filter(Boolean);
  const sidebarContent = (
    <>
      <div className={`mb-8 flex items-center gap-2 px-1 ${collapsed ? 'justify-center' : ''}`}>
        <Clapperboard size={22} className="shrink-0 text-primary" />
        {!collapsed && (
          <span className="text-lg font-extrabold tracking-tight">
            Cine<span className="text-primary">Wave</span>
          </span>
        )}
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-primary text-white' : 'text-admin-text-muted hover:bg-white/5 hover:text-text'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon size={17} className="shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-admin-bg text-text">
      <aside
        className={`hidden shrink-0 border-r border-admin-border bg-admin-surface p-4 transition-all duration-200 lg:flex lg:flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-admin-border py-2 text-xs text-admin-text-muted hover:text-text"
        >
          <ChevronRight size={15} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          {!collapsed && 'Thu gọn'}
        </button>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-admin-surface p-4">
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng menu">
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-admin-border bg-admin-surface px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu quản trị"
              className="rounded-md p-1.5 hover:bg-white/5 lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-1.5 text-sm text-admin-text-muted sm:flex">
              {segments.map((seg, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={14} />}
                  <span className={i === segments.length - 1 ? 'text-text' : ''}>
                    {breadcrumbLabels[seg] ?? seg}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="relative rounded-full p-2 hover:bg-white/5" aria-label="Thông báo">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-admin-border bg-admin-surface-alt py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {user?.fullName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm sm:inline">{user?.fullName}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full p-2 text-error hover:bg-error/10"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

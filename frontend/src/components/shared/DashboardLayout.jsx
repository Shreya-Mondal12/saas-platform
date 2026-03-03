import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon, UsersIcon, ChartBarIcon, SparklesIcon,
  PaintBrushIcon, CogIcon, UserCircleIcon,
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon, roles: ['user', 'admin', 'superadmin'] },
  { to: '/analytics', label: 'Analytics', icon: ChartBarIcon, roles: ['admin', 'superadmin'] },
  { to: '/reports', label: 'AI Reports', icon: SparklesIcon, roles: ['admin', 'superadmin'] },
  { to: '/users', label: 'Users', icon: UsersIcon, roles: ['admin', 'superadmin'] },
  { to: '/branding', label: 'Branding', icon: PaintBrushIcon, roles: ['admin', 'superadmin'] },
  { to: '/settings', label: 'Settings', icon: CogIcon, roles: ['admin', 'superadmin'] },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon, roles: ['user', 'admin', 'superadmin'] },
];

export default function DashboardLayout() {
  const { user, tenant, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Company */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {tenant?.branding?.logoUrl ? (
            <img src={tenant.branding.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
              {(tenant?.branding?.companyName || tenant?.name || 'S')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-sm text-gray-900 truncate max-w-[140px]">
              {tenant?.branding?.companyName || tenant?.name || 'SaaS Platform'}
            </div>
            <div className="text-xs text-gray-400 capitalize">{tenant?.plan} plan</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {filteredNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User / logout */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: 'var(--color-secondary)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user?.fullName || user?.firstName}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-xl">
            <button className="absolute top-4 right-4 text-gray-400" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">
            {tenant?.branding?.companyName || 'SaaS Platform'}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

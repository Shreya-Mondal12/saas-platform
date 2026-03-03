import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, userAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { UsersIcon, ChartBarIcon, SparklesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-green-500 mt-0.5">{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const [overview, setOverview] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getOverview({ days: 7 }),
      userAPI.getAll({ limit: 1 }),
    ]).then(([{ data: a }, { data: u }]) => {
      setOverview(a.overview);
      setUserCount(u.pagination?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const isAdmin = ['admin', 'superadmin'].includes(user?.role);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Here's what's happening at <strong>{tenant?.branding?.companyName || tenant?.name}</strong> this week
        </p>
      </div>

      {/* Stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={userCount}
            icon={UsersIcon}
            color="bg-indigo-500"
          />
          <StatCard
            label="Actions (7d)"
            value={overview?.totalActions ?? '—'}
            icon={ChartBarIcon}
            color="bg-purple-500"
          />
          <StatCard
            label="New Users (7d)"
            value={overview?.topActions?.length ?? '—'}
            icon={ArrowTrendingUpIcon}
            color="bg-emerald-500"
          />
          <StatCard
            label="Plan"
            value={tenant?.plan ? tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1) : '—'}
            icon={SparklesIcon}
            color="bg-amber-500"
            sub={tenant?.status === 'trial' ? '14-day trial' : 'Active'}
          />
        </div>
      )}

      {/* Activity chart */}
      {isAdmin && overview?.dailyActivity?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Activity (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={overview.dailyActivity}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="var(--color-primary)" fill="url(#colorActivity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick links for non-admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isAdmin && (
          <>
            <Link to="/analytics" className="card hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">View Analytics</div>
                  <div className="text-sm text-gray-500">Usage trends & insights</div>
                </div>
              </div>
            </Link>
            <Link to="/reports" className="card hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">AI Reports</div>
                  <div className="text-sm text-gray-500">Weekly AI-generated insights</div>
                </div>
              </div>
            </Link>
          </>
        )}

        <Link to="/profile" className="card hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <UsersIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Your Profile</div>
              <div className="text-sm text-gray-500">Update your info</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Tenant info */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-medium text-gray-600">Your Workspace</div>
            <div className="text-lg font-bold text-gray-900">{tenant?.subdomain}.platform.com</div>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${tenant?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {tenant?.status}
            </span>
            <span className="badge bg-indigo-100 text-indigo-700">{tenant?.plan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

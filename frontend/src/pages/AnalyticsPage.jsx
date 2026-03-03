import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C2D12', '#4B5563'];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await analyticsAPI.getOverview({ days });
      setOverview(data.overview);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [days]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Usage data for your workspace</p>
        </div>
        <select
          className="input w-auto"
          value={days}
          onChange={e => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Actions', value: overview?.totalActions ?? 0 },
          { label: 'Unique Users', value: overview?.uniqueUsers ?? 0 },
          { label: 'Top Action', value: overview?.topActions?.[0]?.action ?? 'N/A' },
          { label: 'Action Types', value: overview?.topActions?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Daily Activity */}
      {overview?.dailyActivity?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Daily Activity</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={overview.dailyActivity}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#4F46E5" fill="url(#grad1)" strokeWidth={2} name="Actions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actions bar chart */}
        {overview?.topActions?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Top Actions</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overview.topActions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="action" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Action distribution pie */}
        {overview?.topActions?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Action Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={overview.topActions} dataKey="count" nameKey="action" cx="50%" cy="50%" outerRadius={80} label={({ action, percent }) => `${action} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {overview.topActions.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Users */}
      {overview?.topUsers?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Most Active Users</h2>
          <div className="space-y-3">
            {overview.topUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{u.fullName || u.email}</span>
                    <span className="text-sm text-gray-500">{u.count} actions</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                        width: `${Math.min(100, (u.count / (overview.topUsers[0]?.count || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!overview?.totalActions && (
        <div className="card text-center py-16 text-gray-400">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No activity data yet. Start using your workspace to see analytics here.</p>
        </div>
      )}
    </div>
  );
}

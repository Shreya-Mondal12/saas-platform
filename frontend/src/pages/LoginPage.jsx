import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', subdomain: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.subdomain) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password, form.subdomain);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your workspace</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your workspace details below</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace (subdomain)</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                <input
                  type="text"
                  placeholder="your-company"
                  value={form.subdomain}
                  onChange={e => setForm(f => ({ ...f, subdomain: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm outline-none"
                />
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-l border-gray-300">.platform.com</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Don't have a workspace?{' '}
              <Link to="/register" className="font-medium" style={{ color: 'var(--color-primary)' }}>
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <strong>Demo:</strong> Subdomain: <code>acme</code> · Email: <code>admin@acme.com</code> · Password: <code>Password123!</code>
        </div>
      </div>
    </div>
  );
}

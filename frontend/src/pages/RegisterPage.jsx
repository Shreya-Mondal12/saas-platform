import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tenantAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tenantName: '', subdomain: '', email: '', password: '', firstName: '', lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState(null); // 'available' | 'taken' | null

  const checkSubdomain = async (value) => {
    if (!value || value.length < 3) { setSubdomainStatus(null); return; }
    try {
      const { data } = await tenantAPI.checkSubdomain(value);
      setSubdomainStatus(data.available ? 'available' : 'taken');
    } catch { setSubdomainStatus(null); }
  };

  const handleSubdomainChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setForm(f => ({ ...f, subdomain: clean }));
    clearTimeout(window._subTimer);
    window._subTimer = setTimeout(() => checkSubdomain(clean), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(form).some(v => !v)) { toast.error('All fields required'); return; }
    if (subdomainStatus === 'taken') { toast.error('Subdomain is taken'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Workspace created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-10">
      <div className="w-full max-w-lg fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your workspace</h1>
          <p className="text-gray-500 mt-1 text-sm">Get started with your 14-day free trial</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input className="input" placeholder="Alice" value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input className="input" placeholder="Smith" value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input className="input" placeholder="Acme Corp" value={form.tenantName}
                onChange={e => setForm(f => ({ ...f, tenantName: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace URL</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                <input
                  type="text"
                  placeholder="my-company"
                  value={form.subdomain}
                  onChange={e => handleSubdomainChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm outline-none"
                />
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-l border-gray-300">.platform.com</span>
              </div>
              {subdomainStatus === 'available' && <p className="text-green-600 text-xs mt-1">✓ Available</p>}
              {subdomainStatus === 'taken' && <p className="text-red-500 text-xs mt-1">✗ Already taken</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input className="input" type="password" placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating workspace...' : 'Create Workspace'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Already have a workspace?{' '}
              <Link to="/login" className="font-medium" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

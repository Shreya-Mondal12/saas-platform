import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tenantAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { tenant, updateTenant } = useAuth();
  const [form, setForm] = useState({
    analyticsEnabled: tenant?.settings?.analyticsEnabled ?? true,
    timezone: tenant?.metadata?.timezone || 'UTC',
    industry: tenant?.metadata?.industry || '',
    country: tenant?.metadata?.country || '',
    allowedDomains: (tenant?.settings?.allowedDomains || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await tenantAPI.updateSettings({
        analyticsEnabled: form.analyticsEnabled,
        timezone: form.timezone,
        industry: form.industry,
        country: form.country,
        allowedDomains: form.allowedDomains.split(',').map(d => d.trim()).filter(Boolean),
      });
      updateTenant(data.tenant);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney'];
  const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Media', 'Real Estate', 'Other'];

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your workspace settings</p>
      </div>

      {/* Workspace info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Workspace Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Subdomain</span>
            <div className="font-medium text-gray-900 mt-0.5">{tenant?.subdomain}.platform.com</div>
          </div>
          <div>
            <span className="text-gray-500">Plan</span>
            <div className="font-medium text-gray-900 mt-0.5 capitalize">{tenant?.plan}</div>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <div className={`font-medium mt-0.5 capitalize ${tenant?.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
              {tenant?.status}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Trial Ends</span>
            <div className="font-medium text-gray-900 mt-0.5">
              {tenant?.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* General settings */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">General</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select className="input" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input className="input" placeholder="e.g. United States" value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select className="input" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </div>

      {/* Security settings */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Security</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Email Domains</label>
          <input
            className="input"
            placeholder="example.com, company.org"
            value={form.allowedDomains}
            onChange={e => setForm(f => ({ ...f, allowedDomains: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated. Leave empty to allow all domains.</p>
        </div>
      </div>

      {/* Analytics */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-500 mt-0.5">Enable usage tracking and AI reports</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, analyticsEnabled: !f.analyticsEnabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.analyticsEnabled ? '' : 'bg-gray-200'}`}
            style={form.analyticsEnabled ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.analyticsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

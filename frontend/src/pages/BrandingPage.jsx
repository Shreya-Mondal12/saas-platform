import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tenantAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#4F46E5', secondary: '#7C3AED' },
  { name: 'Emerald', primary: '#059669', secondary: '#0891B2' },
  { name: 'Rose', primary: '#E11D48', secondary: '#DB2777' },
  { name: 'Amber', primary: '#D97706', secondary: '#EA580C' },
  { name: 'Sky', primary: '#0284C7', secondary: '#0891B2' },
  { name: 'Slate', primary: '#334155', secondary: '#475569' },
];

export default function BrandingPage() {
  const { tenant, updateTenant } = useAuth();
  const [form, setForm] = useState({
    primaryColor: tenant?.branding?.primaryColor || '#4F46E5',
    secondaryColor: tenant?.branding?.secondaryColor || '#7C3AED',
    companyName: tenant?.branding?.companyName || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(tenant?.branding?.logoUrl || null);
  const fileRef = useRef();

  const applyPreset = (preset) => {
    setForm(f => ({ ...f, primaryColor: preset.primary, secondaryColor: preset.secondary }));
    document.documentElement.style.setProperty('--color-primary', preset.primary);
    document.documentElement.style.setProperty('--color-secondary', preset.secondary);
  };

  const handleColorChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (field === 'primaryColor') document.documentElement.style.setProperty('--color-primary', val);
    if (field === 'secondaryColor') document.documentElement.style.setProperty('--color-secondary', val);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await tenantAPI.updateBranding(form);
      updateTenant(data.tenant);
      toast.success('Branding updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const { data } = await uploadAPI.uploadLogo(file);
      setLogoPreview(data.logoUrl);
      // Refresh tenant
      const { data: td } = await tenantAPI.getCurrent();
      updateTenant(td.tenant);
      toast.success('Logo uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-sm text-gray-500">Customize your workspace appearance</p>
      </div>

      {/* Company name */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Company Info</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            className="input"
            value={form.companyName}
            onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
            placeholder="Acme Corp"
          />
        </div>
      </div>

      {/* Logo */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Logo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <PhotoIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG up to 5MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Colors</h2>

        {/* Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:border-gray-400 transition-colors"
              >
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondary }} />
                </div>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={e => handleColorChange('primaryColor', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200 p-0.5"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={e => handleColorChange('primaryColor', e.target.value)}
                className="input flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={e => handleColorChange('secondaryColor', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200 p-0.5"
              />
              <input
                type="text"
                value={form.secondaryColor}
                onChange={e => handleColorChange('secondaryColor', e.target.value)}
                className="input flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Preview</p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
              Primary Button
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: form.primaryColor, color: form.primaryColor }}>
              Outline Button
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: form.secondaryColor }}>
              AV
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}

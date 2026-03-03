import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CameraIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateMe(form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setChangingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setChangingPw(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const { data } = await uploadAPI.uploadAvatar(file);
      setAvatarPreview(data.avatarUrl);
      updateUser({ ...user, avatar: data.avatarUrl });
      toast.success('Avatar updated');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-sm text-gray-500">Manage your account info</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary)' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50"
          >
            <CameraIcon className="w-4 h-4 text-gray-600" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
          <div className="text-sm text-gray-500">{user?.email}</div>
          <div className="text-xs text-gray-400 capitalize mt-0.5">
            {user?.role} · {user?.loginCount || 0} total logins
          </div>
        </div>
      </div>

      {/* Edit info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="input bg-gray-50" value={user?.email || ''} disabled />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>
        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Change Password</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input className="input" type="password" value={passwords.currentPassword}
            onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input className="input" type="password" value={passwords.newPassword}
            onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input className="input" type="password" value={passwords.confirmPassword}
            onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
        </div>
        <button onClick={handleChangePassword} disabled={changingPw} className="btn-primary">
          {changingPw ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Session info */}
      <div className="card bg-gray-50">
        <h2 className="font-semibold text-gray-900 mb-3">Session Info</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First session'}</div>
          <div>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
        </div>
      </div>
    </div>
  );
}

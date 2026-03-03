import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const RoleBadge = ({ role }) => {
  const colors = { admin: 'bg-indigo-100 text-indigo-700', user: 'bg-gray-100 text-gray-600', superadmin: 'bg-red-100 text-red-700' };
  return <span className={`badge ${colors[role] || colors.user}`}>{role}</span>;
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll({ page, limit: 20, search: search || undefined });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) { toast.error('Fill required fields'); return; }
    if (!editing && !form.password) { toast.error('Password required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const update = { firstName: form.firstName, lastName: form.lastName, role: form.role };
        await userAPI.update(editing._id, update);
        toast.success('User updated');
      } else {
        await userAPI.create(form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await userAPI.delete(id);
      toast.success('User deleted');
      fetchUsers(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const toggleActive = async (user) => {
    try {
      await userAPI.update(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers(1);
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{pagination.total ?? 0} total users</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: 'var(--color-secondary)' }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span className="font-medium text-sm text-gray-900">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(user)} className={`badge cursor-pointer ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(user)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => fetchUsers(p)}
                  className={`px-3 py-1 text-sm rounded ${p === pagination.page ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                  style={p === pagination.page ? { backgroundColor: 'var(--color-primary)' } : {}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 fade-in">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit User' : 'Create User'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input className="input mt-1" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input className="input mt-1" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input className="input mt-1" type="email" value={form.email} disabled={!!editing}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              {!editing && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <input className="input mt-1" type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select className="input mt-1" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

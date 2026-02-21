import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, ShieldOff, Save, Loader2 } from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" />
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-50/30">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-sm text-slate-500">
          Manage roles and data access scopes for all employees.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Assigned Domains</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <UserRow key={user._id} user={user} onRefresh={fetchUsers} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserRow = ({ user, onRefresh }) => {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Confirmation before promoting
    if (user.role !== "Admin" && role === "Admin") {
      const confirmPromote = window.confirm(
        `Are you sure you want to promote ${user.username} to Admin?`
      );
      if (!confirmPromote) return;
    }

    // Confirmation before deactivation
    if (user.isActive && !isActive) {
      const confirmDeactivate = window.confirm(
        `Are you sure you want to deactivate ${user.username}?`
      );
      if (!confirmDeactivate) return;
    }

    try {
      setSaving(true);
      await api.put(`/admin/users/${user._id}`, {
        role,
        isActive
      });
      onRefresh();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 font-medium text-slate-700">
        {user.username}
      </td>

      <td className="px-6 py-4">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-transparent outline-none font-medium text-brand-600"
        >
          <option value="Analyst">Analyst</option>
          <option value="Admin">Admin</option>
        </select>
      </td>

      <td className="px-6 py-4 text-slate-500">
        {(user.assignedDomains || []).join(', ')}
      </td>

      <td className="px-6 py-4">
        <button
          onClick={() => setIsActive(prev => !prev)}
          className="flex items-center gap-2 text-sm"
        >
          {isActive ? (
            <>
              <ShieldCheck className="text-emerald-500 h-5 w-5" />
              <span className="text-emerald-600">Active</span>
            </>
          ) : (
            <>
              <ShieldOff className="text-red-400 h-5 w-5" />
              <span className="text-red-500">Inactive</span>
            </>
          )}
        </button>
      </td>

      <td className="px-6 py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <Save size={16} />
          )}
          Save
        </button>
      </td>
    </tr>
  );
};
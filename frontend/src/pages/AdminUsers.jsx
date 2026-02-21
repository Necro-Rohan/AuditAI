import React, { useState, useEffect } from "react";
import api from "../services/api";
import { ShieldCheck, ShieldOff, Save, Loader2 } from "lucide-react";

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [categories, setCategories] = useState((users.assignedCategories || []).join(', '));
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data);
      // setCategories((res.data.assignedCategories || []).join(', '));
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
      <div className="m-4 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full bg-slate-50/30">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          User Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage roles and data access scopes for all employees.
        </p>
      </div>

      {/* Added horizontal scroll wrapper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4">User</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Role</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Assigned Categories</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Assigned Domains</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
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
  const [categories, setCategories] = useState(
    (user.assignedCategories || []).join(", "),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (user.role !== "Admin" && role === "Admin") {
      const confirmPromote = window.confirm(
        `Are you sure you want to promote ${user.username} to Admin?`,
      );
      if (!confirmPromote) return;
    }

    if (user.isActive && !isActive) {
      const confirmDeactivate = window.confirm(
        `Are you sure you want to deactivate ${user.username}?`,
      );
      if (!confirmDeactivate) return;
    }

    try {
      setSaving(true);
      const categoryArray = categories
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c !== "");

      await api.put(`/admin/users/permissions/${user._id}`, {
        role,
        assignedCategories: categoryArray,
        isActive,
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
      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700 whitespace-nowrap">
        {user.username}
      </td>

      <td className="px-2 py-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-transparent outline-none font-medium text-brand-600 w-full"
        >
          <option value="Analyst">Analyst</option>
          <option value="Admin">Admin</option>
        </select>
      </td>

      <td className="px-4 sm:px-6 py-3 sm:py-4">
        {user.role === "Admin" ? (
          <div className="text-xs text-slate-500 italic">
            Admins have access to all categories.
          </div>
        ) : ( 
        <input
          type="text"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          className="border rounded px-2 py-1 w-full text-sm"
          placeholder="comma separated categories"
        />
        )}
      </td>
      

      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 whitespace-nowrap">
        {user.role === "Admin" ? (
          <div className="text-xs text-slate-500 italic">
            Admins have access to all domains.
          </div>
        ) : (
        (user.assignedDomains || []).join(", ")
        )}
      </td>

      <td className="px-4 sm:px-6 py-3 sm:py-4">
        <button
          onClick={() => setIsActive((prev) => !prev)}
          className="flex items-center gap-2 text-sm"
        >
          {isActive ? (
            <>
              <ShieldCheck className="text-emerald-500 h-5 w-5" />
              <span className="text-emerald-600 hidden sm:inline">Active</span>
            </>
          ) : (
            <>
              <ShieldOff className="text-red-400 h-5 w-5" />
              <span className="text-red-500 hidden sm:inline">Inactive</span>
            </>
          )}
        </button>
      </td>

      <td className="px-4 sm:px-6 py-3 sm:py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <Save size={16} />
          )}
          <span className="hidden sm:inline">Save</span>
        </button>
      </td>
    </tr>
  );
};
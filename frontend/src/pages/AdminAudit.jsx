import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Terminal, User, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/audit-logs");
        setLogs(res.data || []);
      } catch (err) {
        console.error('Fetch Audit Logs Error:', err);
        setError("Failed to load security logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" />
        Fetching security audits...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        No security violations recorded.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Security Audit Logs</h1>
        <p className="text-sm text-slate-500">
          Real-time monitoring of RBAC violations and access attempts.
        </p>
      </div>

      <div className="space-y-3">
        {logs.map(log => {
          const isExpanded = expandedId === log._id;

          return (
            <div
              key={log._id}
              className="bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm"
            >
              {/* Header */}
              <div
                onClick={() => toggleExpand(log._id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 p-2 rounded-lg">
                    <ShieldAlert className="text-red-500" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {log.action || "Security Event"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User size={12} />
                      {log.user || "Unknown"} ({log.userRole || "Unknown"})
                      <Terminal size={12} className="ml-2" />
                      Attempted: {log.attemptedDomain || "-"} / {log.attemptedCategory || "-"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs font-mono text-slate-400 hidden sm:block">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-500" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 text-sm text-slate-600 space-y-2">
                  <div>
                    <strong>User ID:</strong> {log.userId || "N/A"}
                  </div>
                  <div>
                    <strong>Type:</strong> {log.type || "N/A"}
                  </div>
                  <div>
                    <strong>Attempted Domain:</strong> {log.attemptedDomain || "N/A"}
                  </div>
                  <div>
                    <strong>Attempted Category:</strong> {log.attemptedCategory || "N/A"}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date(log.createdAt).toLocaleString()}
                  </div>

                  {/* Raw JSON View */}
                  <div className="bg-slate-50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    {JSON.stringify(log, null, 2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { FileText, BarChart3, Clock, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Reports = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Filters & Pagination
  const [filters, setFilters] = useState({ domain: 'all', category: 'all', intent: 'all' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports', {
        params: { ...filters, page, limit: 9 } // 9 fits perfectly in a 3x3 grid
      });
      setReports(res.data.reports);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when filters or page changes
  useEffect(() => {
    fetchReports();
  }, [filters, page]);

  // Handle filter changes and reset to page 1
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); 
  };

  return (
    <div className="flex h-full flex-col space-y-6 p-6 overflow-y-auto">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Report Library</h1>
          <p className="text-sm text-slate-500">View and filter historical AI analysis.</p>
        </div>

        <div className="flex gap-3">
          <select 
            value={filters.intent} 
            onChange={(e) => handleFilterChange('intent', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Types</option>
            <option value="summary">AI Summaries</option>
            <option value="chart">NPS Charts</option>
          </select>
          {/* Add Domain/Category selects here if you want them identical to the Workspace ones! */}
        </div>
      </div>

      {/* REPORT GRID */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl">
          <LayoutDashboard className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No reports found for these filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report._id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${report.responseType === 'chart' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {report.responseType === 'chart' ? <BarChart3 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {report.domainAtTime} • {report.categoryAtTime}
                  </span>
                </div>
              </div>
              
              <h3 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2">{report.query}</h3>
              
              <div className="flex-1 text-sm text-slate-600 mb-4 line-clamp-3 prose prose-sm">
                {report.responseType === 'summary' 
                  ? <ReactMarkdown skipHtml>{report.finalResponse?.data || ""}</ReactMarkdown>
                  : "Trend analysis data available."}
              </div>

              <div className="mt-auto flex items-center gap-2 text-xs font-medium text-slate-400 border-t border-slate-100 pt-3">
                <Clock className="h-3 w-3" />
                {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-slate-600">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
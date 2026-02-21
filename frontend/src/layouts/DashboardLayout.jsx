import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ROLES } from '../config/constants.js';
import { 
  BarChart2, 
  MessageSquare, 
  FileText, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Bell,
  User,
  Menu, 
  X
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation(); // To highlight the active menu item
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper function to check if a link is active
  const isActive = (path) => location.pathname.startsWith(path);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Common styling for navigation links
  const linkClass = (path) => `
    flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
    ${isActive(path) 
      ? 'bg-brand-50 text-brand-600' 
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
  `;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white 
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0
      `}>
        {/* Brand Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <BarChart2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">AuditAI</span>
          </div>
          {/* Close button for mobile only */}
          <button 
            className="text-slate-500 hover:text-slate-700 md:hidden"
            onClick={closeMobileMenu}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Main Menu */}
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
            <div className="space-y-1">
              <Link to="/workspace" onClick={closeMobileMenu} className={linkClass('/workspace')}>
                <MessageSquare className="h-4 w-4" />
                Analyst Chat
              </Link>
              <Link to="/reports" onClick={closeMobileMenu} className={linkClass('/reports')}>
                <FileText className="h-4 w-4" />
                Past Reports
              </Link>
            </div>
          </div>

          {/* Admin Menu (Only visible to Admins) */}
          {user?.role === ROLES.ADMIN && (
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Administration
              </p>
              <div className="space-y-1">
                <Link to="/admin/users" onClick={closeMobileMenu} className={linkClass('/admin/users')}>
                  <Users className="h-4 w-4" />
                  User Directory
                </Link>
                <Link to="/admin/audit" onClick={closeMobileMenu} className={linkClass('/admin/audit')}>
                  <ShieldAlert className="h-4 w-4" />
                  Security Logs
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom User Area */}
        <div className="border-t border-slate-200 p-4 shrink-0">
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        
        {/* TOPBAR */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-4">
            {/* Hamburger Button (Mobile Only) */}
            <button 
              className="text-slate-500 hover:text-slate-700 md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Breadcrumbs (Hidden on very small screens) */}
            <div className="hidden sm:block text-sm font-medium text-slate-500">
              {location.pathname === '/workspace' && 'Analyst Chat / Workspace'}
              {location.pathname === '/reports' && 'Past Reports / Library'}
              {location.pathname.includes('/admin') && 'Executive Console / Admin'}
            </div>
          </div>

          {/* User Profile & Notifications */}
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
                <User className="h-4 w-4" />
              </div>
              {/* Hide text on mobile to save space */}
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-semibold leading-none">{user?.username}</span>
                <span className="text-xs text-slate-500 mt-1">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT GOES HERE */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
          <Outlet /> {/* <-- This is where Workspace.jsx or Reports.jsx renders */}
        </main>
      </div>

    </div>
  );
};
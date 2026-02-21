import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-brand-500 animate-pulse text-lg font-medium">Authenticating...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required (e.g., Admin only)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/workspace" replace />; // Kick.. unauthorized users to their default view
  }

  return <Outlet />;
};
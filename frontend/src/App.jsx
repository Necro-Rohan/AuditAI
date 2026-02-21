import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { PublicRoute } from './components/auth/PublicRoute.jsx';
import { ROLES } from './config/constants.js';
import { Login } from './pages/LoginPage.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';
import { Workspace } from './pages/WorkSpaces.jsx';
import { Reports } from './pages/Reports.jsx';
import { AdminUsers } from './pages/AdminUsers.jsx';
import { AdminAudit } from './pages/AdminAudit.jsx';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes (All Logged-in Users) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/reports" element={<Reports />} />

              {/* Admin-only */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
              </Route>

              {/* Default redirect for logged in users */}
              <Route path="/" element={<Navigate to="/workspace" replace />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

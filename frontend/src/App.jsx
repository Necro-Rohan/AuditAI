import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { PublicRoute } from './components/auth/PublicRoute.jsx';
import { ROLES } from './config/constants.js';
import { Login } from './pages/login.jsx';

//pages to build
// const Login = () => <div className="p-8">Login Page (To do)</div>;
const Workspace = () => <div className="p-8">Analyst Workspace</div>;
const Reports = () => <div className="p-8">Past Reports</div>;
const AdminUsers = () => <div className="p-8">Admin: User Management</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes (All Logged-in Users) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/reports" element={<Reports />} />

            {/* Default redirect for logged in users */}
            <Route path="/" element={<Navigate to="/workspace" replace />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

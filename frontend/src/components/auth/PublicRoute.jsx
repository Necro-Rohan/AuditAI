import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

export const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-brand-500 font-medium">
          Checking authentication...
        </div>
      </div>
    )
  };

  if (user) {
    return <Navigate to="/workspace" replace />;
  }

  return children;
};

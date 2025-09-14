// src/auth/ProtectedRoute.jsx - Guard private routes
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ roles = [], children }) {
  const auth = useAuth();

  // Let AuthGate handle loading state
  if (auth.status === "loading") return null;
  
  if (auth.status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (roles.length > 0 && auth.user?.roles) {
    const hasRequiredRole = roles.some(role => 
      auth.user.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/403" replace />;
    }
  }

  // Return children if provided, otherwise use Outlet for nested routes
  return children || <Outlet />;
}
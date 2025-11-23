// src/auth/ProtectedRoute.jsx - Guard private routes with Redux
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus, selectUser, selectHasAnyRole } from "../store/authSlice";

export default function ProtectedRoute({ roles = [], children }) {
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectUser);
  const hasRequiredRole = useSelector(state => 
    roles.length > 0 ? selectHasAnyRole(state, roles) : true
  );

  // Let AuthGate handle loading state
  if (status === "loading") return null;
  
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (roles.length > 0 && !hasRequiredRole) {
    return <Navigate to="/403" replace />;
  }

  // Return children if provided, otherwise use Outlet for nested routes
  return children || <Outlet />;
}
// src/auth/PublicOnlyRoute.jsx - Keep authenticated users away from login
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function PublicOnlyRoute({ redirectTo = "/marketplace", children }) {
  const auth = useAuth();
  
  // Let AuthGate handle loading state  
  if (auth.status === "loading") return null;
  
  if (auth.status === "authenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  // Return children if provided, otherwise use Outlet for nested routes
  return children || <Outlet />;
}
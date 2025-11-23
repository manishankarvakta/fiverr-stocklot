// src/auth/PublicOnlyRoute.jsx - Keep authenticated users away from login (Redux)
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "../store/authSlice";

export default function PublicOnlyRoute({ redirectTo = "/marketplace", children }) {
  const status = useSelector(selectAuthStatus);
  
  // Let AuthGate handle loading state  
  if (status === "loading") return null;
  
  if (status === "authenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  // Return children if provided, otherwise use Outlet for nested routes
  return children || <Outlet />;
}
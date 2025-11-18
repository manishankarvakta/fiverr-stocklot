const { useAuth } = require("@/auth/AuthProvider");
const { default: AdminLayoutWithSidebar } = require("../admin/AdminLayout");

function AdminDashboardRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login with admin redirect parameter
    window.location.href = '/login?redirect=admin';
    return null;
  }
  
  return <AdminLayoutWithSidebar user={user} />;
}
export default AdminDashboardRoute;
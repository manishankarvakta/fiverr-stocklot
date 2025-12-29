import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from '../../auth/AuthProvider';
import Sidebar from "./Sidebar";

import {
  Menu,
  Bell,
  User,
  Search,
  CreditCard,
  MapPin,
  LayoutDashboard,
  MessageCircle,
  ShoppingCart,
  Users,
  LogOut,
  Shield,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui";

/* ---------------- User Trigger ---------------- */
const UserTrigger = ({ user }) => {

  const name = user?.full_name || user?.name || "User";
  console.log("User name:", name);
  const roles = user?.roles || [];
  const firstLetter = (name && name.length > 0) ? name.charAt(0).toUpperCase() : "U";
  
  return (
    <div className="flex items-center gap-3 px-2 py-1 hover:bg-gray-100 rounded-lg cursor-pointer">
      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold">
        {firstLetter}
      </div>

      <div className="hidden md:flex flex-col leading-tight">
        <span className="text-sm font-medium">{name}</span>
        <div className="flex gap-1">
          {roles.includes("buyer") && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700">
              Buyer
            </span>
          )}
          {roles.includes("seller") && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700">
              Seller
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- Dashboard Layout ---------------- */
const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, switchRole, status } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Prevent rendering before user loads
  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const roles = user?.roles || [];
  const isAdmin = roles.includes("admin");
  const isSeller = roles.includes("seller");
  const isBuyer = roles.includes("buyer");
  
  const currentRole = isAdmin ? 'admin' : isSeller ? 'seller' : 'buyer';
  const [activeRole, setActiveRole] = useState(currentRole);
  // Derive current role (admin > seller > buyer)

  const toggleSidebar = () => setSidebarCollapsed((p) => !p);

  // const handleRoleSwitch = async () => {
  //   try {
  //     const newRole = isSeller ? 'buyer' : 'seller';
  //     await switchRole(newRole);
  //     // UI will update automatically due to state change
  //   } catch (error) {
  //     console.error('Failed to switch role:', error);
  //     // Could add toast notification here
  //   }
  // };
 const handleRoleSwitch = async () => {
  try {
    const newRole = activeRole === 'seller' ? 'buyer' : 'seller';
    await switchRole(newRole);
    setActiveRole(newRole); // update local state
    navigate("/dashboard"); // redirect to /dashboard
  } catch (error) {
    console.error('Failed to switch role:', error);
  }
};

  const handleLogout = () => {
    // logout logic here
    navigate("/marketplace");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar
          userRole={activeRole}
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Main */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Header */}
        <header className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm w-80"
                />
              </div> */}
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button>
                    <UserTrigger user={user} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleRoleSwitch}>
                    <User className="mr-2 h-4 w-4" />
                    {isSeller ? "Switch to Buyer" : "Switch to Seller"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/payment-methods")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Methods
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/addresses")}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Addresses
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* <DropdownMenuItem 
                    onClick={() => navigate(userRole === 'seller' ? '/seller/dashboard' : '/buyer/dashboard')}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem> */}
                  {/* <DropdownMenuItem 
                    onClick={() => navigate(currentRole === 'seller' ? '/seller/dashboard' : '/buyer/dashboard')}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem> */}
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>


                  <DropdownMenuItem onClick={() => navigate("/inbox")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>

                  {isBuyer && (
                    <DropdownMenuItem onClick={() => navigate("/buy-requests")}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Requests
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => navigate("/referrals")}>
                    <Users className="mr-2 h-4 w-4" />
                    Referrals
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/admin/dashboard")}
                        className="text-red-600"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panela
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

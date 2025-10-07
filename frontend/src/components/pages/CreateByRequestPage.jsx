import { useAuth } from "@/auth/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EnhancedCreateBuyRequestForm from "../buyRequests/EnhancedCreateBuyRequestForm";

function CreateBuyRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <p className="text-emerald-700">Please log in to create buy requests</p>
        </div>
      </div>
    );
  }

  const handleRequestCreated = (newRequestId) => {
    // Show success message and redirect
    alert('Enhanced buy request created successfully with comprehensive details!');
    navigate('/buy-requests');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">Create Enhanced Buy Request</h1>
          <p className="text-emerald-700">Post a comprehensive request with images, requirements, and detailed specifications</p>
        </div>
        
        <EnhancedCreateBuyRequestForm onCreated={handleRequestCreated} />
      </div>
    </div>
  );
};
export default CreateBuyRequestPage; 
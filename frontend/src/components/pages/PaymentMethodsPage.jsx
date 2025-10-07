import { useAuth } from "@/auth/AuthProvider";
import PaymentMethodsForm from "../PaymentMethodsForm";

function PaymentMethodsPage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to manage your payment methods.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-emerald-900">Payment Methods</h1>
            <p className="text-emerald-700">Manage your South African banking details for payments and payouts</p>
          </div>
          
          <PaymentMethodsForm user={user} />
        </div>
      </div>
    </div>
  );
}
export default PaymentMethodsPage;
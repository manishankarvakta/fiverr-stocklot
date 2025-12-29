import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-gray-800">404</h1>

        <h2 className="mt-4 text-2xl font-semibold text-gray-700">
          Page Not Found
        </h2>

        <p className="mt-2 text-gray-500">
          Sorry, the page you’re looking for doesn’t exist or has been moved.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800 transition"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>

        <div className="mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:underline"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

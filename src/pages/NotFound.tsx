
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-6">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button 
          size="lg"
          onClick={() => navigate("/")}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;


import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Dashboard = () => {
  const { isLoggedIn, isStaff } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    
    if (isStaff) {
      navigate("/staff");
      return;
    }
    
    // This would be replaced with actual dashboard implementation
    toast.info("User dashboard will be implemented in the next phase");
  }, [isLoggedIn, isStaff, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">User Dashboard</h1>
        <p className="text-lg text-gray-600 mt-4">
          This page will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;


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
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>User Dashboard</h1>
        <p>
          This page will be implemented in the next phase.
        </p>
      </div>

      <style>
        {`
        .dashboard {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(to bottom right, #eef2ff, #faf5ff);
        }
        
        .dashboard-content {
          text-align: center;
        }
        
        h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
        }
        
        p {
          font-size: 1.125rem;
          color: #4b5563;
          margin-top: 1rem;
        }
        `}
      </style>
    </div>
  );
};

export default Dashboard;

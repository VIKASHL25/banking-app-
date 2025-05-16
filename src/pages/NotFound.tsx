
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate("/")}
        >
          Go Home
        </button>
      </div>

      <style jsx>{`
        .not-found {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(to bottom right, #eef2ff, #faf5ff);
          padding: 0 1rem;
        }
        
        .not-found-content {
          text-align: center;
        }
        
        h1 {
          font-size: 3.75rem;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 1.5rem;
        }
        
        h2 {
          font-size: 1.875rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }
        
        p {
          font-size: 1.125rem;
          color: #4b5563;
          margin-bottom: 2rem;
          max-width: 28rem;
          margin-left: auto;
          margin-right: auto;
        }
        
        .btn-primary {
          background-color: #4f46e5;
          color: white;
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
        }
        
        .btn-primary:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
};

export default NotFound;

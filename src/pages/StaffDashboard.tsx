
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, XCircle, UserCheck } from "lucide-react";

// API URL
const API_URL = "http://localhost:5000/api";

// Format currency utility
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

interface PendingLoan {
  id: number;
  userName: string;
  userId: number;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  dueDate: string;
  createdAt: string;
}

const StaffDashboard = () => {
  const { staff, token, logout, isLoggedIn, isStaff } = useAuth();
  const navigate = useNavigate();
  
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Check if staff is logged in
  useEffect(() => {
    if (!isLoggedIn || !isStaff) {
      navigate("/");
      return;
    }
    
    fetchPendingLoans();
  }, [isLoggedIn, isStaff, navigate]);
  
  // Fetch pending loans
  const fetchPendingLoans = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/staff/loans/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending loans');
      }
      
      const data = await response.json();
      setPendingLoans(data.pendingLoans);
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      toast.error("Failed to load pending loans");
    } finally {
      setLoading(false);
    }
  };
  
  // Process loan (approve or reject)
  const processLoan = async (loanId: number, action: 'approve' | 'reject') => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/staff/loans/${loanId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} loan`);
      }
      
      const data = await response.json();
      setPendingLoans(data.pendingLoans);
      
      toast.success(action === 'approve' 
        ? "Loan approved successfully" 
        : "Loan rejected successfully"
      );
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error);
      toast.error((error as Error).message || `Failed to ${action} loan`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">SV Bank Staff Portal</h1>
              <p className="text-sm text-blue-200">Loan Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold">{staff?.name}</p>
                <p className="text-sm text-blue-200">{staff?.role}</p>
              </div>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Loan Applications</h2>
            <p className="text-gray-600">Review and process customer loan applications</p>
          </div>
          <Button
            onClick={fetchPendingLoans}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            Refresh List
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-blue-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {pendingLoans.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Pending Applications</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    There are no loan applications waiting for your review at the moment.
                    Check back later or refresh the list.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingLoans.map((loan) => (
                  <Card key={loan.id} className="overflow-hidden border-t-4 border-t-blue-500">
                    <CardHeader className="bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="capitalize">{loan.loanType} Loan</CardTitle>
                          <CardDescription className="mt-1 flex items-center">
                            <UserCheck className="h-4 w-4 mr-1" />
                            {loan.userName}
                          </CardDescription>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-xs font-semibold py-1 px-2 rounded">
                          PENDING
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500">Principal Amount</p>
                          <p className="font-semibold text-lg">{formatCurrency(loan.principalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Interest Rate</p>
                          <p className="font-semibold text-lg">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-semibold">{new Date(loan.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Applied On</p>
                          <p className="font-semibold">{new Date(loan.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        <Button
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50 flex items-center"
                          onClick={() => processLoan(loan.id, 'reject')}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 flex items-center"
                          onClick={() => processLoan(loan.id, 'approve')}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} SV Bank Staff Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;

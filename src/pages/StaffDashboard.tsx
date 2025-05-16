import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, XCircle, UserCheck } from "lucide-react";

// API URL
const API_URL = "http://localhost:5000/api";

// Format currency utility with Rupee symbol
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #f8fafc, #e0f2fe)" }}>
      {/* Header */}
      <header style={{ 
        width: "100%", 
        background: "linear-gradient(to right, #1e40af, #1e3a8a)", 
        color: "white", 
        padding: "1rem 0", 
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" 
      }}>
        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "0 1rem" 
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <div>
              <h1 style={{ 
                fontSize: "1.5rem", 
                fontWeight: "bold" 
              }}>SV Bank Staff Portal</h1>
              <p style={{ 
                fontSize: "0.875rem", 
                color: "#bfdbfe" 
              }}>Loan Management System</p>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "1rem" 
            }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: "600" }}>{staff?.name}</p>
                <p style={{ 
                  fontSize: "0.875rem", 
                  color: "#bfdbfe" 
                }}>{staff?.role}</p>
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
      <main style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        padding: "2rem 1rem" 
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          marginBottom: "2rem" 
        }}>
          <div>
            <h2 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "bold", 
              color: "#1f2937" 
            }}>Loan Applications</h2>
            <p style={{ color: "#4b5563" }}>Review and process customer loan applications</p>
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
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            padding: "3rem 0" 
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "4rem", 
                height: "4rem", 
                border: "4px solid #2563eb", 
                borderTopColor: "transparent", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite", 
                margin: "0 auto 1rem auto" 
              }}></div>
              <p style={{ 
                fontSize: "1.25rem", 
                color: "#2563eb" 
              }}>Loading...</p>
              <style>
                {`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          </div>
        ) : (
          <>
            {pendingLoans.length === 0 ? (
              <Card style={{ 
                border: "2px dashed #d1d5db", 
                borderRadius: "0.5rem" 
              }}>
                <CardContent style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  padding: "3rem" 
                }}>
                  <AlertCircle style={{ 
                    height: "3rem", 
                    width: "3rem", 
                    color: "#3b82f6", 
                    marginBottom: "1rem" 
                  }} />
                  <h3 style={{ 
                    fontSize: "1.25rem", 
                    fontWeight: "600", 
                    marginBottom: "0.5rem" 
                  }}>No Pending Applications</h3>
                  <p style={{ 
                    color: "#6b7280", 
                    textAlign: "center", 
                    maxWidth: "28rem" 
                  }}>
                    There are no loan applications waiting for your review at the moment.
                    Check back later or refresh the list.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 24rem), 1fr))", 
                gap: "1.5rem" 
              }}>
                {pendingLoans.map((loan) => (
                  <Card key={loan.id} style={{ 
                    overflow: "hidden", 
                    borderTop: "4px solid #3b82f6", 
                    borderRadius: "0.5rem" 
                  }}>
                    <CardHeader style={{ background: "#f9fafb" }}>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "flex-start" 
                      }}>
                        <div>
                          <CardTitle style={{ 
                            textTransform: "capitalize" 
                          }}>{loan.loanType} Loan</CardTitle>
                          <CardDescription style={{ 
                            marginTop: "0.25rem", 
                            display: "flex", 
                            alignItems: "center" 
                          }}>
                            <UserCheck style={{ 
                              height: "1rem", 
                              width: "1rem", 
                              marginRight: "0.25rem" 
                            }} />
                            {loan.userName}
                          </CardDescription>
                        </div>
                        <span style={{ 
                          background: "#fef3c7", 
                          color: "#92400e", 
                          fontSize: "0.75rem", 
                          fontWeight: "600", 
                          padding: "0.25rem 0.5rem", 
                          borderRadius: "0.25rem" 
                        }}>
                          PENDING
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent style={{ paddingTop: "1.5rem" }}>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gap: "1rem", 
                        marginBottom: "1.5rem" 
                      }}>
                        <div>
                          <p style={{ 
                            fontSize: "0.875rem", 
                            color: "#6b7280" 
                          }}>Principal Amount</p>
                          <p style={{ 
                            fontWeight: "600", 
                            fontSize: "1.125rem" 
                          }}>{formatCurrency(loan.principalAmount)}</p>
                        </div>
                        <div>
                          <p style={{ 
                            fontSize: "0.875rem", 
                            color: "#6b7280" 
                          }}>Interest Rate</p>
                          <p style={{ 
                            fontWeight: "600", 
                            fontSize: "1.125rem" 
                          }}>{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p style={{ 
                            fontSize: "0.875rem", 
                            color: "#6b7280" 
                          }}>Due Date</p>
                          <p style={{ fontWeight: "600" }}>{new Date(loan.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p style={{ 
                            fontSize: "0.875rem", 
                            color: "#6b7280" 
                          }}>Applied On</p>
                          <p style={{ fontWeight: "600" }}>{new Date(loan.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        marginTop: "1rem" 
                      }}>
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
      <footer style={{ 
        background: "#1f2937", 
        color: "white", 
        padding: "1.5rem 0" 
      }}>
        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "0 1rem", 
          textAlign: "center" 
        }}>
          <p>&copy; {new Date().getFullYear()} SV Bank Staff Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;

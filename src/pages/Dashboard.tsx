import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// API URL
const API_URL = "http://localhost:5000/api";

const Dashboard = () => {
  const { user, token, logout, isLoggedIn, isStaff } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  // State for user profile data
  const [profileData, setProfileData] = useState({
    name: "",
    accountNumber: "",
    accountType: "",
    balance: 0,
    transactions: [] as any[],
    loans: [] as any[]
  });
  
  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: "deposit",
    amount: ""
  });
  
  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    recipientAccountNumber: "",
    amount: ""
  });
  
  // Loan form state
  const [loanForm, setLoanForm] = useState({
    loanType: "personal",
    principalAmount: "",
    interestRate: "5.5",
    dueDate: ""
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Handle logout and redirect to home
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Handle staff login navigation
  const handleStaffLogin = () => {
    logout(); // First logout from current user session
    navigate("/"); // Navigate to home page
  };
  
  // Fetch profile data
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    
    if (isStaff) {
      navigate("/staff");
      return;
    }
    
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfile();
  }, [isLoggedIn, navigate, token, isStaff]);
  
  // Process transaction
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transaction failed');
      }
      
      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        balance: data.balance,
        transactions: data.transactions
      }));
      
      toast.success(`${transactionForm.type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
      
      // Clear form
      setTransactionForm({
        type: "deposit",
        amount: ""
      });
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error((error as Error).message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };
  
  // Process transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientAccountNumber: transferForm.recipientAccountNumber,
          amount: parseFloat(transferForm.amount)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transfer failed');
      }
      
      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        balance: data.balance,
        transactions: data.transactions
      }));
      
      toast.success("Transfer successful!");
      
      // Clear form
      setTransferForm({
        recipientAccountNumber: "",
        amount: ""
      });
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error((error as Error).message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };
  
  // Apply for loan
  const handleLoanApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/loans/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          loanType: loanForm.loanType,
          principalAmount: parseFloat(loanForm.principalAmount),
          interestRate: parseFloat(loanForm.interestRate),
          dueDate: loanForm.dueDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Loan application failed');
      }
      
      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        loans: data.loans
      }));
      
      toast.success("Loan application submitted successfully!");
      
      // Clear form
      setLoanForm({
        loanType: "personal",
        principalAmount: "",
        interestRate: "5.5",
        dueDate: ""
      });
    } catch (error) {
      console.error("Loan application error:", error);
      toast.error((error as Error).message || "Loan application failed");
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full gradient-primary py-4 px-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">SV Bank</h1>
              <span className="ml-4 text-white opacity-80">Welcome, {user?.name || profileData.name}</span>
            </div>
            <div className="space-x-4">
              <Button variant="ghost" className="text-white hover:bg-white/20" onClick={handleStaffLogin}>
                Staff Login
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/20" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle>Account Balance</CardTitle>
              <CardDescription className="text-white/80">Current available balance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{formatCurrency(profileData.balance)}</div>
              <p className="text-gray-500 mt-2">Account: {profileData.accountNumber}</p>
              <p className="text-gray-500">Type: {profileData.accountType}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {profileData.transactions.slice(0, 3).map((transaction, index) => (
                <div key={index} className={`flex justify-between items-center py-2 ${index !== 0 ? 'border-t' : ''}`}>
                  <div>
                    <p className="font-medium">{transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
                    <p className="text-gray-500 text-sm">{formatDate(transaction.date)}</p>
                  </div>
                  <div className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
              {profileData.transactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Loan Status</CardTitle>
              <CardDescription>Your active loans</CardDescription>
            </CardHeader>
            <CardContent>
              {profileData.loans.slice(0, 2).map((loan, index) => (
                <div key={index} className={`py-2 ${index !== 0 ? 'border-t' : ''}`}>
                  <div className="flex justify-between">
                    <p className="font-medium">{loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      loan.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      loan.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Amount: {formatCurrency(loan.principalAmount)}</p>
                </div>
              ))}
              {profileData.loans.length === 0 && (
                <p className="text-gray-500 text-center py-4">No active loans</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Banking Actions Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="mb-6 border-b">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-700 rounded-none border-b-2 border-transparent pb-2 pt-1">Overview</TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-700 rounded-none border-b-2 border-transparent pb-2 pt-1">Deposit/Withdraw</TabsTrigger>
              <TabsTrigger value="transfer" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-700 rounded-none border-b-2 border-transparent pb-2 pt-1">Transfer Money</TabsTrigger>
              <TabsTrigger value="loans" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-700 rounded-none border-b-2 border-transparent pb-2 pt-1">Loans</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction History */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Recent account activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.transactions.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
                          <p className="text-gray-500 text-sm">{formatDate(transaction.date)}</p>
                        </div>
                        <div>
                          <p className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-gray-500 text-sm text-right">Balance: {formatCurrency(transaction.balanceAfter)}</p>
                        </div>
                      </div>
                    ))}
                    {profileData.transactions.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No transaction history available</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("transactions")}>
                    Make a Transaction
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Loan Summary */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Your Loans</CardTitle>
                  <CardDescription>Active and pending loans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.loans.slice(0, 5).map((loan, index) => (
                      <div key={index} className="border-b pb-2 last:border-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan</p>
                            <p className="text-gray-500 text-sm">Applied: {formatDate(loan.createdAt)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            loan.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            loan.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <p className="font-medium">{formatCurrency(loan.principalAmount)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Interest:</span>
                            <p className="font-medium">{loan.interestRate}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Due Date:</span>
                            <p className="font-medium">{formatDate(loan.dueDate)}</p>
                          </div>
                          {loan.approvedBy && (
                            <div>
                              <span className="text-gray-500">Approved By:</span>
                              <p className="font-medium">{loan.approvedBy}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {profileData.loans.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No loans available</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("loans")}>
                    Apply for a Loan
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="shadow-md max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Deposit or Withdraw</CardTitle>
                <CardDescription>Current balance: {formatCurrency(profileData.balance)}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransaction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <div className="flex rounded-md overflow-hidden">
                      <Button
                        type="button"
                        variant={transactionForm.type === 'deposit' ? 'default' : 'outline'}
                        className={`flex-1 rounded-none rounded-l-md ${transactionForm.type === 'deposit' ? 'bg-indigo-600' : ''}`}
                        onClick={() => setTransactionForm(prev => ({ ...prev, type: 'deposit' }))}
                      >
                        Deposit
                      </Button>
                      <Button
                        type="button"
                        variant={transactionForm.type === 'withdraw' ? 'default' : 'outline'}
                        className={`flex-1 rounded-none rounded-r-md ${transactionForm.type === 'withdraw' ? 'bg-indigo-600' : ''}`}
                        onClick={() => setTransactionForm(prev => ({ ...prev, type: 'withdraw' }))}
                      >
                        Withdraw
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                        step="0.01"
                        min="0"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Process ${transactionForm.type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Transfer Tab */}
          <TabsContent value="transfer">
            <Card className="shadow-md max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Transfer Money</CardTitle>
                <CardDescription>Send money to another account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Account Number</Label>
                    <Input
                      id="recipient"
                      type="text"
                      placeholder="Enter account number"
                      value={transferForm.recipientAccountNumber}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, recipientAccountNumber: e.target.value }))}
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transfer-amount">Amount</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input
                        id="transfer-amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                        step="0.01"
                        min="0"
                        disabled={loading}
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500">Available balance: {formatCurrency(profileData.balance)}</p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Send Money'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Loans Tab */}
          <TabsContent value="loans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loan Application */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Apply for a Loan</CardTitle>
                  <CardDescription>Fill out the form to request a new loan</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLoanApplication} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loan-type">Loan Type</Label>
                      <select
                        id="loan-type"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={loanForm.loanType}
                        onChange={(e) => setLoanForm(prev => ({ ...prev, loanType: e.target.value }))}
                        disabled={loading}
                      >
                        <option value="personal">Personal Loan</option>
                        <option value="home">Home Loan</option>
                        <option value="education">Education Loan</option>
                        <option value="business">Business Loan</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="principal-amount">Loan Amount</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <Input
                          id="principal-amount"
                          type="number"
                          placeholder="0.00"
                          className="pl-7"
                          value={loanForm.principalAmount}
                          onChange={(e) => setLoanForm(prev => ({ ...prev, principalAmount: e.target.value }))}
                          step="0.01"
                          min="100"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                      <Input
                        id="interest-rate"
                        type="number"
                        placeholder="5.5"
                        value={loanForm.interestRate}
                        onChange={(e) => setLoanForm(prev => ({ ...prev, interestRate: e.target.value }))}
                        step="0.1"
                        min="1"
                        disabled={loading}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={loanForm.dueDate}
                        onChange={(e) => setLoanForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={loading}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Apply for Loan'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Existing Loans */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Your Loan Applications</CardTitle>
                  <CardDescription>Status of your loan requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.loans.map((loan, index) => (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan</p>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            loan.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            loan.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <p>{formatCurrency(loan.principalAmount)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Interest:</span>
                            <p>{loan.interestRate}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Applied Date:</span>
                            <p>{formatDate(loan.createdAt)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Due Date:</span>
                            <p>{formatDate(loan.dueDate)}</p>
                          </div>
                          {loan.startDate && (
                            <div>
                              <span className="text-gray-500">Start Date:</span>
                              <p>{formatDate(loan.startDate)}</p>
                            </div>
                          )}
                          {loan.approvedBy && (
                            <div>
                              <span className="text-gray-500">Approved By:</span>
                              <p>{loan.approvedBy}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {profileData.loans.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-gray-500">You haven't applied for any loans yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 px-4 mt-auto">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} SV Bank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

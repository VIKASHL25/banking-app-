
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowRightLeft, Calendar, DollarSign, History } from "lucide-react";

// API URL
const API_URL = "http://localhost:5000/api";

// Format date utility
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Format currency utility
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  date: string;
}

interface Loan {
  id: number;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  startDate: string | null;
  dueDate: string;
  status: string;
  approvedBy: string | null;
  createdAt: string;
}

interface ProfileData {
  name: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  transactions: Transaction[];
  loans: Loan[];
}

const Dashboard = () => {
  const { user, token, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [loanForm, setLoanForm] = useState({
    loanType: "personal",
    principalAmount: "",
    interestRate: "8.5",
    dueDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  
  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    
    fetchUserProfile();
  }, [isLoggedIn, navigate]);
  
  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
      logout();
      navigate("/");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deposit and withdrawal
  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    const amount = parseFloat(transactionAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, amount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process ${type}`);
      }
      
      const data = await response.json();
      
      // Update user data with new balance and transactions
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          balance: data.balance,
          transactions: data.transactions
        };
      });
      
      setTransactionAmount("");
      toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error((error as Error).message || `Failed to process ${type}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle money transfer
  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!recipientAccount) {
      toast.error("Please enter a recipient account number");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientAccountNumber: recipientAccount,
          amount: amount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transfer failed");
      }
      
      const data = await response.json();
      
      // Update user data with new balance and transactions
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          balance: data.balance,
          transactions: data.transactions
        };
      });
      
      setTransferAmount("");
      setRecipientAccount("");
      toast.success("Transfer successful!");
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error((error as Error).message || "Failed to process transfer");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle loan application
  const handleLoanApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const principal = parseFloat(loanForm.principalAmount);
    const interestRate = parseFloat(loanForm.interestRate);
    
    if (isNaN(principal) || principal <= 0) {
      toast.error("Please enter a valid loan amount");
      return;
    }
    
    if (isNaN(interestRate) || interestRate <= 0) {
      toast.error("Please enter a valid interest rate");
      return;
    }
    
    if (!loanForm.dueDate) {
      toast.error("Please select a due date");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/loans/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          loanType: loanForm.loanType,
          principalAmount: principal,
          interestRate: interestRate,
          dueDate: loanForm.dueDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Loan application failed");
      }
      
      const data = await response.json();
      
      // Update user data with new loans
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          loans: data.loans
        };
      });
      
      setLoanForm({
        loanType: "personal",
        principalAmount: "",
        interestRate: "8.5",
        dueDate: ""
      });
      
      toast.success("Loan application submitted successfully!");
    } catch (error) {
      console.error("Loan application error:", error);
      toast.error((error as Error).message || "Failed to submit loan application");
    } finally {
      setLoading(false);
    }
  };
  
  // Loading state
  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-indigo-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="w-full gradient-primary py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">SV Bank</h1>
            <div className="flex items-center space-x-4">
              <span className="text-white">Welcome, {user?.name}</span>
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
        {userData && (
          <>
            {/* Account Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="balance-card col-span-1 md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(userData.balance)}
                  </div>
                  <p className="text-sm opacity-80">Account: {userData.accountNumber}</p>
                  <p className="text-sm opacity-80">Type: {userData.accountType}</p>
                </CardContent>
              </Card>
              
              <Card className="loan-card col-span-1 md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Loans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {userData.loans.length}
                  </div>
                  <p className="text-sm opacity-80">
                    {userData.loans.filter(loan => loan.status === 'approved').length} Active
                  </p>
                  <p className="text-sm opacity-80">
                    {userData.loans.filter(loan => loan.status === 'pending').length} Pending
                  </p>
                </CardContent>
              </Card>
              
              <Card className="transaction-card col-span-1 md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <History className="mr-2 h-5 w-5" />
                    Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {userData.transactions.length}
                  </div>
                  <p className="text-sm opacity-80">
                    {userData.transactions.filter(t => t.type === 'deposit').length} Deposits
                  </p>
                  <p className="text-sm opacity-80">
                    {userData.transactions.filter(t => t.type === 'withdraw').length} Withdrawals
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for different functions */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid grid-cols-1 md:grid-cols-4 mb-8">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="transfer">Transfer Money</TabsTrigger>
                <TabsTrigger value="loans">Loans</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              {/* Account Tab - Deposit/Withdraw */}
              <TabsContent value="account">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Deposit/Withdraw</CardTitle>
                      <CardDescription>Add or withdraw funds from your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <div className="mt-1">
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={transactionAmount}
                            onChange={(e) => setTransactionAmount(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        className="bg-green-600 hover:bg-green-700 flex items-center"
                        onClick={() => handleTransaction('deposit')}
                        disabled={loading}
                      >
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Deposit
                      </Button>
                      <Button
                        className="bg-amber-600 hover:bg-amber-700 flex items-center"
                        onClick={() => handleTransaction('withdraw')}
                        disabled={loading}
                      >
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Withdraw
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Your last 5 transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {userData.transactions.slice(0, 5).map((transaction) => (
                          <div
                            key={transaction.id}
                            className={`p-3 rounded-lg flex justify-between ${
                              transaction.type === 'deposit' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-medium capitalize">{transaction.type}</p>
                              <p className="text-xs opacity-80">{formatDate(transaction.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {transaction.type === 'deposit' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-xs opacity-80">
                                Balance: {formatCurrency(transaction.balanceAfter)}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {userData.transactions.length === 0 && (
                          <p className="text-center py-4 text-gray-500">No transactions yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Transfer Tab */}
              <TabsContent value="transfer">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <ArrowRightLeft className="mr-2 h-5 w-5" />
                      Transfer Money
                    </CardTitle>
                    <CardDescription>
                      Transfer funds to another account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="recipientAccount">Recipient Account Number</Label>
                        <Input
                          id="recipientAccount"
                          placeholder="Enter account number"
                          value={recipientAccount}
                          onChange={(e) => setRecipientAccount(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="transferAmount">Amount</Label>
                        <Input
                          id="transferAmount"
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                      
                      <Button
                        type="button"
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleTransfer}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Send Money'}
                      </Button>
                      
                      <div className="bg-amber-50 p-4 rounded-md">
                        <p className="text-amber-800 text-sm">
                          <strong>Note:</strong> Please double-check the recipient's account number 
                          before confirming the transfer. Transactions cannot be reversed.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Loans Tab */}
              <TabsContent value="loans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Loan Application Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Apply for a Loan</CardTitle>
                      <CardDescription>Complete the form to submit a loan application</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLoanApplication} className="space-y-4">
                        <div>
                          <Label htmlFor="loanType">Loan Type</Label>
                          <Select
                            value={loanForm.loanType}
                            onValueChange={(value) => setLoanForm({...loanForm, loanType: value})}
                          >
                            <SelectTrigger id="loanType">
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Personal Loan</SelectItem>
                              <SelectItem value="home">Home Loan</SelectItem>
                              <SelectItem value="education">Education Loan</SelectItem>
                              <SelectItem value="business">Business Loan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="principalAmount">Principal Amount</Label>
                          <Input
                            id="principalAmount"
                            type="number"
                            placeholder="0.00"
                            min="1000"
                            step="1000"
                            value={loanForm.principalAmount}
                            onChange={(e) => setLoanForm({...loanForm, principalAmount: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="interestRate">Interest Rate (%)</Label>
                          <Input
                            id="interestRate"
                            type="number"
                            placeholder="8.5"
                            min="1"
                            max="30"
                            step="0.1"
                            value={loanForm.interestRate}
                            onChange={(e) => setLoanForm({...loanForm, interestRate: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={loanForm.dueDate}
                            onChange={(e) => setLoanForm({...loanForm, dueDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Submit Loan Application'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {/* Loan Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Loans</CardTitle>
                      <CardDescription>View your loan applications and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userData.loans.length > 0 ? (
                        <div className="space-y-4">
                          {userData.loans.map((loan) => (
                            <div
                              key={loan.id}
                              className="border rounded-lg p-4 shadow-sm"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold capitalize text-lg">
                                    {loan.loanType} Loan
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Applied on {new Date(loan.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded ${
                                    loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    loan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {loan.status.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Principal</p>
                                  <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Interest Rate</p>
                                  <p className="font-semibold">{loan.interestRate}%</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Start Date</p>
                                  <p className="font-semibold">
                                    {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Due Date</p>
                                  <p className="font-semibold">{new Date(loan.dueDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              
                              {loan.status === 'approved' && loan.approvedBy && (
                                <div className="mt-4 pt-3 border-t text-sm">
                                  <p className="text-gray-500">
                                    Approved by {loan.approvedBy} on {new Date(loan.startDate as string).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-2">No loan applications yet</p>
                          <p className="text-sm text-gray-400">
                            Apply for a loan using the form on the left
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Transaction History
                    </CardTitle>
                    <CardDescription>All your account transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userData.transactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-sm text-gray-500 border-b">
                              <th className="text-left py-3 px-4">Type</th>
                              <th className="text-left py-3 px-4">Date</th>
                              <th className="text-right py-3 px-4">Amount</th>
                              <th className="text-right py-3 px-4">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userData.transactions.map((transaction) => (
                              <tr key={transaction.id} className="border-b text-sm">
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                      transaction.type === 'deposit' ? 'bg-green-500' : 'bg-amber-500'
                                    }`}></span>
                                    <span className="capitalize">{transaction.type}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-500">
                                  {formatDate(transaction.date)}
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${
                                  transaction.type === 'deposit' ? 'text-green-600' : 'text-amber-600'
                                }`}>
                                  {transaction.type === 'deposit' ? '+' : '-'}
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {formatCurrency(transaction.balanceAfter)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No transactions yet</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setActiveTab("account")}
                        >
                          Make a Transaction
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} SV Bank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

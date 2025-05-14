
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, History } from "lucide-react";

// API URL
const API_URL = "http://localhost:5000/api";

const Index = () => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [token, setToken] = useState('');
  
  // User data
  const [userData, setUserData] = useState({
    name: "",
    accountNumber: "",
    accountType: "",
    balance: 0,
    transactions: []
  });

  // Form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    username: "", 
    password: "", 
    confirmPassword: "",
    name: ""
  });
  const [transactionAmount, setTransactionAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem("bankingToken");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async (authToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
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
      // If we can't fetch the profile, the token might be invalid
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store token
      localStorage.setItem("bankingToken", data.token);
      setToken(data.token);
      
      // Fetch user profile
      await fetchUserProfile(data.token);
      
      setIsLoggedIn(true);
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
          name: registerForm.name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      toast.success("Registration successful! Please login.");
      setActiveTab("login");
      setRegisterForm({
        username: "",
        password: "",
        confirmPassword: "",
        name: ""
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    localStorage.removeItem("bankingToken");
    toast.info("Logged out successfully");
  };

  // Handle deposit and withdrawal
  const handleTransaction = async (type) => {
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
      setUserData(prevData => ({
        ...prevData,
        balance: data.balance,
        transactions: data.transactions
      }));
      
      setTransactionAmount("");
      toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(error.message || `Failed to process ${type}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <header className="container mx-auto py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-600">Vibrant Bank</h1>
        {isLoggedIn && (
          <Button variant="ghost" onClick={handleLogout} disabled={loading}>
            Logout
          </Button>
        )}
      </header>
      
      <main className="container mx-auto flex-1 py-8">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-indigo-700">Welcome to Vibrant Bank</CardTitle>
                <CardDescription className="text-center">Your trusted financial partner</CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs 
                  defaultValue="login" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          type="text" 
                          placeholder="Enter your username" 
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Login'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="Enter your full name"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">Username</Label>
                        <Input 
                          id="reg-username" 
                          type="text" 
                          placeholder="Choose a username"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input 
                          id="reg-password" 
                          type="password" 
                          placeholder="Choose a password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          placeholder="Confirm your password"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          disabled={loading}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Register'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-indigo-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome back, {userData.name}!</CardTitle>
                  <CardDescription className="text-white/90">
                    Account Summary
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                      <p className="text-white/80 text-sm">Account Number</p>
                      <p className="font-mono text-lg font-semibold">{userData.accountNumber}</p>
                    </div>
                    
                    <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                      <p className="text-white/80 text-sm">Account Type</p>
                      <p className="text-lg font-semibold">{userData.accountType}</p>
                    </div>
                    
                    <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                      <p className="text-white/80 text-sm">Current Balance</p>
                      <p className="text-2xl font-bold">${userData.balance.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="Enter amount"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      onClick={() => handleTransaction('deposit')}
                      disabled={loading}
                    >
                      <ArrowDown className="h-4 w-4" /> Deposit
                    </Button>
                    
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700 gap-2"
                      onClick={() => handleTransaction('withdraw')}
                      disabled={loading}
                    >
                      <ArrowUp className="h-4 w-4" /> Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <span>Recent Transactions</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="-mx-6">
                  <div className="max-h-60 overflow-auto pr-6">
                    {userData.transactions && userData.transactions.length > 0 ? (
                      <div className="space-y-2">
                        {userData.transactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className={`p-3 rounded-lg flex justify-between ${
                              transaction.type === 'deposit' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-medium capitalize">
                                {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                              </p>
                              <p className="text-xs opacity-80">{formatDate(transaction.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                              </p>
                              <p className="text-xs opacity-80">Balance: ${transaction.balanceAfter.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No transactions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <footer className="container mx-auto mt-auto py-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Vibrant Bank. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;

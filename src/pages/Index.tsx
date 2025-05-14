
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, History } from "lucide-react";

const Index = () => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
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

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("bankingUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse stored user data", error);
      }
    }
  }, []);

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // This is a mock login - in a real app you'd validate against a backend
    // For demo purposes, we'll check against localStorage
    const storedUsers = JSON.parse(localStorage.getItem("bankingUsers") || "[]");
    const user = storedUsers.find(
      (u: any) => u.username === loginForm.username && u.password === loginForm.password
    );
    
    if (user) {
      setUserData({
        name: user.name,
        accountNumber: user.accountNumber || generateAccountNumber(),
        accountType: user.accountType || "Savings",
        balance: user.balance || 1000, // Default starting balance
        transactions: user.transactions || []
      });
      
      setIsLoggedIn(true);
      
      // Store current user in localStorage
      localStorage.setItem("bankingUser", JSON.stringify({
        ...user,
        accountNumber: user.accountNumber || generateAccountNumber(),
        accountType: user.accountType || "Savings",
        balance: user.balance || 1000,
        transactions: user.transactions || []
      }));
      
      toast.success("Login successful!");
    } else {
      toast.error("Invalid username or password");
    }
  };

  // Handle registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    const storedUsers = JSON.parse(localStorage.getItem("bankingUsers") || "[]");
    
    if (storedUsers.some((u: any) => u.username === registerForm.username)) {
      toast.error("Username already exists");
      return;
    }
    
    const newUser = {
      username: registerForm.username,
      password: registerForm.password,
      name: registerForm.name,
      accountNumber: generateAccountNumber(),
      accountType: "Savings",
      balance: 1000, // Default starting balance
      transactions: []
    };
    
    storedUsers.push(newUser);
    localStorage.setItem("bankingUsers", JSON.stringify(storedUsers));
    
    // Auto login after registration
    setUserData({
      name: newUser.name,
      accountNumber: newUser.accountNumber,
      accountType: newUser.accountType,
      balance: newUser.balance,
      transactions: newUser.transactions
    });
    
    setIsLoggedIn(true);
    localStorage.setItem("bankingUser", JSON.stringify(newUser));
    
    toast.success("Registration successful!");
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("bankingUser");
    toast.info("Logged out successfully");
  };

  // Handle deposit and withdrawal
  const handleTransaction = (type: 'deposit' | 'withdraw') => {
    const amount = parseFloat(transactionAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (type === 'withdraw' && amount > userData.balance) {
      toast.error("Insufficient funds");
      return;
    }
    
    const newBalance = type === 'deposit' 
      ? userData.balance + amount 
      : userData.balance - amount;
      
    const transaction = {
      id: Date.now(),
      type,
      amount,
      date: new Date().toISOString(),
      balance: newBalance
    };
    
    const updatedTransactions = [transaction, ...userData.transactions];
    
    const updatedUserData = {
      ...userData,
      balance: newBalance,
      transactions: updatedTransactions
    };
    
    setUserData(updatedUserData);
    
    // Update localStorage
    localStorage.setItem("bankingUser", JSON.stringify(updatedUserData));
    
    // Update the user in the users list too
    const storedUsers = JSON.parse(localStorage.getItem("bankingUsers") || "[]");
    const updatedUsers = storedUsers.map((u: any) => 
      u.username === JSON.parse(localStorage.getItem("bankingUser") || "{}").username
        ? { ...u, balance: newBalance, transactions: updatedTransactions }
        : u
    );
    localStorage.setItem("bankingUsers", JSON.stringify(updatedUsers));
    
    setTransactionAmount("");
    toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
  };

  // Generate a random account number
  const generateAccountNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <header className="container mx-auto py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-600">Vibrant Bank</h1>
        {isLoggedIn && (
          <Button variant="ghost" onClick={handleLogout}>
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
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Login
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
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Register
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      onClick={() => handleTransaction('deposit')}
                    >
                      <ArrowDown className="h-4 w-4" /> Deposit
                    </Button>
                    
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700 gap-2"
                      onClick={() => handleTransaction('withdraw')}
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
                    {userData.transactions.length > 0 ? (
                      <div className="space-y-2">
                        {userData.transactions.map((transaction: any) => (
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
                              <p className="text-xs opacity-80">Balance: ${transaction.balance.toFixed(2)}</p>
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

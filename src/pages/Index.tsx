
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// API URL
const API_URL = "http://localhost:5000/api";

const Index = () => {
  const { login, staffLogin, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    username: "", 
    password: "", 
    confirmPassword: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);
  
  // Redirect if already logged in
  if (isLoggedIn) {
    navigate("/dashboard");
    return null;
  }
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${isStaffLogin ? '/staff/login' : '/login'}`, {
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
      
      if (isStaffLogin) {
        staffLogin(data.token, data.staff);
        navigate("/staff");
      } else {
        login(data.token, data.user);
        navigate("/dashboard");
      }
      
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error((error as Error).message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
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
      toast.error((error as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Modern Banking Header */}
      <header className="w-full gradient-primary py-6 px-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">SV Bank</h1>
            <div className="space-x-2">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setIsStaffLogin(false);
                  setActiveTab("login");
                }}
              >
                Customer Login
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20"
                onClick={() => {
                  setIsStaffLogin(true);
                  setActiveTab("login");
                }}
              >
                Staff Login
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-800">
              Banking Made <span className="text-indigo-600">Simple</span> for Everyone
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Experience secure, reliable, and convenient banking services with SV Bank.
              Manage your finances, apply for loans, and transfer money with ease.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setActiveTab("register")}
              >
                Open an Account
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 md:pl-10">
            <Card className="glass-card max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-indigo-700">
                  {isStaffLogin ? "Staff Login" : activeTab === "login" ? "Welcome Back" : "Join SV Bank"}
                </CardTitle>
                <CardDescription className="text-center">
                  {isStaffLogin 
                    ? "Access the staff portal" 
                    : activeTab === "login" 
                      ? "Login to your account" 
                      : "Create a new account"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {!isStaffLogin ? (
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
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-username">Staff Username</Label>
                      <Input 
                        id="staff-username" 
                        type="text" 
                        placeholder="Enter your staff username" 
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        disabled={loading}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="staff-password">Password</Label>
                      <Input 
                        id="staff-password" 
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
                      {loading ? 'Processing...' : 'Staff Login'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Banking Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center shadow-md hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle>Secure Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Safely transfer funds between accounts with our secure transaction system.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-md hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle>Quick Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Apply for personal, home, or business loans with competitive interest rates.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-md hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <CardTitle>Secure Banking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Experience top-notch security with our advanced data protection systems.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SV Bank</h3>
              <p className="text-gray-300">
                Your trusted financial partner for all banking services.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Services</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Personal Banking</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Business Banking</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Loans</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Investments</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <address className="not-italic text-gray-300">
                <p>123 Banking Street</p>
                <p>Financial District</p>
                <p>support@svbank.com</p>
                <p>+1 (555) 123-4567</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} SV Bank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

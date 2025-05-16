
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  username: string;
  name: string;
}

interface Staff {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  staff: Staff | null;
  token: string | null;
  isLoggedIn: boolean;
  isStaff: boolean;
  login: (token: string, userData: User) => void;
  staffLogin: (token: string, staffData: Staff) => void;
  logout: () => void;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem("bankingToken");
    const storedUser = localStorage.getItem("bankingUser");
    const storedStaff = localStorage.getItem("bankingStaff");
    
    if (storedToken) {
      setToken(storedToken);
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (storedStaff) {
        setStaff(JSON.parse(storedStaff));
      }
    }
  }, []);

  const clearAuthState = () => {
    setToken(null);
    setUser(null);
    setStaff(null);
    localStorage.removeItem("bankingToken");
    localStorage.removeItem("bankingUser");
    localStorage.removeItem("bankingStaff");
  };

  const login = (token: string, userData: User) => {
    // Clear any existing auth state first
    clearAuthState();
    
    localStorage.setItem("bankingToken", token);
    localStorage.setItem("bankingUser", JSON.stringify(userData));
    
    setToken(token);
    setUser(userData);
  };

  const staffLogin = (token: string, staffData: Staff) => {
    // Clear any existing auth state first
    clearAuthState();
    
    localStorage.setItem("bankingToken", token);
    localStorage.setItem("bankingStaff", JSON.stringify(staffData));
    
    setToken(token);
    setStaff(staffData);
  };

  const logout = () => {
    clearAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        staff,
        token,
        isLoggedIn: !!token,
        isStaff: !!staff,
        login,
        staffLogin,
        logout,
        clearAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};

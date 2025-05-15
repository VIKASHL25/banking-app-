
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  username: string;
  name: string;
}

interface Staff {
  id: number;
  username: string;
  name: string;
  email: string;
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

  const login = (token: string, userData: User) => {
    localStorage.setItem("bankingToken", token);
    localStorage.setItem("bankingUser", JSON.stringify(userData));
    localStorage.removeItem("bankingStaff");
    
    setToken(token);
    setUser(userData);
    setStaff(null);
  };

  const staffLogin = (token: string, staffData: Staff) => {
    localStorage.setItem("bankingToken", token);
    localStorage.setItem("bankingStaff", JSON.stringify(staffData));
    localStorage.removeItem("bankingUser");
    
    setToken(token);
    setStaff(staffData);
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem("bankingToken");
    localStorage.removeItem("bankingUser");
    localStorage.removeItem("bankingStaff");
    
    setToken(null);
    setUser(null);
    setStaff(null);
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
        logout
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

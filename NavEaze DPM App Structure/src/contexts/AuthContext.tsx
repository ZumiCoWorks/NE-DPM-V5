import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'sponsor';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - in real app this would call an API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Determine role based on email for demo purposes
    const role = email.includes('sponsor') ? 'sponsor' : 'admin';
    
    setUser({
      email,
      name: email.split('@')[0],
      role
    });
  };

  const register = async (name: string, email: string, password: string) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUser({
      email,
      name,
      role: 'admin'
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

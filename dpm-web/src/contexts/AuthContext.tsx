import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: 'admin' | 'sponsor' | 'staff';
  organization_id?: string;
  avatar_url?: string;
  created_at?: string;
  phone?: string;
  company?: string;
  address?: string;
  bio?: string;
  email_confirmed_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch user profile from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const p = profile as any;
            setUser({
              id: p.id,
              email: p.email || session.user.email || '',
              full_name: p.full_name || p.name || '',
              name: p.name || p.full_name || '',
              role: p.role || 'admin',
              organization_id: p.organization_id,
              avatar_url: p.avatar_url,
              created_at: p.created_at,
              phone: p.phone,
              company: p.company,
              address: p.address,
              bio: p.bio,
              email_confirmed_at: session.user.email_confirmed_at
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    if (!supabase) return;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user && supabase) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const p = profile as any;
          setUser({
            id: p.id,
            email: p.email || session.user.email || '',
            full_name: p.full_name || p.name || '',
            name: p.name || p.full_name || '',
            role: p.role || 'admin',
            organization_id: p.organization_id,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            phone: p.phone,
            company: p.company,
            address: p.address,
            bio: p.bio,
            email_confirmed_at: session.user.email_confirmed_at
          });
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const p = profile as any;
          setUser({
            id: p.id,
            email: p.email || data.user.email || '',
            full_name: p.full_name || p.name || '',
            name: p.name || p.full_name || '',
            role: p.role || 'admin',
            organization_id: p.organization_id,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            phone: p.phone,
            company: p.company,
            address: p.address,
            bio: p.bio,
            email_confirmed_at: data.user.email_confirmed_at
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
          }
        }
      });

      if (error) throw error;

      // Note: With email confirmation enabled, user won't be logged in immediately
      // They'll receive a confirmation email first
      if (data.user && data.session) {
        // User is logged in (email confirmation disabled)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const p = profile as any;
          setUser({
            id: p.id,
            email: p.email || data.user.email || '',
            full_name: p.full_name || p.name || fullName,
            name: p.name || p.full_name || fullName,
            role: p.role || 'admin',
            organization_id: p.organization_id,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            phone: p.phone,
            company: p.company,
            address: p.address,
            bio: p.bio,
            email_confirmed_at: data.user.email_confirmed_at
          });
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase.js'; // Make sure this path is correct
import { Session, User } from '@supabase/supabase-js';

// Define our real user profile from the database ERD
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'sponsor' | 'event_organizer';
  phone?: string;
  company?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<any>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data : authListener } = supabase.auth.onAuthStateChange(
      async  (event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        if  (session?.user) {
           const { data: userProfile } = await  supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile);
        } else  {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () =>  {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, email: data.user.email, full_name: name, role: 'admin' }); // Default role
      return { error: profileError };
    }
    return { data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('Error updating profile:', error);
    } else {
      setProfile(data);
    }
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!user && !!profile,
      signIn: login,
      signOut: logout,
      signUp: register,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const  context = useContext(AuthContext);
  if (context === undefined ) {
    throw new Error('useAuth must be used within an AuthProvider' );
  }
  return  context;
};
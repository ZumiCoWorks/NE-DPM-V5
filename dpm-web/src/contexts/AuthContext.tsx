import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: 'admin' | 'sponsor' | 'staff' | 'organizer';
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
  register: (email: string, password: string, fullName: string, role?: 'admin' | 'event_organizer' | 'venue_manager' | 'advertiser' | 'staff') => Promise<void>;
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
            console.log('🔍 Profile data from DB:', { first_name: p.first_name, last_name: p.last_name, role: p.role });
            // Build full name from first_name and last_name, avoiding duplicates
            let fullName = '';
            if (p.first_name && p.last_name && p.first_name !== p.last_name) {
              fullName = `${p.first_name} ${p.last_name}`;
            } else if (p.first_name) {
              fullName = p.first_name;
            } else if (p.last_name) {
              fullName = p.last_name;
            } else {
              fullName = session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                '';
            }
            console.log('✅ Setting user with full_name:', fullName);
            setUser({
              id: p.id,
              email: p.email || session.user.email || '',
              full_name: fullName,
              name: fullName,
              role: p.role || 'organizer',
              organization_id: p.organization_id,
              avatar_url: p.avatar_url,
              created_at: p.created_at,
              phone: p.phone,
              company: p.company,
              address: p.address,
              bio: p.bio,
              email_confirmed_at: session.user.email_confirmed_at
            });
          } else {
            console.warn('⚠️ No profile found for user:', session.user.id);
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

    // Listen for auth changes (but ignore repeated SIGNED_IN events to prevent loops)
    let lastEvent = '';
    let lastEventTime = 0;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent duplicate events within 1 second
      const now = Date.now();
      if (event === lastEvent && event === 'SIGNED_IN' && now - lastEventTime < 1000) {
        console.log('⏭️ Skipping duplicate SIGNED_IN event');
        return;
      }
      lastEvent = event;
      lastEventTime = now;

      console.log('Auth state changed:', event);

      // Only fetch profile on specific events
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Let the initial session logic handle this
        if (event === 'INITIAL_SESSION') return;
      }

      if (session?.user && supabase && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        console.log('🔄 Fetching profile for user:', session.user.email);

        try {
          // Add timeout to profile fetch
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );

          const { data: profile, error } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          if (error) {
            console.error('❌ Error fetching profile:', error);
            // Continue without profile data
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
              role: 'organizer', // Changed from 'staff' to 'organizer'
              organization_id: undefined,
              avatar_url: undefined,
              created_at: session.user.created_at || new Date().toISOString(),
              phone: undefined,
              company: undefined,
              address: undefined,
              bio: undefined,
              email_confirmed_at: session.user.email_confirmed_at
            });
          } else if (profile) {
            const p = profile as any;
            console.log('🔍 Profile data from DB:', { first_name: p.first_name, last_name: p.last_name, role: p.role });
            // Build full name from first_name and last_name, avoiding duplicates
            let fullName = '';
            if (p.first_name && p.last_name && p.first_name !== p.last_name) {
              fullName = `${p.first_name} ${p.last_name}`;
            } else if (p.first_name) {
              fullName = p.first_name;
            } else if (p.last_name) {
              fullName = p.last_name;
            } else {
              fullName = session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                '';
            }
            console.log('✅ Setting user with full_name:', fullName);
            setUser({
              id: p.id,
              email: p.email || session.user.email || '',
              full_name: fullName,
              name: fullName,
              role: p.role || 'organizer',
              organization_id: p.organization_id,
              avatar_url: p.avatar_url,
              created_at: p.created_at,
              phone: p.phone,
              company: p.company,
              address: p.address,
              bio: p.bio,
              email_confirmed_at: session.user.email_confirmed_at
            });
          } else {
            console.warn('⚠️ No profile found for user:', session.user.id);
          }
        } catch (err) {
          console.error('❌ Error in profile fetch:', err);
          // Set user from session data only
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
            role: 'organizer',
            organization_id: undefined,
            avatar_url: undefined,
            created_at: session.user.created_at || new Date().toISOString(),
            phone: undefined,
            company: undefined,
            address: undefined,
            bio: undefined,
            email_confirmed_at: session.user.email_confirmed_at
          });
        }
      } else {
        console.log('❌ No session, clearing user');
        setUser(null);
      }

      console.log('✅ Auth loading complete');
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
            role: p.role || 'organizer',
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

  const register = async (email: string, password: string, fullName: string, role: 'admin' | 'event_organizer' | 'venue_manager' | 'advertiser' | 'staff' = 'event_organizer') => {
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
          // Build full name from first_name and last_name, avoiding duplicates
          let profileFullName = '';
          if (p.first_name && p.last_name && p.first_name !== p.last_name) {
            profileFullName = `${p.first_name} ${p.last_name}`;
          } else if (p.first_name) {
            profileFullName = p.first_name;
          } else if (p.last_name) {
            profileFullName = p.last_name;
          } else {
            profileFullName = data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              fullName;
          }
          setUser({
            id: p.id,
            email: p.email || data.user.email || '',
            full_name: profileFullName,
            name: profileFullName,
            role: p.role || 'organizer',
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

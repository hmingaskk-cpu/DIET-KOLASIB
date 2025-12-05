"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { showSuccess, showError } from '@/utils/toast';

interface UserWithRole extends User {
  role?: "admin" | "faculty" | "staff" | "student";
  name?: string;
  avatar_url?: string;
  cloudinary_public_id?: string;
  rollno?: string;
  year?: number;
  status?: "active" | "passed-out" | "on-leave";
  phone_number?: string;
  address?: string;
  course?: string;
  branch?: string;
  abbreviation?: string;
  phone?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to clear all auth data consistently
export const clearAllAuthData = () => {
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('last_auth_time');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  localStorage.removeItem('sb-uyhlvjkcagzihzngttei-auth-token'); // Supabase specific token
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Dispatch logout event for service worker
  window.dispatchEvent(new Event('logout'));
  
  // Clear service worker caches if available
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
  
  console.log('All auth data cleared');
};

// Helper to check if token is stale/expired
export const isTokenStale = (): boolean => {
  const lastAuthTime = localStorage.getItem('last_auth_time');
  const now = Date.now();
  
  if (!lastAuthTime) {
    return true; // No timestamp means token is stale
  }
  
  const tokenAge = now - parseInt(lastAuthTime, 10);
  const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  return tokenAge > MAX_TOKEN_AGE;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // --- 1. Force Clean Logic ---
  const forceLogout = async () => {
    console.warn("Forcing cleanup of invalid session...");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore error
    }
    
    clearAllAuthData();
    
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  // --- 2. Robust Profile Fetcher ---
  const getUserWithRole = useCallback(async (baseUser: User): Promise<UserWithRole | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name, avatar_url, cloudinary_public_id')
        .eq('id', baseUser.id)
        .maybeSingle();

      // If we get an Auth error (401/403) from the DB, the token is dead.
      if (profileError && (profileError.code === 'PGRST301' || profileError.message.includes('JWT'))) {
        return null; 
      }

      let role = profile?.role || 'student';
      let userWithRole: UserWithRole = { 
        ...baseUser, 
        role, 
        name: profile?.name || baseUser.email,
        avatar_url: profile?.avatar_url,
        cloudinary_public_id: profile?.cloudinary_public_id
      };

      // Fetch role details safely
      try {
        if (role === "student") {
          const { data } = await supabase.from('students').select('*').eq('user_id', baseUser.id).maybeSingle();
          if (data) userWithRole = { ...userWithRole, ...data };
        } else if (role === "faculty") {
          const { data } = await supabase.from('faculty').select('*').eq('user_id', baseUser.id).maybeSingle();
          if (data) userWithRole = { ...userWithRole, ...data };
        }
      } catch (err) {
        // Ignore detail fetch errors, just use base profile
      }

      return userWithRole;
    } catch (error) {
      return null;
    }
  }, []);

  // Initialize auth with token validation
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if token is stale before trying to use it
        if (isTokenStale()) {
          console.log('Token is stale, forcing logout');
          if (mounted) {
            await forceLogout();
            setInitialized(true);
          }
          return;
        }

        // A. Check Local Storage
        const { data: { session: localSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !localSession) {
          // No session? Just finish loading.
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        // Check session expiration
        const sessionExpiresAt = new Date(localSession.expires_at! * 1000);
        if (sessionExpiresAt < new Date()) {
          console.log('Session expired, forcing logout');
          if (mounted) {
            await forceLogout();
            setInitialized(true);
          }
          return;
        }

        // B. 🚨 SERVER VERIFY 🚨
        const { data: { user: validUser }, error: verifyError } = await supabase.auth.getUser();

        if (verifyError || !validUser) {
          if (mounted) {
            await forceLogout();
            setInitialized(true);
          }
          return;
        }

        // C. Token is good, fetch profile
        if (mounted) {
          setSession(localSession);
          
          const detailedUser = await getUserWithRole(validUser);
          
          if (!detailedUser) {
            // If we have a user but cannot fetch profile (RLS error), force logout
            await forceLogout();
          } else {
            setUser(detailedUser);
            
            // Store auth timestamp for future checks
            localStorage.setItem('last_auth_time', Date.now().toString());
            
            // Store minimal user info for quick access
            localStorage.setItem('user_role', detailedUser.role || 'student');
            if (detailedUser.email) {
              localStorage.setItem('user_email', detailedUser.email);
            }
          }
          
          setLoading(false);
          setInitialized(true);
        }

      } catch (error) {
        console.error("Auth init crashed:", error);
        if (mounted) {
          await forceLogout();
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // D. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      if (event === 'INITIAL_SESSION') return; 

      if (event === 'SIGNED_OUT' || !newSession) {
        clearAllAuthData();
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      // Handle Token Refresh or Login
      if (newSession) {
        setSession(newSession);
        // Only fetch profile if we don't have it or if the user ID changed
        if (!user || user.id !== newSession.user.id) {
          const detailedUser = await getUserWithRole(newSession.user);
          if (mounted) {
            setUser(detailedUser);
            if (detailedUser) {
              localStorage.setItem('last_auth_time', Date.now().toString());
            }
          }
        }
        setLoading(false);
      }
    });

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout, forcing logout');
        forceLogout();
        setInitialized(true);
      }
    }, 10000); // 10 seconds timeout

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [getUserWithRole]);

  const signIn = async (email: string, password: string, rememberMe = true) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { shouldCreateSession: rememberMe },
      });
      
      if (error) throw error;
      
      if (data.user) {
        const detailedUser = await getUserWithRole(data.user);
        setUser(detailedUser);
        
        // Store auth timestamp and user info
        localStorage.setItem('last_auth_time', Date.now().toString());
        localStorage.setItem('user_role', detailedUser?.role || 'student');
        if (data.user.email) {
          localStorage.setItem('user_email', data.user.email);
        }
        
        showSuccess("Logged in successfully");
      }
    } catch (error: any) {
        showError(error.message);
        // Clear any partial auth data on failed login
        clearAllAuthData();
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Dispatch logout event for service worker cleanup
      window.dispatchEvent(new Event('logout'));
      
      // Clear all auth data
      clearAllAuthData();
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      
      showSuccess("Logged out successfully");
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if Supabase logout fails, clear local state
      clearAllAuthData();
      setUser(null);
      setSession(null);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const updatedUser = await getUserWithRole(session.user);
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('last_auth_time', Date.now().toString());
      } else {
        // If we can't refresh user, force logout
        await forceLogout();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await forceLogout();
    } finally {
      setLoading(false);
    }
  };

  // Provide a method to check auth state externally
  const value = {
    user,
    session,
    loading: loading || !initialized, // Only consider loading done when initialized
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

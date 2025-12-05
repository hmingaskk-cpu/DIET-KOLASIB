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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Clear all Supabase storage
  const clearSupabaseStorage = () => {
    console.log("Clearing Supabase storage...");
    
    // Clear all localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any Supabase-related cookies
    document.cookie.split(";").forEach(function(c) {
      const cookieName = c.split("=")[0].trim();
      if (cookieName.includes('supabase') || cookieName.includes('sb-')) {
        document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    });
  };

  // Get user with role details
  const getUserWithRole = useCallback(async (baseUser: User): Promise<UserWithRole | null> => {
    try {
      console.log("Fetching user profile for:", baseUser.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name, avatar_url, cloudinary_public_id')
        .eq('id', baseUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return null;
      }

      const role = profile?.role || 'student';
      const userWithRole: UserWithRole = { 
        ...baseUser, 
        role, 
        name: profile?.name || baseUser.email,
        avatar_url: profile?.avatar_url,
        cloudinary_public_id: profile?.cloudinary_public_id
      };

      console.log("Base user role:", role);

      // Fetch additional role details if needed
      try {
        if (role === "student") {
          const { data } = await supabase.from('students').select('*').eq('user_id', baseUser.id).maybeSingle();
          if (data) {
            Object.assign(userWithRole, data);
          }
        } else if (role === "faculty") {
          const { data } = await supabase.from('faculty').select('*').eq('user_id', baseUser.id).maybeSingle();
          if (data) {
            Object.assign(userWithRole, data);
          }
        }
      } catch (err) {
        console.error('Role details fetch error:', err);
      }

      return userWithRole;
    } catch (error) {
      console.error('getUserWithRole error:', error);
      return null;
    }
  }, []);

  // Initialize auth - SIMPLE AND RELIABLE
  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const initializeAuth = async () => {
      if (initialized) return;
      initialized = true;

      try {
        console.log("Starting auth initialization...");
        
        // First, check for existing session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          clearSupabaseStorage();
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        console.log("Current session found:", !!currentSession);

        if (!currentSession) {
          // No session found
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        // Verify session is still valid
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          console.error("User validation error:", userError);
          clearSupabaseStorage();
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        console.log("User validated, fetching details...");

        // Get user details
        const detailedUser = await getUserWithRole(currentUser);
        
        if (!detailedUser) {
          console.error("Failed to get user details");
          clearSupabaseStorage();
        }

        if (mounted) {
          setSession(currentSession);
          setUser(detailedUser);
          setLoading(false);
          setAuthInitialized(true);
          console.log("Auth initialization complete");
        }

      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          clearSupabaseStorage();
          setUser(null);
          setSession(null);
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state change:", event);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !newSession) {
        clearSupabaseStorage();
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        
        // Get user details
        const detailedUser = await getUserWithRole(newSession.user);
        setUser(detailedUser);
        setLoading(false);
      }
    });

    // Start initialization with a small delay
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [getUserWithRole]);

  const signIn = async (email: string, password: string, rememberMe = true) => {
    setLoading(true);
    try {
      console.log("Attempting sign in for:", email);
      
      // Clear any existing storage before login
      clearSupabaseStorage();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("Sign in successful, user:", data.user?.email);
      
      // Show success message
      showSuccess("Logged in successfully");
      
      // IMPORTANT: Don't set state here - let onAuthStateChange handle it
      // Just wait a moment and redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      showError(error.message || "Login failed");
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      console.log("Signing out...");
      await supabase.auth.signOut();
      clearSupabaseStorage();
      setUser(null);
      setSession(null);
      showSuccess("Logged out successfully");
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Sign out error:', error);
      clearSupabaseStorage();
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
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading: loading || !authInitialized,
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

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

  // --- 1. Force Clean Logic ---
  // Helper to completely wipe state and storage if something is wrong
  const forceLogout = async () => {
    console.warn("Forcing cleanup of invalid session...");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore error
    }
    // NUCLEAR OPTION: Manually clear storage keys to prevent loops
    localStorage.removeItem('sb-uyhlvjkcagzihzngttei-auth-token'); // Clear your specific supabase key if known
    localStorage.clear(); // Safe to clear all if this is the only app on localhost/domain
    
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // A. Check Local Storage
        const { data: { session: localSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !localSession) {
           // No session? Just finish loading.
           if (mounted) setLoading(false);
           return;
        }

        // B. 🚨 SERVER VERIFY 🚨
        const { data: { user: validUser }, error: verifyError } = await supabase.auth.getUser();

        if (verifyError || !validUser) {
           await forceLogout();
           return;
        }

        // C. Token is good, fetch profile
        if (mounted) setSession(localSession);
        
        const detailedUser = await getUserWithRole(validUser);
        
        if (!detailedUser) {
           // If we have a user but cannot fetch profile (RLS error), force logout
           await forceLogout();
        } else {
           if (mounted) setUser(detailedUser);
           if (mounted) setLoading(false);
        }

      } catch (error) {
        console.error("Auth init crashed:", error);
        await forceLogout();
      }
    };

    initializeAuth();

    // D. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      // We handle initial load manually above to ensure "await" completes before rendering
      if (event === 'INITIAL_SESSION') return; 

      if (event === 'SIGNED_OUT' || !newSession) {
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
           if (mounted) setUser(detailedUser);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getUserWithRole, user]); // Added user to dependency to check id

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
      }
    } catch (error: any) {
        showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await forceLogout(); // Use our nuclear logout
    showSuccess("Logged out successfully");
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    setLoading(true);
    const updatedUser = await getUserWithRole(session.user);
    setUser(updatedUser);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
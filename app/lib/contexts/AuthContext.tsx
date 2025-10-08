import type { User, Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { loadUserSettings } from '~/lib/settings/loader';
import { createClient } from '~/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (metadata: { name?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // handle missing Supabase configuration
    if (!supabase) {
      setLoading(false);

      return () => {
        void 0;
      };
    }

    // get initial session with error handling
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }: { data: { session: any }; error: any }) => {
        if (error) {
          console.error('Auth getSession error:', error);
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Load user settings for existing session
        if (session?.user) {
          setTimeout(() => {
            loadUserSettings();
          }, 100); // Small delay to ensure authentication is fully established
        }

        setLoading(false);
      })
      .catch((error: any) => {
        console.error('Auth getSession promise error:', error);
        setLoading(false);
      });

    // listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Load user settings when they log in
      if (session?.user) {
        setTimeout(() => {
          loadUserSettings();
        }, 100); // Small delay to ensure authentication is fully established
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const signInWithGitHub = async () => {
    if (!supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      throw error;
    }
  };

  const updateUser = async (metadata: { name?: string }) => {
    if (!supabase || !user) {
      throw new Error('User not authenticated or authentication is not configured.');
    }

    const { error } = await supabase.auth.updateUser({
      data: { user_metadata: metadata },
    });

    if (error) {
      throw error;
    }

    // Update local user state to reflect changes
    setUser({ ...user, user_metadata: { ...user.user_metadata, ...metadata } });
  };

  const deleteAccount = async () => {
    if (!supabase || !user) {
      throw new Error('User not authenticated or authentication is not configured.');
    }

    /*
     * Delete user data from database first (this would need to be implemented server-side)
     * For now, we'll just delete the auth user
     */

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    // Clear local state
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGitHub,
        signInWithGoogle,
        resetPassword,
        updateUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

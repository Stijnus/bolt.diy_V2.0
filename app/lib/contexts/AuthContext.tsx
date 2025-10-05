import type { User, Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
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
        setLoading(false);
      })
      .catch((error: any) => {
        console.error('Auth getSession promise error:', error);
        setLoading(false);
      });

    // listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
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

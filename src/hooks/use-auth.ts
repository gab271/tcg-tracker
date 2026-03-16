"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { mapSupabaseError } from "@/lib/errors";

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });
  const supabase = createClient();

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setState({ user: data.user, isLoading: false });
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setState({ user: session?.user ?? null, isLoading: false });
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(mapSupabaseError(error));
    },
    [supabase.auth]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) throw new Error(mapSupabaseError(error));
    },
    [supabase.auth]
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) throw new Error(mapSupabaseError(error));
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(mapSupabaseError(error));
  }, [supabase.auth]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}

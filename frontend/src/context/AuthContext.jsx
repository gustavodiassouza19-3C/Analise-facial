import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, plan, status, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch profile:', error.message);
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        setToken(session.access_token);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          setToken(session.access_token);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setToken(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      const message = mapAuthError(error.message);
      return { success: false, error: message };
    }

    if (data.user && !data.session) {
      return { success: true, message: 'Confirme seu email para ativar a conta.' };
    }

    return { success: true };
  }, [supabase]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = mapAuthError(error.message);
      return { success: false, error: message };
    }

    return { success: true };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setToken(null);
  }, [supabase]);

  const mergedUser = user && profile
    ? {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        role: profile.role,
        plan_type: profile.plan,
        subscription_status: profile.status,
      }
    : user
      ? { id: user.id, email: user.email }
      : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user: mergedUser,
        profile,
        token,
        loading,
        signUp,
        signIn,
        signOut,
        login: signIn,
        register: signUp,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

function mapAuthError(message) {
  const map = {
    'Invalid login credentials': 'Email ou senha incorretos.',
    'User already registered': 'Este email já está cadastrado.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de email inválido.',
    'Email not confirmed': 'Email ainda não confirmado. Verifique sua caixa de entrada.',
  };
  return map[message] || message;
}

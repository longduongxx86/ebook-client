import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bookstore_token';
const USER_KEY = 'bookstore_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore token and user from localStorage on mount
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password) as { token: string; user: User };
      const { token: newToken, user: newUser } = response;

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const response = await authApi.register(email, password, fullName) as { token: string; user: User };
      const { token: newToken, user: newUser } = response;

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
      if (!clientId) {
        console.log('Google Sign-In error: missing client id');
        return { error: new Error('Missing Google Client ID') };
      }
      type Google = {
        accounts: {
          id: {
            initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; use_fedcm_for_prompt?: boolean }) => void;
            prompt: (notification?: (n: {
              isNotDisplayed: () => boolean;
              getNotDisplayedReason: () => string;
              isDismissed: () => boolean;
              getDismissedReason: () => string;
              isSkipped: () => boolean;
              getSkippedReason: () => string;
            }) => void) => void;
          };
        };
      };
      const loadScript = () =>
        new Promise<void>((resolve, reject) => {
          if (typeof (window as unknown as { google?: Google }).google !== 'undefined') {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google script'));
          document.head.appendChild(script);
        });
      await loadScript();
      const attemptPrompt = (useFedCM: boolean) =>
        new Promise<string>((resolve, reject) => {
          try {
            (window as unknown as { google: Google }).google.accounts.id.initialize({
              client_id: clientId,
              use_fedcm_for_prompt: useFedCM,
              callback: (response: { credential: string }) => {
                const token = response.credential;
                if (token) resolve(token);
                else reject(new Error('No credential received'));
              },
            });
            (window as unknown as { google: Google }).google.accounts.id.prompt();
          } catch (e) {
            reject(e as Error);
          }
        });
      let credential: string;
      try {
        credential = await attemptPrompt(true);
      } catch (err) {
        console.log('Google FedCM failed, falling back to non-FedCM', err);
        credential = await attemptPrompt(false);
      }
      console.log('Google credential received');
      const response = await authApi.loginWithGoogle(credential) as { token: string; user: User };
      const { token: newToken, user: newUser } = response;
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      console.log('Google Sign-In success');
      return { error: null };
    } catch (error) {
      console.log('Google Sign-In error', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
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

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, clearToken } from './api';

export type Permissions = Record<string, Record<string, boolean>>;
export type Role = { name: string; isSystem: boolean; permissions: Permissions } | null;
export type User = { id: string; email: string; name?: string; role?: Role };

type AuthContextType = {
  user: User | null;
  can: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

const USER_KEY = 'exam_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  function persist(res: { token: string; user: User }) {
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }

  // Re-fetch the current user on load so a stale cached role (or a role
  // change made elsewhere) is picked up without requiring a re-login.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((res: { user: User }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        setUser(res.user);
      })
      .catch(() => {
        // Invalid/expired token — api.ts's 401 handler already clears
        // storage and redirects; nothing else to do here.
      });
  }, []);

  function can(permission: string): boolean {
    const [module, action] = permission.split(':');
    return !!user?.role?.permissions?.[module]?.[action];
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        can,
        login: async (email, password) =>
          persist(await api.login({ email, password })),
        signup: async (email, password, name) =>
          persist(await api.signup({ email, password, name })),
        logout: () => {
          clearToken();
          localStorage.removeItem(USER_KEY);
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, ReactNode } from 'react';
import { api, setToken, clearToken } from './api';

export type User = { id: string; email: string; name?: string };

type AuthContextType = {
  user: User | null;
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

  return (
    <AuthContext.Provider
      value={{
        user,
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

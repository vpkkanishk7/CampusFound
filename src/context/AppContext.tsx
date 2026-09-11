import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

const LS_KEY = 'campusfound_user';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialise from localStorage so the session survives page refresh
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(LS_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [user]);

  const setUser = (u: User | null) => setUserState(u);

  return (
    <AppContext.Provider value={{ user, setUser, isAuthenticated: !!user }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
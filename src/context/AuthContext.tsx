import React, { createContext, useContext, useState, useEffect } from 'react';
import { CHARACTERS, type CharacterTheme } from '../constants/themes';

interface AuthContextType {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
  activeTheme: CharacterTheme;
  setActiveTheme: (theme: CharacterTheme) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('anime-notion-user');
  });

  const [activeTheme, setActiveThemeState] = useState<CharacterTheme>(() => {
    const saved = localStorage.getItem('anime-notion-theme');
    if (saved) {
      const found = CHARACTERS.find(c => c.id === saved);
      if (found) return found;
    }
    return CHARACTERS[0];
  });

  const setActiveTheme = (theme: CharacterTheme) => {
    setActiveThemeState(theme);
    localStorage.setItem('anime-notion-theme', theme.id);
  };

  const login = (username: string) => {
    setUser(username);
    localStorage.setItem('anime-notion-user', username);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('anime-notion-user');
  };

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', activeTheme.color);
    document.documentElement.style.setProperty('--accent-glow', activeTheme.glow);
  }, [activeTheme]);

  return (
    <AuthContext.Provider value={{ user, login, logout, activeTheme, setActiveTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

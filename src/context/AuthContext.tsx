import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { CHARACTERS, type CharacterTheme } from '../constants/themes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface UserProfile {
  username: string;
  fullName: string;
  bio: string;
  rank: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: string | null;
  token: string | null;
  profile: UserProfile | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  activeTheme: CharacterTheme;
  setActiveTheme: (theme: CharacterTheme) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(localStorage.getItem('anime-notion-user'));
  const [token, setToken] = useState<string | null>(localStorage.getItem('anime-notion-token'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [activeTheme, setActiveThemeState] = useState<CharacterTheme>(() => {
    const saved = localStorage.getItem('anime-notion-theme');
    if (saved) {
      const found = CHARACTERS.find(c => c.id === saved);
      if (found) return found;
    }
    return CHARACTERS[0];
  });

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setProfile(res.data);
      
      // Sync theme from server profile
      const serverTheme = CHARACTERS.find(c => c.id === res.data.themeId);
      if (serverTheme) {
        setActiveThemeState(serverTheme);
        localStorage.setItem('anime-notion-theme', serverTheme.id);
      }
    } catch (err) {
      console.error('Failed to fetch profile');
    }
  };

  useEffect(() => {
    if (token) fetchProfile(token);
  }, [token]);

  const setActiveTheme = async (theme: CharacterTheme) => {
    setActiveThemeState(theme);
    localStorage.setItem('anime-notion-theme', theme.id);
    
    if (token) {
      try {
        await axios.put(`${API_URL}/user/theme`, { themeId: theme.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to sync theme');
      }
    }
  };

  const login = async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { token } = response.data;
    
    setToken(token);
    setUser(username);
    localStorage.setItem('anime-notion-token', token);
    localStorage.setItem('anime-notion-user', username);
    await fetchProfile(token);
  };

  const register = async (username: string, password: string) => {
    await axios.post(`${API_URL}/auth/register`, { username, password });
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!token || !profile) return;
    const newProfile = { ...profile, ...updates };
    await axios.put(`${API_URL}/user/profile`, newProfile, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfile(newProfile);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setProfile(null);
    localStorage.removeItem('anime-notion-token');
    localStorage.removeItem('anime-notion-user');
    window.location.reload();
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', activeTheme.color);
    document.documentElement.style.setProperty('--accent-glow', activeTheme.glow);
    document.documentElement.style.setProperty('--bg-image', `url(${activeTheme.backgroundImage})`);
  }, [activeTheme]);

  return (
    <AuthContext.Provider value={{ user, token, profile, login, register, logout, updateProfile, activeTheme, setActiveTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

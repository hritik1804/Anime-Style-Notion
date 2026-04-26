import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:5001/api';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  folderId?: string;
}

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNote: (folderId?: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  loading: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [notesRes, foldersRes] = await Promise.all([
        axios.get(`${API_URL}/notes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/folders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotes(notesRes.data);
      setFolders(foldersRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const createNote = async (folderId?: string) => {
    const now = Date.now();
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      createdAt: now,
      updatedAt: now,
      folderId,
    };
    
    try {
      await axios.post(`${API_URL}/notes`, newNote, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    } catch (err) {
      console.error('Failed to create note');
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updatedAt = Date.now();
    try {
      await axios.put(`${API_URL}/notes/${id}`, { ...updates, updatedAt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt } : n));
    } catch (err) {
      console.error('Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
    } catch (err) {
      console.error('Failed to delete note');
    }
  };

  const createFolder = async (name: string) => {
    const newFolder: Folder = { id: uuidv4(), name, createdAt: Date.now() };
    try {
      await axios.post(`${API_URL}/folders`, newFolder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(prev => [...prev, newFolder]);
    } catch (err) {
      console.error('Failed to create folder');
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/folders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(prev => prev.filter(f => f.id !== id));
      setNotes(prev => prev.filter(n => n.folderId !== id));
      // Reset active note if it was in that folder
      setActiveNoteId(prev => notes.find(n => n.id === prev)?.folderId === id ? null : prev);
    } catch (err) {
      console.error('Failed to delete folder');
    }
  };

  return (
    <NotesContext.Provider value={{
      notes, folders, activeNoteId, setActiveNoteId,
      createNote, updateNote, deleteNote, createFolder, deleteFolder,
      loading
    }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) throw new Error('useNotes must be used within a NotesProvider');
  return context;
};

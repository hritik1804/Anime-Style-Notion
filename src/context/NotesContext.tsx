import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const API_URL = 'http://localhost:5001/api';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  position: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  folderId?: string;
  isPublic?: boolean;
  position: number;
}

type TemplateType = 'blank' | 'mission' | 'chronicle';

const TEMPLATES: Record<TemplateType, { title: string; content: string }> = {
  blank: { title: 'Untitled Note', content: '' },
  mission: { 
    title: 'Mission Briefing', 
    content: '<h1>Mission: [Title]</h1><p><strong>Rank:</strong> S-Class</p><p><strong>Objective:</strong></p><ul><li>[ ] First task</li><li>[ ] Second task</li></ul><p><strong>Notes:</strong></p><blockquote>Capture tactical observations here...</blockquote>' 
  },
  chronicle: { 
    title: 'Daily Chronicle', 
    content: '<h2>Journal Entry - ' + new Date().toLocaleDateString() + '</h2><p>Today\'s spiritual pressure was...</p><h3>Reflections</h3><p><em>Focus on your growth today.</em></p>' 
  }
};

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNote: (folderId?: string, template?: TemplateType) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  reorderNotes: (newNotes: Note[]) => Promise<void>;
  reorderFolders: (newFolders: Folder[]) => Promise<void>;
  loading: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { socket } = useSocket();
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
      setNotes(notesRes.data.sort((a: Note, b: Note) => a.position - b.position));
      setFolders(foldersRes.data.sort((a: Folder, b: Folder) => a.position - b.position));
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Real-time listeners
  useEffect(() => {
    if (socket) {
      socket.on('notes-updated', fetchContent);
      socket.on('folders-updated', fetchContent);
      return () => {
        socket.off('notes-updated');
        socket.off('folders-updated');
      };
    }
  }, [socket, fetchContent]);

  const createNote = async (folderId?: string, template: TemplateType = 'blank') => {
    const now = Date.now();
    const { title, content } = TEMPLATES[template];
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
      folderId,
      isPublic: false,
      position: 0
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
    const newFolder: Folder = { id: uuidv4(), name, createdAt: Date.now(), position: 0 };
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
      setActiveNoteId(prev => notes.find(n => n.id === prev)?.folderId === id ? null : prev);
    } catch (err) {
      console.error('Failed to delete folder');
    }
  };

  const reorderNotes = async (newNotes: Note[]) => {
    setNotes(newNotes);
    try {
      await axios.post(`${API_URL}/notes/reorder`, {
        notes: newNotes.map((n, i) => ({ id: n.id, position: i }))
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to reorder notes');
    }
  };

  const reorderFolders = async (newFolders: Folder[]) => {
    setFolders(newFolders);
    try {
      await axios.post(`${API_URL}/folders/reorder`, {
        folders: newFolders.map((f, i) => ({ id: f.id, position: i }))
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to reorder folders');
    }
  };

  return (
    <NotesContext.Provider value={{
      notes, folders, activeNoteId, setActiveNoteId,
      createNote, updateNote, deleteNote, createFolder, deleteFolder,
      reorderNotes, reorderFolders,
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

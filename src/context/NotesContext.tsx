import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
  folderId?: string; // Optional: if null, it's at the root level
}

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNote: (folderId?: string) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('anime-notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('anime-folders');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);

  useEffect(() => {
    localStorage.setItem('anime-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('anime-folders', JSON.stringify(folders));
  }, [folders]);

  const createNote = (folderId?: string) => {
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      folderId,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const createFolder = (name: string) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  };

  const deleteFolder = (id: string) => {
    // Delete the folder
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    // Also delete all notes inside this folder
    const notesToDelete = notes.filter(n => n.folderId === id).map(n => n.id);
    setNotes((prev) => prev.filter((note) => note.folderId !== id));
    
    if (activeNoteId && notesToDelete.includes(activeNoteId)) {
      setActiveNoteId(null);
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        activeNoteId,
        setActiveNoteId,
        createNote,
        updateNote,
        deleteNote,
        createFolder,
        deleteFolder,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

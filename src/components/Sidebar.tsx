import React, { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { useAudioContext } from '../context/AudioContext';
import { CHARACTERS } from '../constants/themes';
import { 
  FileText, Plus, Trash2, LogOut, FolderPlus, 
  Folder as FolderIcon, FolderOpen, ChevronRight, 
  ChevronDown, Sparkles, Menu, X, Home, 
  Volume2, VolumeX, User
} from 'lucide-react';
import './Sidebar.css';

// Added a new prop to handle view switching
interface SidebarProps {
  currentView: 'home' | 'editor' | 'profile';
  onViewChange: (view: 'home' | 'profile') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { notes, folders, activeNoteId, setActiveNoteId, createNote, deleteNote, createFolder, deleteFolder } = useNotes();
  const { user, profile, logout, activeTheme, setActiveTheme } = useAuth();
  const { playTheme, isMuted, toggleMute } = useAudioContext();

  // Track which folders are expanded
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when a note is selected
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeNoteId]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateNote = (folderId?: string) => {
    createNote(folderId);
    if (folderId) {
      setExpandedFolders(prev => new Set(prev).add(folderId));
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = CHARACTERS.find(c => c.id === e.target.value);
    if (found) {
      setActiveTheme(found);
      if (!isMuted) playTheme(found.audio);
    }
  };

  const rootNotes = notes.filter(n => !n.folderId);

  return (
    <>
      <button 
        className="menu-btn" 
        onClick={() => setIsSidebarOpen(true)}
        title="Open Menu"
      >
        <Menu size={24} />
      </button>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info" onClick={() => onViewChange('profile')} style={{cursor: 'pointer'}}>
            <div className="user-avatar">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar" className="avatar-img" />
              ) : (
                user?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{profile?.fullName || user}</span>
              <span className="user-rank">{profile?.rank || 'Shinigami'}</span>
            </div>
          </div>
          <div style={{display: 'flex', gap: '5px'}}>
            <button className="icon-btn logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
            <button className="icon-btn close-sidebar-btn" onClick={() => setIsSidebarOpen(false)} title="Close Menu">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'home' ? 'active' : ''}`} 
            onClick={() => {
              setActiveNoteId(null);
              onViewChange('home');
            }}
          >
            <Home size={18} />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} 
            onClick={() => {
              setActiveNoteId(null);
              onViewChange('profile');
            }}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="action-btn" onClick={() => handleCreateNote()} title="New Root Note">
            <Plus size={16} /> New Note
          </button>
          <button className="action-btn" onClick={() => setIsCreatingFolder(true)} title="New Folder">
            <FolderPlus size={16} /> New Folder
          </button>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="create-folder-form">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
              onBlur={() => !newFolderName.trim() && setIsCreatingFolder(false)}
            />
          </form>
        )}

        <div className="sidebar-content">
          {/* Render Folders */}
          {folders.map(folder => {
            const isExpanded = expandedFolders.has(folder.id);
            const folderNotes = notes.filter(n => n.folderId === folder.id);

            return (
              <div key={folder.id} className="folder-container">
                <div className="folder-header" onClick={() => toggleFolder(folder.id)}>
                  {isExpanded ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />}
                  {isExpanded ? <FolderOpen size={16} className="folder-icon" /> : <FolderIcon size={16} className="folder-icon" />}
                  <span className="folder-name">{folder.name}</span>
                  <div className="folder-actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); handleCreateNote(folder.id); }}
                      title="Add Note to Folder"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="icon-btn delete-icon"
                      onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                      title="Delete Folder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="folder-contents">
                    {folderNotes.length === 0 && <div className="empty-folder">Empty</div>}
                    {folderNotes.map(note => (
                      <div
                        key={note.id}
                        className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                        onClick={() => setActiveNoteId(note.id)}
                      >
                        <FileText size={14} className="note-icon" />
                        <div className="note-title">{note.title || 'Untitled'}</div>
                        <button
                          className="delete-btn"
                          onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                          title="Delete Note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="root-notes">
            {rootNotes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                onClick={() => setActiveNoteId(note.id)}
              >
                <FileText size={16} className="note-icon" />
                <div className="note-title">{note.title || 'Untitled'}</div>
                <button
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <button 
              className="icon-btn mute-toggle" 
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="theme-selector-wrapper">
              <Sparkles size={14} className="theme-icon" />
              <select 
                className="theme-select"
                value={activeTheme.id}
                onChange={handleThemeChange}
                title="Change Aura"
              >
                {CHARACTERS.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

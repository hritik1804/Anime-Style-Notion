import React from 'react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { Folder, FileText, ChevronRight, Sparkles, Clock, Layers } from 'lucide-react';
import './Home.css';

export const Home: React.FC = () => {
  const { notes, folders, setActiveNoteId } = useNotes();
  const { user, activeTheme } = useAuth();

  const rootNotes = notes.filter(note => !note.folderId);
  const totalNotes = notes.length;

  return (
    <div className="home-container">
      <div className="bento-grid">
        {/* Hero Card */}
        <div className="bento-card hero-card glass">
          <div className="hero-content">
            <h1>Welcome back, <span className="aura-text">{user}</span></h1>
            <p>Your workspace is synced with the <span className="soul-text">Soul Society Archives</span>.</p>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-label">Active Notes</span>
              <span className="stat-value">{totalNotes}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Folders</span>
              <span className="stat-value">{folders.length}</span>
            </div>
          </div>
        </div>

        {/* Character/Aura Card */}
        <div className="bento-card aura-card glass">
          <div className="card-header">
            <Sparkles size={18} className="icon-glow" />
            <span>Current Aura</span>
          </div>
          <div className="aura-display">
            <div className="aura-name">{activeTheme.name}</div>
            <div className="aura-dot" style={{ backgroundColor: activeTheme.color }}></div>
          </div>
          <p className="aura-desc">Your theme is synchronized across all devices.</p>
        </div>

        {/* Folders Section */}
        <div className="bento-card folders-section glass">
          <div className="card-header">
            <Layers size={18} />
            <span>Project Folders</span>
          </div>
          <div className="mini-grid">
            {folders.slice(0, 4).map(folder => (
              <div key={folder.id} className="mini-card folder-mini">
                <Folder size={20} color="#fbbf24" />
                <span className="truncate">{folder.name}</span>
              </div>
            ))}
            {folders.length === 0 && <span className="empty-hint">No folders yet</span>}
          </div>
        </div>

        {/* Recent Notes Section - Wide Card */}
        <div className="bento-card recent-notes-card glass wide">
          <div className="card-header">
            <Clock size={18} />
            <span>Recent Chronicles</span>
          </div>
          <div className="notes-list">
            {rootNotes.slice(0, 5).map(note => (
              <div 
                key={note.id} 
                className="note-row"
                onClick={() => setActiveNoteId(note.id)}
              >
                <div className="note-row-info">
                  <FileText size={16} />
                  <span className="note-row-title">{note.title || 'Untitled'}</span>
                </div>
                <div className="note-row-meta">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
            {rootNotes.length === 0 && <div className="empty-state">Your archives are empty.</div>}
          </div>
        </div>

        {/* Quick Action Card */}
        <div className="bento-card action-card glass accent-bg">
          <h3>Begin New Tale</h3>
          <p>Create a root note to capture your thoughts instantly.</p>
          <button className="action-button-large">
            Initialize Note
          </button>
        </div>
      </div>
    </div>
  );
};

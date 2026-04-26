import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { useAudioContext } from '../context/AudioContext';
import { CHARACTERS } from '../constants/themes';
import { FileText, Folder, Sparkles, Zap } from 'lucide-react';
import './CommandPalette.css';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { notes, folders, setActiveNoteId } = useNotes();
  const { setActiveTheme } = useAuth();
  const { playTheme } = useAudioContext();
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Command logic
  const items = [
    ...notes.map(n => ({ type: 'note', id: n.id, title: n.title, icon: <FileText size={16} /> })),
    ...folders.map(f => ({ type: 'folder', id: f.id, title: f.name, icon: <Folder size={16} /> })),
    ...CHARACTERS.map(c => ({ type: 'theme', id: c.id, title: `Switch to ${c.name}`, theme: c, icon: <Sparkles size={16} /> })),
  ].filter(item => (item.title || '').toLowerCase().includes((query || '').toLowerCase()));

  const handleSelect = (item: any) => {
    if (item.type === 'note') {
      setActiveNoteId(item.id);
    } else if (item.type === 'theme') {
      setActiveTheme(item.theme);
      playTheme(item.theme.audio);
    }
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      if (items[selectedIndex]) handleSelect(items[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="command-palette glass" onClick={e => e.stopPropagation()}>
        <div className="cp-header">
          <Zap size={18} className="icon-glow" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="cp-shortcut">
            <kbd>ESC</kbd>
          </div>
        </div>
        
        <div className="cp-results custom-scrollbar">
          {items.length === 0 && <div className="cp-no-results">No matches found.</div>}
          {items.map((item, idx) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`cp-item ${idx === selectedIndex ? 'active' : ''}`}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => handleSelect(item)}
            >
              <div className="cp-item-icon">{item.icon}</div>
              <span className="cp-item-title">{item.title}</span>
              <div className="cp-item-meta">{item.type}</div>
            </div>
          ))}
        </div>

        <div className="cp-footer">
          <div className="cp-help">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>ENTER</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

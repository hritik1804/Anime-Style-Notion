import React, { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { useAudioContext } from '../context/AudioContext';
import { CHARACTERS } from '../constants/themes';
import { 
  Plus, Trash2, LogOut, FolderPlus, 
  Folder as FolderIcon, FolderOpen, ChevronRight, 
  ChevronDown, Sparkles, Menu, X, Home, 
  Volume2, VolumeX, User, Music, ChevronUp
} from 'lucide-react';
import { 
  DndContext, closestCenter, KeyboardSensor, 
  PointerSensor, useSensor, useSensors, type DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { SortableNoteItem } from './SortableNoteItem';
import './Sidebar.css';

interface SidebarProps {
  currentView: 'home' | 'editor' | 'profile';
  onViewChange: (view: 'home' | 'profile') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { 
    notes, folders, activeNoteId, setActiveNoteId, 
    createNote, deleteNote, createFolder, deleteFolder, 
    reorderNotes 
  } = useNotes();
  
  const { user, profile, logout, activeTheme, setActiveTheme } = useAuth();
  const { 
    playTheme, isMuted, toggleMute, 
    isAmbientPlaying, toggleAmbient, ambientVolume, setAmbientVolume 
  } = useAudioContext();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeNoteId]);

  const handleDragEndNotes = (event: DragEndEvent, folderId?: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const filteredNotes = notes.filter(n => n.folderId === folderId);
      const oldIndex = filteredNotes.findIndex(n => n.id === active.id);
      const newIndex = filteredNotes.findIndex(n => n.id === over.id);
      
      const reorderedSection = arrayMove(filteredNotes, oldIndex, newIndex);
      const otherNotes = notes.filter(n => n.folderId !== folderId);
      reorderNotes([...otherNotes, ...reorderedSection]);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCreateNote = (folderId?: string, template: any = 'blank') => {
    createNote(folderId, template);
    setShowTemplatePicker(false);
    if (folderId) setExpandedFolders(prev => new Set(prev).add(folderId));
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
      <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info" onClick={() => onViewChange('profile')} style={{cursor: 'pointer'}}>
            <div className="user-avatar">
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" className="avatar-img" /> : user?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{profile?.fullName || user}</span>
              <span className="user-rank">{profile?.rank || 'Shinigami'}</span>
            </div>
          </div>
          <div style={{display: 'flex', gap: '5px'}}>
            <button className="icon-btn logout-btn" onClick={logout}><LogOut size={16} /></button>
            <button className="icon-btn close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
        </div>

        <div className="sidebar-nav">
          <button className={`nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setActiveNoteId(null); onViewChange('home'); }}>
            <Home size={18} /><span>Home</span>
          </button>
          <button className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => { setActiveNoteId(null); onViewChange('profile'); }}>
            <User size={18} /><span>Profile</span>
          </button>
        </div>

        <div className="sidebar-actions">
          <div className="new-note-container">
            <button className="action-btn main-action" onClick={() => handleCreateNote()}><Plus size={16} /> New Note</button>
            <button className="action-btn template-toggle" onClick={() => setShowTemplatePicker(!showTemplatePicker)}>
              <ChevronUp size={14} className={showTemplatePicker ? 'rotate-180' : ''} />
            </button>
            {showTemplatePicker && (
              <div className="template-picker glass">
                <div className="template-item" onClick={() => handleCreateNote(undefined, 'blank')}>Blank Scroll</div>
                <div className="template-item" onClick={() => handleCreateNote(undefined, 'mission')}>Mission Briefing</div>
                <div className="template-item" onClick={() => handleCreateNote(undefined, 'chronicle')}>Daily Chronicle</div>
              </div>
            )}
          </div>
          <button className="action-btn" onClick={() => setIsCreatingFolder(true)}><FolderPlus size={16} /></button>
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
          {folders.map(folder => {
            const isExpanded = expandedFolders.has(folder.id);
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            return (
              <div key={folder.id} className="folder-container">
                <div className="folder-header" onClick={() => toggleFolder(folder.id)}>
                  {isExpanded ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />}
                  {isExpanded ? <FolderOpen size={16} className="folder-icon" /> : <FolderIcon size={16} className="folder-icon" />}
                  <span className="folder-name">{folder.name || 'Unnamed Folder'}</span>
                  <div className="folder-actions">
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleCreateNote(folder.id); }}><Plus size={14} /></button>
                    <button className="icon-btn delete-icon" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}><Trash2 size={14} /></button>
                  </div>
                </div>
                {isExpanded && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndNotes(e, folder.id)}>
                    <SortableContext items={folderNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                      <div className="folder-contents">
                        {folderNotes.map(note => (
                          <SortableNoteItem key={note.id} note={note} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} deleteNote={deleteNote} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            );
          })}
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndNotes(e, undefined)}>
            <SortableContext items={rootNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="root-notes">
                {rootNotes.map((note) => (
                  <SortableNoteItem key={note.id} note={note} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} deleteNote={deleteNote} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="sidebar-footer">
          {showAudioControls && (
            <div className="audio-advanced glass">
              <div className="audio-row">
                <span>Atmosphere</span>
                <button className={`toggle-pill ${isAmbientPlaying ? 'on' : ''}`} onClick={toggleAmbient}>{isAmbientPlaying ? 'ON' : 'OFF'}</button>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={ambientVolume} onChange={(e) => setAmbientVolume(parseFloat(e.target.value))} className="volume-slider" />
            </div>
          )}
          <div className="sidebar-footer-row">
            <button className="icon-btn mute-toggle" onClick={toggleMute}>{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <div className="theme-selector-wrapper">
              <Sparkles size={14} className="theme-icon" /><select className="theme-select" value={activeTheme.id} onChange={handleThemeChange}>
                {CHARACTERS.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
              </select>
            </div>
            <button className={`icon-btn ${showAudioControls ? 'active' : ''}`} onClick={() => setShowAudioControls(!showAudioControls)}><Music size={18} /></button>
          </div>
        </div>
      </div>
    </>
  );
};

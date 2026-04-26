import React from 'react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { Folder, FileText, ChevronRight, Sparkles, Clock, Layers, Activity } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActivityHeatmap } from './ActivityHeatmap';
import './Home.css';

const SortableBentoCard: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 100 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`bento-card ${className}`} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const Home: React.FC = () => {
  const { notes, folders, setActiveNoteId } = useNotes();
  const { user, activeTheme } = useAuth();

  const [cardOrder, setCardOrder] = React.useState(['hero', 'aura', 'folders', 'heatmap', 'recent', 'action']);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const rootNotes = notes.filter(note => !note.folderId);

  const renderCard = (id: string) => {
    switch (id) {
      case 'hero':
        return (
          <SortableBentoCard key="hero" id="hero" className="hero-card glass">
            <div className="hero-content">
              <h1>Welcome back, <span className="aura-text">{user}</span></h1>
              <p>Your workspace is synced with the <span className="soul-text">Soul Society Archives</span>.</p>
            </div>
            <div className="hero-stats">
              <div className="stat"><span className="stat-label">Active Notes</span><span className="stat-value">{notes.length}</span></div>
              <div className="stat"><span className="stat-label">Folders</span><span className="stat-value">{folders.length}</span></div>
            </div>
          </SortableBentoCard>
        );
      case 'aura':
        return (
          <SortableBentoCard key="aura" id="aura" className="aura-card glass">
            <div className="card-header"><Sparkles size={18} className="icon-glow" /><span>Current Aura</span></div>
            <div className="aura-display">
              <div className="aura-name">{activeTheme.name}</div>
              <div className="aura-dot" style={{ backgroundColor: activeTheme.color }}></div>
            </div>
          </SortableBentoCard>
        );
      case 'heatmap':
        return (
          <SortableBentoCard key="heatmap" id="heatmap" className="heatmap-card glass">
            <div className="card-header"><Activity size={18} /><span>Activity Log</span></div>
            <ActivityHeatmap />
          </SortableBentoCard>
        );
      case 'folders':
        return (
          <SortableBentoCard key="folders" id="folders" className="folders-section glass">
            <div className="card-header"><Layers size={18} /><span>Project Folders</span></div>
            <div className="mini-grid">
              {folders.slice(0, 4).map(f => (
                <div key={f.id} className="mini-card folder-mini"><Folder size={20} color="#fbbf24" /><span className="truncate">{f.name}</span></div>
              ))}
              {folders.length === 0 && <span className="empty-hint">No folders yet</span>}
            </div>
          </SortableBentoCard>
        );
      case 'recent':
        return (
          <SortableBentoCard key="recent" id="recent" className="recent-notes-card glass wide">
            <div className="card-header"><Clock size={18} /><span>Recent Chronicles</span></div>
            <div className="notes-list">
              {rootNotes.slice(0, 5).map(note => (
                <div key={note.id} className="note-row" onClick={(e) => { e.stopPropagation(); setActiveNoteId(note.id); }}>
                  <div className="note-row-info"><FileText size={16} /><span className="note-row-title">{note.title || 'Untitled'}</span></div>
                  <div className="note-row-meta"><span>{new Date(note.updatedAt).toLocaleDateString()}</span><ChevronRight size={14} /></div>
                </div>
              ))}
            </div>
          </SortableBentoCard>
        );
      case 'action':
        return (
          <SortableBentoCard key="action" id="action" className="action-card glass accent-bg">
            <h3>Begin New Tale</h3>
            <button className="action-button-large">Initialize Note</button>
          </SortableBentoCard>
        );
      default: return null;
    }
  };

  return (
    <div className="home-container">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
          <div className="bento-grid">
            {cardOrder.map(id => renderCard(id))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

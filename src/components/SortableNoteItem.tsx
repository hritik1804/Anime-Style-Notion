import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Trash2, GripVertical } from 'lucide-react';

interface SortableNoteItemProps {
  note: any;
  activeNoteId: string | null;
  setActiveNoteId: (id: string) => void;
  deleteNote: (id: string) => void;
}

export const SortableNoteItem: React.FC<SortableNoteItemProps> = ({ 
  note, activeNoteId, setActiveNoteId, deleteNote 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
      onClick={() => setActiveNoteId(note.id)}
    >
      <div {...attributes} {...listeners} className="drag-handle">
        <GripVertical size={14} opacity={0.3} />
      </div>
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
  );
};

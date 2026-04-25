import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useNotes } from '../context/NotesContext';
import './Editor.css';

export const Editor: React.FC = () => {
  const { notes, activeNoteId, updateNote } = useNotes();
  
  const activeNote = notes.find((n) => n.id === activeNoteId);

  const editor = useEditor({
    extensions: [StarterKit],
    content: activeNote?.content || '',
    onUpdate: ({ editor }) => {
      if (activeNoteId) {
        updateNote(activeNoteId, { content: editor.getHTML() });
      }
    },
  });

  // Update editor content when active note changes
  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content);
      }
    }
  }, [activeNoteId, editor]);

  if (!activeNoteId || !activeNote) {
    return (
      <div className="editor-empty">
        <div className="empty-message">
          <div className="glowing-orb"></div>
          <p>Select a note or create a new one to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <input
          type="text"
          className="title-input"
          value={activeNote.title}
          onChange={(e) => updateNote(activeNoteId, { title: e.target.value })}
          placeholder="Untitled Note"
        />
        <div className="note-meta">
          Created: {new Date(activeNote.createdAt).toLocaleString()}
        </div>
      </div>
      <div className="editor-body">
        <EditorContent editor={editor} className="tiptap-wrapper" />
      </div>
    </div>
  );
};

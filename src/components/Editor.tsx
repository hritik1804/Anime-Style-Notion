import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { useNotes } from '../context/NotesContext';
import { Share2, Globe, Lock, Copy, Check, Image as ImageIcon, Video } from 'lucide-react';
import './Editor.css';

export const Editor: React.FC = () => {
  const { notes, activeNoteId, updateNote } = useNotes();
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const [copied, setCopied] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }),
      Youtube.configure({ width: 480, height: 320 }),
    ],
    content: activeNote?.content || '',
    onUpdate: ({ editor }) => {
      if (activeNoteId) {
        updateNote(activeNoteId, { content: editor.getHTML() });
      }
    },
  }, [activeNoteId]);

  useEffect(() => {
    if (editor && activeNote && editor.getHTML() !== activeNote.content) {
      editor.commands.setContent(activeNote.content);
    }
  }, [activeNoteId, editor, activeNote]);

  if (!activeNote) {
    return (
      <div className="editor-empty">
        <div className="empty-message">
          <div className="glowing-orb"></div>
          <p>Select a chronicle from the archives or initialize a new one.</p>
        </div>
      </div>
    );
  }

  const addImage = () => {
    const url = window.prompt('URL of the imagery:');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  const addYoutubeVideo = () => {
    const url = window.prompt('YouTube Scroll URL:');
    if (url) editor?.commands.setYoutubeVideo({ src: url });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(activeNote.id, { title: e.target.value });
  };

  const togglePublic = () => {
    updateNote(activeNote.id, { isPublic: !activeNote.isPublic });
  };

  const shareUrl = `${window.location.origin}/share/${activeNote.id}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-header-main">
          <input
            type="text"
            className="title-input"
            value={activeNote.title}
            onChange={handleTitleChange}
            placeholder="Chronicling title..."
          />
          <div className="share-controls">
            <button 
              className={`share-btn ${activeNote.isPublic ? 'public' : ''}`}
              onClick={togglePublic}
              title={activeNote.isPublic ? "Make Private" : "Make Public"}
            >
              {activeNote.isPublic ? <Globe size={18} /> : <Lock size={18} />}
              <span>{activeNote.isPublic ? 'Public' : 'Private'}</span>
            </button>
          </div>
        </div>
        
        <div className="editor-toolbar">
          <button className="toolbar-btn" onClick={addImage} title="Add Image">
            <ImageIcon size={16} />
          </button>
          <button className="toolbar-btn" onClick={addYoutubeVideo} title="Embed YouTube">
            <Video size={16} />
          </button>
        </div>

        <div className="note-meta">
          <span>Last modified: {new Date(activeNote.updatedAt).toLocaleString()}</span>
        </div>

        {activeNote.isPublic && (
          <div className="public-link-box glass">
            <div className="link-info">
              <Share2 size={14} />
              <input readOnly value={shareUrl} className="share-url-input" />
            </div>
            <button className="copy-btn" onClick={copyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="editor-body">
        <div className="tiptap-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

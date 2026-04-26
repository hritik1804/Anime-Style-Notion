import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Globe } from 'lucide-react';
import './Editor.css';

const API_URL = 'http://localhost:5001/api';

export const SharedNote: React.FC<{ noteId: string }> = ({ noteId }) => {
  const [note, setNote] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedNote = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/notes/${noteId}`);
        setNote(res.data);
      } catch (err) {
        setError('This chronicle is private or does not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedNote();
  }, [noteId]);

  if (loading) return <div className="editor-empty"><div className="spin-orb"></div></div>;
  if (error) return <div className="editor-empty"><p>{error}</p></div>;

  return (
    <div className="editor-container shared-view">
      <div className="editor-header">
        <div className="public-badge">
          <Globe size={14} /> <span>Public Shared Scroll</span>
        </div>
        <h1 className="shared-title">{note.title}</h1>
        <div className="note-meta">
          <Clock size={12} />
          <span>Last modified: {new Date(note.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="editor-body">
        <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: note.content }} />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, FileText, Send, Loader2, X } from 'lucide-react';
import './AICompanion.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface AICompanionProps {
  noteContent: string;
  onClose: () => void;
}

export const AICompanion: React.FC<AICompanionProps> = ({ noteContent, onClose }) => {
  const { token } = useAuth();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/ai/summarize`, 
        { content: noteContent.replace(/<[^>]*>/g, '') }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setSummary('Failed to channel spiritual energy...');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await axios.post(`${API_URL}/ai/process-pdf`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setSummary('Failed to decipher the scroll...');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel glass">
      <div className="ai-header">
        <div className="ai-title">
          <Sparkles size={18} className="aura-icon" />
          <span>Zanpakuto Spirit</span>
        </div>
        <button onClick={onClose} className="close-btn"><X size={18} /></button>
      </div>

      <div className="ai-content">
        {loading ? (
          <div className="ai-loading">
            <Loader2 className="spinner" size={32} />
            <p>Channeling spiritual energy...</p>
          </div>
        ) : summary ? (
          <div className="ai-response">
            <div className="response-header">Mission Briefing:</div>
            <div className="response-text">{summary}</div>
            <button onClick={() => setSummary('')} className="reset-btn">Ask something else</button>
          </div>
        ) : (
          <div className="ai-actions">
            <p>I am your blade's spirit. How shall I assist you today?</p>
            
            <button className="ai-action-btn" onClick={handleSummarize}>
              <Send size={16} />
              <span>Summarize this Note</span>
            </button>

            <label className="ai-action-btn pdf-btn">
              <FileText size={16} />
              <span>Analyze Training Scroll (PDF)</span>
              <input type="file" accept=".pdf" onChange={handleFileUpload} hidden />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

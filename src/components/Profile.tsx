import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, BookOpen, Save, RefreshCw } from 'lucide-react';
import './Profile.css';

export const Profile: React.FC = () => {
  const { profile, updateProfile, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    rank: '',
    avatarUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        rank: profile.rank || 'Substitute Shinigami',
        avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`
      });
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile(formData);
      setMessage('Profile synchronized successfully!');
    } catch (err) {
      setMessage('Failed to sync profile.');
    } finally {
      setSaving(false);
    }
  };

  const generateNewAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setFormData(prev => ({
      ...prev,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`
    }));
  };

  return (
    <div className="profile-container">
      <div className="bento-grid profile-grid">
        {/* Profile Header Card */}
        <div className="bento-card profile-hero-card glass wide">
          <div className="profile-hero-content">
            <div className="profile-avatar-wrapper">
              <img src={formData.avatarUrl} alt="Avatar" className="profile-avatar-large" />
              <button className="avatar-refresh-btn" onClick={generateNewAvatar} title="Randomize Avatar">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="profile-hero-text">
              <h1>{formData.fullName || user}</h1>
              <span className="profile-rank-tag">{formData.rank}</span>
              <p className="profile-username">@{user}</p>
            </div>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="bento-card profile-edit-card glass span-2">
          <div className="card-header">
            <User size={18} className="icon-glow" />
            <span>Identity Details</span>
          </div>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="e.g. Ichigo Kurosaki"
                className="profile-input"
              />
            </div>
            <div className="form-group">
              <label>Rank / Title</label>
              <input 
                type="text" 
                value={formData.rank}
                onChange={e => setFormData({...formData, rank: e.target.value})}
                placeholder="e.g. Captain of 10th Division"
                className="profile-input"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea 
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Write your chronicle..."
                className="profile-input profile-textarea"
              />
            </div>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
              {saving ? 'Synchronizing...' : 'Save Changes'}
            </button>
            {message && <p className="sync-message">{message}</p>}
          </form>
        </div>

        {/* Account Info Card */}
        <div className="bento-card account-stats-card glass">
          <div className="card-header">
            <Shield size={18} />
            <span>Security Status</span>
          </div>
          <div className="status-item">
            <div className="status-dot online"></div>
            <span>Soul Link Active</span>
          </div>
          <div className="status-item">
            <div className="status-dot encrypted"></div>
            <span>JWT Encrypted</span>
          </div>
        </div>

        {/* Fun Stats Card */}
        <div className="bento-card quote-card glass">
          <div className="card-header">
            <BookOpen size={18} />
            <span>Chronicle Status</span>
          </div>
          <div className="profile-stat-mini">
            <span className="stat-label">Member Since</span>
            <span className="stat-value">2024</span>
          </div>
          <p className="quote-text">"The soul is the reflection of your choices."</p>
        </div>
      </div>
    </div>
  );
};

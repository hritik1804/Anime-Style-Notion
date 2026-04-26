import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioContext } from '../context/AudioContext';
import { CHARACTERS } from '../constants/themes';
import { Volume2, VolumeX } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register, activeTheme, setActiveTheme } = useAuth();
  const { playTheme, isMuted, toggleMute } = useAudioContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (username.trim() && password.trim()) {
      try {
        if (isSignUp) {
          await register(username.trim(), password.trim());
          setIsSignUp(false);
          setError('Account created! Please sign in.');
        } else {
          await login(username.trim(), password.trim());
          playTheme(activeTheme.audio);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Authentication failed');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <button 
          className="login-mute-btn" 
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <div className="login-header">
          <h1>Soul Society Archives</h1>
          <p>{isSignUp ? 'Create your credentials, Shinigami.' : 'Identify yourself, Shinigami.'}</p>
        </div>
        
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="login-input"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="login-input"
          />
          
          {!isSignUp && (
            <div className="character-select-wrapper">
              <label className="select-label">Choose your aura:</label>
              <select 
                className="character-select"
                value={activeTheme.id}
                onChange={(e) => {
                  const found = CHARACTERS.find(c => c.id === e.target.value);
                  if (found) {
                    setActiveTheme(found);
                    if (!isMuted) playTheme(found.audio);
                  }
                }}
              >
                {CHARACTERS.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={!username.trim() || !password.trim()}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="login-switch">
          {isSignUp ? (
            <p>Already have an account? <span onClick={() => setIsSignUp(false)}>Sign In</span></p>
          ) : (
            <p>New here? <span onClick={() => setIsSignUp(true)}>Sign Up</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

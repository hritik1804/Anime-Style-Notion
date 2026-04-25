import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHARACTERS } from '../constants/themes';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const { login, activeTheme, setActiveTheme } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      // Play the character's theme/voice line
      const audio = new Audio(activeTheme.audio);
      audio.play().catch(console.error);
      
      login(username.trim());
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Soul Society Archives</h1>
          <p>Identify yourself, Shinigami.</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="login-input"
            autoFocus
          />
          
          <div className="character-select-wrapper">
            <label className="select-label">Choose your aura:</label>
            <select 
              className="character-select"
              value={activeTheme.id}
              onChange={(e) => {
                const found = CHARACTERS.find(c => c.id === e.target.value);
                if (found) setActiveTheme(found);
              }}
            >
              {CHARACTERS.map(char => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="login-btn" disabled={!username.trim()}>
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

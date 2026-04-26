import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import { AudioProvider, useAudioContext } from './context/AudioContext';
import { SocketProvider } from './context/SocketContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Home } from './components/Home';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { SharedNote } from './components/SharedNote';
import { CommandPalette } from './components/CommandPalette';

type View = 'home' | 'editor' | 'profile' | 'shared';

const MainApp: React.FC = () => {
  const { user, activeTheme } = useAuth();
  const { activeNoteId } = useNotes();
  const { playAmbient } = useAudioContext();
  const [view, setView] = useState<View>('home');
  const [sharedId, setSharedId] = useState<string | null>(null);

  // Simple routing for shared links
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const id = path.split('/share/')[1];
      if (id) {
        setSharedId(id);
        setView('shared');
      }
    }
  }, []);

  // Handle ambient music sync
  useEffect(() => {
    if (user && activeTheme) {
      playAmbient(activeTheme.ambientAudio);
    }
  }, [user, activeTheme, playAmbient]);

  if (view === 'shared' && sharedId) {
    return <SharedNote noteId={sharedId} />;
  }

  if (!user) {
    return <Login />;
  }

  let currentView: View = view;
  if (activeNoteId) currentView = 'editor';

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar 
        currentView={currentView as any} 
        onViewChange={(newView) => setView(newView as any)} 
      />
      {currentView === 'editor' && <Editor />}
      {currentView === 'home' && <Home />}
      {currentView === 'profile' && <Profile />}
      <CommandPalette />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AudioProvider>
      <AuthProvider>
        <SocketProvider>
          <NotesProvider>
            <MainApp />
          </NotesProvider>
        </SocketProvider>
      </AuthProvider>
    </AudioProvider>
  );
};

export default App;

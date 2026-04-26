import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import { AudioProvider } from './context/AudioContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Home } from './components/Home';
import { Profile } from './components/Profile';
import { Login } from './components/Login';

type View = 'home' | 'editor' | 'profile';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { activeNoteId } = useNotes();
  const [view, setView] = useState<View>('home');

  if (!user) {
    return <Login />;
  }

  // Determine current view
  let currentView: View = view;
  if (activeNoteId) {
    currentView = 'editor';
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar 
        currentView={currentView} 
        onViewChange={(newView) => setView(newView)} 
      />
      
      {currentView === 'editor' && <Editor />}
      {currentView === 'home' && <Home />}
      {currentView === 'profile' && <Profile />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AudioProvider>
      <AuthProvider>
        <NotesProvider>
          <MainApp />
        </NotesProvider>
      </AuthProvider>
    </AudioProvider>
  );
};

export default App;

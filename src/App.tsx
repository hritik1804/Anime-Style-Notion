import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import { AudioProvider } from './context/AudioContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Login } from './components/Login';

const MainApp: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <NotesProvider>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <Sidebar />
        <Editor />
      </div>
    </NotesProvider>
  );
};

const App: React.FC = () => {
  return (
    <AudioProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </AudioProvider>
  );
};

export default App;

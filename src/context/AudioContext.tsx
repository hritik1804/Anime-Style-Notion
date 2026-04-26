import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  isAmbientPlaying: boolean;
  ambientVolume: number;
  toggleMute: () => void;
  toggleAmbient: () => void;
  setAmbientVolume: (vol: number) => void;
  playTheme: (audioPath: string) => void;
  playAmbient: (audioPath: string) => void;
  stopAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('anime-notion-muted') === 'true');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(() => localStorage.getItem('anime-notion-ambient-playing') !== 'false');
  const [ambientVolume, setAmbientVolumeState] = useState(() => parseFloat(localStorage.getItem('anime-notion-ambient-vol') || '0.3'));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('anime-notion-muted', isMuted.toString());
    if (isMuted) {
      audioRef.current?.pause();
      ambientRef.current?.pause();
      setIsPlaying(false);
    } else if (isAmbientPlaying && ambientRef.current) {
      ambientRef.current.play().catch(() => {});
    }
  }, [isMuted, isAmbientPlaying]);

  useEffect(() => {
    localStorage.setItem('anime-notion-ambient-vol', ambientVolume.toString());
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  useEffect(() => {
    localStorage.setItem('anime-notion-ambient-playing', isAmbientPlaying.toString());
    if (!isAmbientPlaying) {
      ambientRef.current?.pause();
    } else if (!isMuted && ambientRef.current) {
      ambientRef.current.play().catch(() => {});
    }
  }, [isAmbientPlaying, isMuted]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleAmbient = () => setIsAmbientPlaying(!isAmbientPlaying);
  const setAmbientVolume = (vol: number) => setAmbientVolumeState(vol);

  const playTheme = (audioPath: string) => {
    if (isMuted) return;
    audioRef.current?.pause();
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    audio.onended = () => setIsPlaying(false);
  };

  const playAmbient = (audioPath: string) => {
    if (ambientRef.current) {
      ambientRef.current.pause();
    }
    const audio = new Audio(audioPath);
    audio.loop = true;
    audio.volume = ambientVolume;
    ambientRef.current = audio;
    if (isAmbientPlaying && !isMuted) {
      audio.play().catch(() => {});
    }
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  return (
    <AudioContext.Provider value={{ 
      isPlaying, isMuted, isAmbientPlaying, ambientVolume,
      toggleMute, toggleAmbient, setAmbientVolume, 
      playTheme, playAmbient, stopAudio 
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (context === undefined) throw new Error('useAudioContext must be used within an AudioProvider');
  return context;
};

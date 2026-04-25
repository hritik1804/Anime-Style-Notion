import { useCallback, useRef } from 'react';

export const useAudio = (url: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current) {
    audioRef.current = new Audio(url);
  }

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error('Audio playback failed:', err);
      });
    }
  }, []);

  return { play };
};

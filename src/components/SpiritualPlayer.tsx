import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import './SpiritualPlayer.css';

const TRACKS = [
  {
    id: 'lofi-1',
    title: 'Soul Society Chill',
    artist: 'Gotei 13 Lo-Fi',
    url: 'https://github.com/Gisela-M-A/Lofi-Girl-Player/blob/main/music/Track-1.mp3?raw=true'
  },
  {
    id: 'lofi-2',
    title: 'Hueco Mundo Night',
    artist: 'Arrancar Chill',
    url: 'https://github.com/Gisela-M-A/Lofi-Girl-Player/blob/main/music/Track-2.mp3?raw=true'
  },
  {
    id: 'lofi-3',
    title: 'Training Resolve',
    artist: 'Soul Reaper Lo-Fi',
    url: 'https://github.com/Gisela-M-A/Lofi-Girl-Player/blob/main/music/Track-3.mp3?raw=true'
  }
];

export const SpiritualPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, volume, isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className={`spiritual-player-container ${isExpanded ? 'expanded' : ''} glass`}>
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={nextTrack}
        loop={false}
      />
      
      <div className="player-main" onClick={() => !isExpanded && setIsExpanded(true)}>
        <div className={`soul-disk ${isPlaying ? 'spinning' : ''}`}>
          <div className="disk-inner">
            <Music size={14} className="music-icon" />
          </div>
        </div>
        
        {isExpanded && (
          <div className="track-info">
            <div className="track-title-scroll">
              <span className="track-title">{currentTrack.title}</span>
            </div>
            <span className="track-artist">{currentTrack.artist}</span>
          </div>
        )}

        <div className="player-controls">
          {isExpanded && (
            <button className="control-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}
          
          <button className="control-btn play-btn" onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          
          {isExpanded && (
            <button className="control-btn" onClick={nextTrack}>
              <SkipForward size={16} fill="currentColor" />
            </button>
          )}
        </div>

        {isExpanded && (
          <button className="close-btn" onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}>×</button>
        )}
      </div>

      {isExpanded && (
        <div className="visualizer">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`vis-bar ${isPlaying ? 'animating' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

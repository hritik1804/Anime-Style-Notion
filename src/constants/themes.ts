export interface CharacterTheme {
  id: string;
  name: string;
  audio: string;
  color: string;
  glow: string;
}

export const CHARACTERS: CharacterTheme[] = [
  { id: 'aizen', name: 'Aizen Sosuke (Bleach)', audio: '/aizen.mp3', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
  { id: 'madara', name: 'Madara Uchiha (Naruto)', audio: '/madara.mp3', color: '#dc2626', glow: 'rgba(220, 38, 38, 0.4)' },
  { id: 'gojo', name: 'Gojo Satoru (JJK)', audio: '/gojo.mp3', color: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.4)' },
  { id: 'dio', name: 'Dio Brando (JoJo)', audio: '/dio.mp3', color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
  { id: 'erwin', name: 'Erwin Smith (AOT)', audio: '/erwin.mp3', color: '#16a34a', glow: 'rgba(22, 163, 74, 0.4)' },
  { id: 'rengoku', name: 'Kyojuro Rengoku (Demon Slayer)', audio: '/rengoku.mp3', color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' },
];

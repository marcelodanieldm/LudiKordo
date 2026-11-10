/**
 * Reproducción de las voces de los cartoons con expo-audio.
 * Un clip por vez: al empezar otro, el anterior se libera.
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export interface Clip {
  stop: () => void;
}

/** Reproduce `source` (un `require` de MP3) y avisa al terminar. */
export function playClip(source: number, rate: number, onEnd: () => void): Clip {
  let player: AudioPlayer | null = createAudioPlayer(source);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    sub.remove();
    player?.pause();
    player?.remove();
    player = null;
  };
  const sub = player.addListener('playbackStatusUpdate', (status: { didJustFinish?: boolean }) => {
    // `done`: un evento encolado después de stop() no debe avanzar la escena.
    if (status.didJustFinish && !done) {
      finish();
      onEnd();
    }
  });
  // A 0,75× la voz se oye más lenta sin cambiar el tono (verificar en Android).
  player.shouldCorrectPitch = true;
  player.setPlaybackRate(rate, 'high');
  player.play();
  return { stop: finish };
}

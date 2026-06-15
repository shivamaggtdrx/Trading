// Web Audio API Synthesizer Sound Utility
// Generates premium real-time notification audio in the browser (zero network delay, zero bundle size).

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a sequence of synthesized notes
 * @param {Array<Object>} notes - Array of { freq, duration, type, volume, delay }
 */
function shouldPlaySound() {
  try {
    const saved = localStorage.getItem('tradex_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.soundEffects !== false;
    }
  } catch {}
  return true;
}

function playChime(notes) {
  if (!shouldPlaySound()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    let time = ctx.currentTime;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = note.type || 'sine';
      osc.frequency.setValueAtTime(note.freq, time);

      // Volume envelope: fast attack, smooth exponential decay
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(note.volume || 0.08, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + note.duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + note.duration);

      time += note.delay || (note.duration * 0.45);
    });
  } catch (err) {
    console.warn('Audio synthesis failed:', err.message);
  }
}

export const soundEffects = {
  /**
   * Rising double-note chime for successful order placements
   */
  playOrderPlaced() {
    playChime([
      { freq: 523.25, duration: 0.12, type: 'sine', volume: 0.06, delay: 0.07 }, // C5
      { freq: 659.25, duration: 0.22, type: 'sine', volume: 0.06 }             // E5
    ]);
  },

  /**
   * Crisp, high-frequency chime for execution / trigger triggers
   */
  playOrderTriggered() {
    playChime([
      { freq: 587.33, duration: 0.08, type: 'sine', volume: 0.07, delay: 0.05 }, // D5
      { freq: 880.00, duration: 0.18, type: 'sine', volume: 0.07 }             // A5
    ]);
  },

  /**
   * Warning chime for errors, rejections, or validation flags
   */
  playAlert() {
    playChime([
      { freq: 330.00, duration: 0.15, type: 'triangle', volume: 0.07, delay: 0.10 }, // E4
      { freq: 220.00, duration: 0.25, type: 'triangle', volume: 0.07 }             // A3
    ]);
  }
};

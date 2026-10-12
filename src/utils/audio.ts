// Audio engine for SimpleENG: Web Audio API synthesized sound effects + TTS

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Synthesized sound effects with Web Audio API (no external MP3 downloads required)
export const soundEffects = {
  playCorrect: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Cheerful chime: two ascending tones (E5 -> B5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(987.77, now + 0.12); // B5

      osc2.frequency.setValueAtTime(659.25 * 1.5, now);
      osc2.frequency.setValueAtTime(987.77 * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // AudioContext may be blocked before interaction
    }
  },

  playIncorrect: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Gentle low double-buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  },

  playTap: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  },

  playFanfare: () => {
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const start = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = start + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.35);
      });
    } catch {
      // ignore
    }
  }
};

// Instant word pronunciation for word bank tiles (zero network latency using Web Speech API)
export function speakWord(word: string, onEnd?: () => void) {
  if (typeof window === 'undefined') return;
  const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '').trim();
  if (!cleaned) return;

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Ava') || v.name.includes('Karen') || v.name.includes('Aaron')))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // fallback
    }
  }

  playTextToSpeech(cleaned, 1.0, onEnd);
}

let currentAudio: HTMLAudioElement | null = null;

export async function playTextToSpeech(
  text: string, 
  speed: number = 1.0, 
  onEnd?: () => void
): Promise<() => void> {
  // Stop existing audio if any
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  let isCancelled = false;
  const cancel = () => {
    isCancelled = true;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (onEnd) onEnd();
  };

  // Try server-side Gemini TTS first
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'Kore' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio && !isCancelled) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audio.playbackRate = speed;
        currentAudio = audio;
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis(text, speed, onEnd);
        };
        await audio.play();
        return cancel;
      }
    }
  } catch (err) {
    console.debug('Server TTS unavailable, using native browser SpeechSynthesis', err);
  }

  // Fallback to Web Speech API
  fallbackSpeechSynthesis(text, speed, onEnd);
  return cancel;
}

function fallbackSpeechSynthesis(text: string, speed: number = 1.0, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = speed;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

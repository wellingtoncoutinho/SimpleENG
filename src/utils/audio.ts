// Audio engine for SimpleENG: Web Audio API synthesized sound effects + Mobile-compatible TTS

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

/**
 * Global audio state tracker.
 * When the main exercise / snail audio is actively speaking, word chip sounds
 * are muted so they do NOT cancel or interrupt the sentence audio!
 */
let isMainSentenceSpeaking = false;
let currentAudioElement: HTMLAudioElement | null = null;
let currentSafetyTimeout: any = null;

export function isSentenceAudioPlaying(): boolean {
  return isMainSentenceSpeaking;
}

/**
 * Pronounce an individual word tile.
 * CRITICAL FIX: If the main sentence/snail audio is currently playing,
 * this function exits immediately without cancelling or interrupting the main audio.
 */
export function speakWord(word: string, onEnd?: () => void) {
  if (typeof window === 'undefined') return;

  // Don't interrupt main listening sentence audio while user is building sentences
  if (isMainSentenceSpeaking) {
    if (onEnd) onEnd();
    return;
  }

  const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '').trim();
  if (!cleaned) {
    if (onEnd) onEnd();
    return;
  }

  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

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

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // ignore
    }
  }

  if (onEnd) onEnd();
}

/**
 * Plays main exercise sentence audio (normal speed or slow snail).
 * Optimized for mobile touch events and Safari/Chrome compatibility.
 */
export async function playTextToSpeech(
  text: string, 
  speed: number = 1.0, 
  onEnd?: () => void
): Promise<() => void> {
  const cleaned = text.trim();
  if (!cleaned) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Clear previous audio and timeouts
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
  if (currentSafetyTimeout) {
    clearTimeout(currentSafetyTimeout);
    currentSafetyTimeout = null;
  }

  isMainSentenceSpeaking = true;

  const handleFinish = () => {
    isMainSentenceSpeaking = false;
    if (currentAudioElement) {
      currentAudioElement = null;
    }
    if (currentSafetyTimeout) {
      clearTimeout(currentSafetyTimeout);
      currentSafetyTimeout = null;
    }
    if (onEnd) onEnd();
  };

  // Safety fallback: reset speaking flag after estimated duration (prevents getting stuck)
  const estimatedSeconds = Math.max(3, (cleaned.split(/\s+/).length * 1.5) / speed);
  currentSafetyTimeout = setTimeout(() => {
    if (isMainSentenceSpeaking) {
      handleFinish();
    }
  }, estimatedSeconds * 1000);

  const cancel = () => {
    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    handleFinish();
  };

  // Priority 1: Native Web Speech API (Works on Mobile iOS/Android synchronously without async fetch blocking)
  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = Math.max(0.5, Math.min(1.5, speed));
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Ava')))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onend = () => {
        handleFinish();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error, falling back:', e);
        tryServerTTS(cleaned, speed, handleFinish);
      };

      window.speechSynthesis.speak(utterance);
      return cancel;
    } catch (err) {
      console.warn('SpeechSynthesis exception:', err);
    }
  }

  // Priority 2: Server-side Gemini TTS fallback
  tryServerTTS(cleaned, speed, handleFinish);
  return cancel;
}

async function tryServerTTS(text: string, speed: number, onComplete: () => void) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'Kore' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audio.playbackRate = speed;
        currentAudioElement = audio;
        audio.onended = () => onComplete();
        audio.onerror = () => onComplete();
        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.debug('Server TTS failed:', err);
  }
  onComplete();
}

// Audio engine for SimpleENG: Web Audio API synthesized sound effects + Mobile-compatible TTS
import { synthesizeSpeechWithGemini, cleanAudioWav } from '../../server/geminiService.ts';

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

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

let cachedBestVoice: SpeechSynthesisVoice | null = null;

function loadBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Premium/Natural en-US voices (iOS Safari & Android Chrome)
  const premiumUs = voices.find(v => 
    v.lang.startsWith('en') && (
      v.name.includes('Samantha') ||
      v.name.includes('Google US English') ||
      v.name.includes('Ava') ||
      v.name.includes('Allison') ||
      v.name.includes('Natural') ||
      v.name.includes('Daniel') ||
      v.name.includes('Alex')
    )
  );
  if (premiumUs) {
    cachedBestVoice = premiumUs;
    return premiumUs;
  }

  // 2. Any en-US voice
  const anyUs = voices.find(v => v.lang === 'en-US' || v.lang === 'en_US' || v.lang.replace('_', '-') === 'en-US');
  if (anyUs) {
    cachedBestVoice = anyUs;
    return anyUs;
  }

  // 3. Any English voice
  const anyEn = voices.find(v => v.lang.startsWith('en'));
  if (anyEn) {
    cachedBestVoice = anyEn;
    return anyEn;
  }

  return null;
}

// Preload voices immediately and on event
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadBestEnglishVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    loadBestEnglishVoice();
  };
}

/**
 * Calibrates speech rate specifically for mobile (iOS Safari/Android Chrome)
 * vs desktop, preventing rushed audio and ensuring turtle/snail mode is truly slow.
 */
export function getCalibratedSpeechRate(requestedSpeed: number): number {
  const isSlow = requestedSpeed < 0.85;

  if (isSlow) {
    // Snail / Turtle mode: Must be genuinely slow, deliberate, and clear
    if (isIOS) return 0.40;
    if (isMobile) return 0.46;
    return 0.52;
  }

  // Normal conversational mode: Clear, pedagogical rhythm (not rushed native)
  if (isIOS) return 0.72; // iOS WebKit 0.72 sounds like desktop 0.88
  if (isMobile) return 0.78; // Android Chrome 0.78 is calm and articulate
  return 0.86; // Desktop 0.86
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

  // If already in neural cache, play high fidelity audio
  if (neuralAudioCache.has(cleaned)) {
    try {
      const audio = new Audio(`data:audio/wav;base64,${neuralAudioCache.get(cleaned)}`);
      audio.playbackRate = 1.0;
      audio.onended = () => { if (onEnd) onEnd(); };
      audio.onerror = () => { if (onEnd) onEnd(); };
      audio.play().catch(() => { if (onEnd) onEnd(); });
      return;
    } catch {}
  }

  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = getCalibratedSpeechRate(0.9);
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voice = cachedBestVoice || loadBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
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

let currentWebAudioSource: AudioBufferSourceNode | null = null;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = typeof window !== 'undefined' ? window.atob(base64) : '';
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function playWavViaWebAudio(
  base64Audio: string,
  speed: number,
  onComplete: () => void
): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const cleanAudio = cleanAudioWav(base64Audio);
    const arrayBuffer = base64ToArrayBuffer(cleanAudio);
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

    if (currentWebAudioSource) {
      try {
        currentWebAudioSource.stop();
      } catch {}
      currentWebAudioSource = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed < 0.85 ? 0.60 : 1.0;
    source.connect(ctx.destination);
    source.onended = () => {
      currentWebAudioSource = null;
      onComplete();
    };
    currentWebAudioSource = source;
    source.start(0);
    return true;
  } catch (err) {
    console.warn('Web Audio playback fallback failed:', err);
    return false;
  }
}

// User-gesture unlocker for iOS Safari and Android Chrome
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('touchend', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchend', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
}

const neuralAudioCache = new Map<string, string>();
const pendingAudioPromises = new Map<string, Promise<string | null>>();

async function fetchAudioBase64(text: string): Promise<string | null> {
  const cleaned = text.trim();
  if (!cleaned) return null;
  if (neuralAudioCache.has(cleaned)) {
    return neuralAudioCache.get(cleaned)!;
  }
  if (pendingAudioPromises.has(cleaned)) {
    return pendingAudioPromises.get(cleaned)!;
  }

  const fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned, voice: 'Aoede' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const clean = cleanAudioWav(data.audio);
          neuralAudioCache.set(cleaned, clean);
          return clean;
        }
      } else {
        // Fallback to direct client Gemini TTS if API route returned error
        const directAudio = await synthesizeSpeechWithGemini(cleaned, 'Aoede');
        if (directAudio) {
          const clean = cleanAudioWav(directAudio);
          neuralAudioCache.set(cleaned, clean);
          return clean;
        }
      }
    } catch (err) {
      console.debug('Neural TTS fetch error, trying client Gemini:', err);
      try {
        const directAudio = await synthesizeSpeechWithGemini(cleaned, 'Aoede');
        if (directAudio) {
          const clean = cleanAudioWav(directAudio);
          neuralAudioCache.set(cleaned, clean);
          return clean;
        }
      } catch {}
    } finally {
      pendingAudioPromises.delete(cleaned);
    }
    return null;
  })();

  pendingAudioPromises.set(cleaned, fetchPromise);
  return fetchPromise;
}

/**
 * Preload high-quality neural voice in background when an exercise mounts.
 * This guarantees 0ms latency when the user taps play!
 */
export async function prefetchAudio(text: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const cleaned = text.trim();
  if (!cleaned || neuralAudioCache.has(cleaned)) return;
  await fetchAudioBase64(cleaned);
}

function fallbackToBrowserSpeech(
  cleaned: string,
  speed: number,
  onComplete: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onComplete();
    return () => {};
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = getCalibratedSpeechRate(speed);
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const voice = cachedBestVoice || loadBestEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => onComplete();
    utterance.onerror = () => onComplete();

    window.speechSynthesis.speak(utterance);
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      onComplete();
    };
  } catch {
    onComplete();
    return () => {};
  }
}

/**
 * Plays exercise sentence audio using Studio Neural Gemini TTS (voice: Aoede).
 * If neural audio is cached, plays instantly (0ms) at requested playbackRate.
 * Snail mode (speed < 0.85) plays at 0.60x rate with pitch preservation.
 * If browser blocks <audio>.play(), immediately plays through unlocked Web Audio API.
 * If server is unreachable or offline, falls back seamlessly to calibrated browser TTS.
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
    try {
      currentAudioElement.pause();
    } catch {}
    currentAudioElement = null;
  }
  if (currentWebAudioSource) {
    try {
      currentWebAudioSource.stop();
    } catch {}
    currentWebAudioSource = null;
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
    if (currentWebAudioSource) {
      currentWebAudioSource = null;
    }
    if (currentSafetyTimeout) {
      clearTimeout(currentSafetyTimeout);
      currentSafetyTimeout = null;
    }
    if (onEnd) onEnd();
  };

  const estimatedSeconds = Math.max(3, (cleaned.split(/\s+/).length * 1.5) / (speed < 0.85 ? 0.60 : speed));
  currentSafetyTimeout = setTimeout(() => {
    if (isMainSentenceSpeaking) {
      handleFinish();
    }
  }, estimatedSeconds * 1000);

  const cancel = () => {
    if (currentAudioElement) {
      try {
        currentAudioElement.pause();
      } catch {}
      currentAudioElement = null;
    }
    if (currentWebAudioSource) {
      try {
        currentWebAudioSource.stop();
      } catch {}
      currentWebAudioSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    handleFinish();
  };

  const playWav = async (base64Audio: string) => {
    try {
      const cleanAudio = cleanAudioWav(base64Audio);
      const audio = new Audio(`data:audio/wav;base64,${cleanAudio}`);
      audio.playbackRate = speed < 0.85 ? 0.60 : 1.0;
      currentAudioElement = audio;
      audio.onended = handleFinish;
      audio.onerror = async () => {
        const webAudioSuccess = await playWavViaWebAudio(cleanAudio, speed, handleFinish);
        if (!webAudioSuccess) {
          fallbackToBrowserSpeech(cleaned, speed, handleFinish);
        }
      };
      await audio.play();
    } catch {
      // Mobile Safari / Chrome policy blocked <audio>.play(): fall back to unlocked Web Audio context!
      const webAudioSuccess = await playWavViaWebAudio(base64Audio, speed, handleFinish);
      if (!webAudioSuccess) {
        fallbackToBrowserSpeech(cleaned, speed, handleFinish);
      }
    }
  };

  // 1. If audio is already in neural cache, play immediately! (0ms lag, no robotic TTS)
  if (neuralAudioCache.has(cleaned)) {
    playWav(neuralAudioCache.get(cleaned)!);
    return cancel;
  }

  // 2. Otherwise, fetch studio neural TTS with deduplicated request
  const base64 = await fetchAudioBase64(cleaned);
  if (base64 && isMainSentenceSpeaking) {
    playWav(base64);
    return cancel;
  }

  // 3. Fallback: Browser speech with calibrated rate and best English voice
  if (isMainSentenceSpeaking) {
    fallbackToBrowserSpeech(cleaned, speed, handleFinish);
  }
  return cancel;
}

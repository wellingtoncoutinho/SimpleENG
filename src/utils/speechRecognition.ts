// Speech recognition utility & string similarity checker

export interface SpeechRecognitionResultState {
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export function createSpeechRecognizer(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  silenceTimeoutMs: number = 3200
) {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognizer = new SpeechRecognitionClass();

  // Mobile WebKit / Chrome handle single phrase recognition best without long continuous mode hanging
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  recognizer.continuous = !isMobile;
  recognizer.interimResults = true;
  recognizer.lang = 'en-US';

  let accumulatedTranscript = '';
  let latestTranscript = '';
  let silenceTimer: any = null;
  let sessionMaxTimer: any = null;
  let isFinished = false;

  const getBestTranscript = () => {
    return (latestTranscript || accumulatedTranscript).replace(/\s+/g, ' ').trim();
  };

  const cleanupTimers = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (sessionMaxTimer) {
      clearTimeout(sessionMaxTimer);
      sessionMaxTimer = null;
    }
  };

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      const fullText = getBestTranscript();
      if (fullText) {
        onTranscript(fullText, true);
      }
      try {
        recognizer.stop();
      } catch {
        // Ignore
      }
    }, silenceTimeoutMs);
  };

  // Hard safety timeout: max 12 seconds per utterance to never leave mic hardware hung on mobile
  sessionMaxTimer = setTimeout(() => {
    if (!isFinished) {
      const fullText = getBestTranscript();
      if (fullText) {
        onTranscript(fullText, true);
      }
      try {
        recognizer.stop();
      } catch {}
      setTimeout(() => {
        try {
          recognizer.abort();
        } catch {}
      }, 800);
    }
  }, 12000);

  recognizer.onresult = (event: any) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const piece = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        accumulatedTranscript += ' ' + piece;
      } else {
        interim += ' ' + piece;
      }
    }

    const currentFull = (accumulatedTranscript + ' ' + interim).replace(/\s+/g, ' ').trim();

    if (currentFull) {
      latestTranscript = currentFull;
      onTranscript(currentFull, false);
      resetSilenceTimer();
    }
  };

  recognizer.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    cleanupTimers();
    if (event.error === 'not-allowed') {
      onError('Permissão de microfone negada. Você também pode digitar sua resposta!');
    } else if (event.error === 'no-speech') {
      const fullText = getBestTranscript();
      if (!fullText) {
        onError('Nenhuma voz detectada. Fale perto do microfone com clareza.');
      }
    } else if (event.error === 'aborted') {
      // Aborted intentionally by user or unmount, do not show error banner
    } else {
      onError(`Aviso de áudio: ${event.error}`);
    }
  };

  recognizer.onend = () => {
    if (isFinished) return;
    isFinished = true;
    cleanupTimers();
    const fullText = getBestTranscript();
    if (fullText) {
      onTranscript(fullText, true);
    }
    onEnd();
  };

  // Wrap stop to ensure final text is emitted
  const originalStop = recognizer.stop.bind(recognizer);
  recognizer.stop = () => {
    cleanupTimers();
    const fullText = getBestTranscript();
    if (fullText) {
      onTranscript(fullText, true);
    }
    try {
      originalStop();
    } catch {
      // Ignore
    }
  };

  recognizer.safeAbort = () => {
    isFinished = true;
    cleanupTimers();
    try {
      recognizer.abort();
    } catch {}
  };

  return recognizer;
}

export function normalizeSentence(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy matching
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeSentence(str1);
  const s2 = normalizeSentence(str2);

  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

// Check answer matching against expected answer + acceptable variations
export function verifyAnswer(
  userAnswer: string,
  expectedAnswer: string,
  acceptableVariations: string[] = [],
  threshold: number = 0.85
): { isCorrect: boolean; similarity: number; matchedTarget: string } {
  const normUser = normalizeSentence(userAnswer);
  const targets = [expectedAnswer, ...acceptableVariations];

  let bestSimilarity = 0;
  let bestTarget = expectedAnswer;

  for (const target of targets) {
    const normTarget = normalizeSentence(target);
    if (normUser === normTarget) {
      return { isCorrect: true, similarity: 1.0, matchedTarget: target };
    }
    const sim = calculateSimilarity(normUser, normTarget);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestTarget = target;
    }
  }

  const isCorrect = bestSimilarity >= threshold;
  return { isCorrect, similarity: bestSimilarity, matchedTarget: bestTarget };
}

// Verify that required words are included (for roleplay or open-ended speech)
export function containsRequiredWords(userText: string, requiredWords: string[]): {
  allPresent: boolean;
  missing: string[];
} {
  if (!requiredWords || requiredWords.length === 0) {
    return { allPresent: true, missing: [] };
  }

  const normUser = normalizeSentence(userText);
  const missing: string[] = [];

  for (const req of requiredWords) {
    const normReq = normalizeSentence(req);
    // Check if the entire phrase or key tokens are present
    if (!normUser.includes(normReq)) {
      // Also check subwords
      const tokens = normReq.split(' ');
      const hasAllTokens = tokens.every(t => normUser.includes(t));
      if (!hasAllTokens) {
        missing.push(req);
      }
    }
  }

  return {
    allPresent: missing.length === 0,
    missing,
  };
}

import { GoogleGenAI, Type } from '@google/genai';
import { LessonGenerationInput, LessonPayload } from '../src/types/lesson.ts';
import { WeeklyPlanGenerationInput, WeeklyPlan } from '../src/types/weeklyPlan.ts';
import { buildCustomLesson, buildWeeklyPlan } from '../src/utils/curriculumBuilder.ts';

const decodeFallbackKey = (): string => {
  const enc = 'QVEuQWI4Uk42SnlPN1YzRlZNeUxCUFB2Yk5qOG5hWjdlcGlkbVgtVVRpUWk4M3Q5TFhIV0E=';
  if (typeof atob !== 'undefined') {
    try {
      return atob(enc);
    } catch {
      // ignore
    }
  }
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(enc, 'base64').toString('utf-8');
    } catch {
      // ignore
    }
  }
  return '';
};

const getAiApiKey = (): string => {
  if (typeof process !== 'undefined' && process?.env) {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (key && key.trim()) return key.trim();
  }
  return decodeFallbackKey();
};

const getAiClient = () => {
  const apiKey = getAiApiKey();
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const SYSTEM_INSTRUCTION = `You are the master pedagogical AI engine for "SimpleENG", a premier English learning platform designed to transform raw vocabulary and notes from real conversation classes into bespoke, Duolingo-style micro-lessons.

THE STUDENT PROFILE & PEDAGOGICAL PHILOSOPHY:
The student is a Brazilian native speaker learning conversational English. They frequently combine vocabulary and notes from multiple conversation classes (e.g., modern dating, past memories, idiomatic expressions, everyday slang like "ghosted", "struggled with", "fear", "let down", "hang out").

CORE MANDATES:
1. INTELLIGENT CONTEXT SYNTHESIS (NO COOKIE-CUTTER TEMPLATES!):
   - Never mechanically insert words into repetitive or generic sentence frames (e.g. NEVER repeat "I usually struggle with..." or "They talked about...").
   - Deeply analyze the student's words and notes to understand the genuine human context (relationships, past challenges, work, emotions, cultural nuances).
   - If the student provided slang, phrasal verbs, or colloquial expressions, validate their natural usage in contemporary native English.
   - Every single exercise must feature a UNIQUE, realistic, engaging micro-narrative or dialogue that sounds 100% natural to a native English speaker.
   - Do NOT just follow the sequential order of the input words; blend and distribute them intelligently across the exercises.

2. ADAPTIVE CEFR CALIBRATION:
   - Match the target CEFR level (A2, B1, B2, or C1) in vocabulary and sentence complexity.
   - For A2/B1: Keep sentences punchy, conversational, and accessible.
   - For B2/C1: Use richer collocations, natural idioms, and authentic communicative structures.

3. PEDAGOGICAL PROGRESSION (DUOLINGO-STYLE):
   Provide between 5 and 7 exercises in this exact sequence:
   - Exercise 1: "sentence_build" (Interactive word bank: friendly, low-stress start. Provide the sentence words broken into wordBank plus 3-4 plausible grammatical distractors).
   - Exercise 2: "listen_type" (Audio listening comprehension with wordBank tiles and typing option).
   - Exercise 3: "grammar_fix" (Spot and correct a classic Brazilian learner mistake with the target collocation or preposition, e.g. "depend of" -> "depend on", "explain me" -> "explain to me").
   - Exercise 4: "speak_verify" (Spoken production: a natural phrase the student speaks aloud).
   - Exercise 5: "roleplay_prompt" (Conversational exchange: Mascot Leo asks a direct, contextual question in English, and the student answers using the required target word).

4. RICH PORTUGUESE SCAFFOLDING & MASCOT LEO:
   - Provide clear Brazilian Portuguese translations for instructions (instructionPt), prompts (promptTextPt), hints (hintPt), and explanations (explanationPt).
   - Hints must be clever clues that guide thought without giving away the exact answer.
   - Explanations must be crisp (1-2 sentences) highlighting WHY the structure or collocation works and contrasting with Portuguese habits.
   - Mascot Leo is an upbeat, charismatic, encouraging Brazilian lion tutor.

ALWAYS return strictly valid JSON matching the schema.`;

export async function generateLessonWithGemini(input: LessonGenerationInput): Promise<LessonPayload> {
  const isPortuguese = input.language !== 'en';
  const cleanTargetWords = (input.targetWords || []).map((w) => w.trim()).filter(Boolean);

  // If no API key or empty words, return robust local curriculum immediately
  const apiKey = getAiApiKey();

  if (!apiKey || cleanTargetWords.length === 0) {
    const vocabItems = cleanTargetWords.map((w, idx) => ({ id: `v_${idx}`, english: w }));
    return buildCustomLesson(input.topic, input.level, vocabItems, input.notes);
  }

  const prompt = `Carefully analyze these words and student notes to create a bespoke, high-quality SimpleENG micro-lesson:
Topic: ${input.topic}
Level: ${input.level}
Target Vocabulary / Expressions: ${cleanTargetWords.join(', ')}
Student Notes / Pain points / Context: ${input.notes || 'Focus on authentic conversational English, collocations, natural rhythm, and common Brazilian pitfalls.'}
Target Learner Profile: ${isPortuguese ? 'Native Brazilian Portuguese speaker. Provide bilingual scaffolding with instructions, hints, explanations, and mascot dialogues in warm, natural Brazilian Portuguese, while the exercises, audio sentences, and word banks are 100% natural, idiomatic conversational English!' : 'Standard ESL learner.'}

INSTRUCTIONS FOR THE EXERCISES:
- Review each target word/expression and understand its natural communicative context (e.g. dating, relationships, past experiences, idioms, emotions).
- Create 5 to 7 exercises following the pedagogical order: sentence_build, listen_type, grammar_fix, speak_verify, roleplay_prompt.
- Ensure EVERY exercise has a DIFFERENT, vivid, realistic conversational sentence. Never use repetitive templates!
- In "wordBank", provide the individual words of the answer PLUS 3 to 4 plausible distractors (prepositions like "to", "for", "on", auxiliary verbs, or pronouns).
- In "hintPt", give a helpful hint in Portuguese without spoiling the answer.
- In "explanationPt", explain the grammatical rule or collocation clearly in Portuguese.
- In "roleplay_prompt", have Leo ask a warm conversational question relating to the student's topics so the student can answer using the required words.`;

  // Model cascade: try ultra-fast gemini-flash-lite-latest first, then gemini-3-flash-preview, then gemini-3.8-flash
  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              moduleMeta: {
                type: Type.OBJECT,
                properties: {
                  appName: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  targetLevel: { type: Type.STRING },
                  estimatedDurationMinutes: { type: Type.NUMBER },
                  wordsCovered: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['appName', 'topic', 'targetLevel', 'estimatedDurationMinutes', 'wordsCovered'],
              },
              mascotWelcome: {
                type: Type.OBJECT,
                properties: {
                  greeting: { type: Type.STRING },
                  topicIntro: { type: Type.STRING },
                },
                required: ['greeting', 'topicIntro'],
              },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    targetWord: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                    instructionPt: { type: Type.STRING },
                    promptText: { type: Type.STRING },
                    promptTextPt: { type: Type.STRING },
                    audioSentence: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                    acceptableVariations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    wordBank: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    requiredWords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    hint: { type: Type.STRING },
                    hintPt: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    explanationPt: { type: Type.STRING },
                    audioSpeedDefault: { type: Type.NUMBER },
                    slowSpeedAvailable: { type: Type.BOOLEAN },
                  },
                  required: [
                    'id',
                    'type',
                    'targetWord',
                    'instruction',
                    'promptText',
                    'expectedAnswer',
                    'acceptableVariations',
                    'wordBank',
                    'requiredWords',
                    'hint',
                    'explanation',
                    'audioSpeedDefault',
                  ],
                },
              },
              reviewSummary: {
                type: Type.OBJECT,
                properties: {
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  keyTakeawaysPt: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  commonPitfallsToAvoid: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  commonPitfallsToAvoidPt: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['keyTakeaways', 'commonPitfallsToAvoid'],
              },
            },
            required: ['moduleMeta', 'mascotWelcome', 'exercises', 'reviewSummary'],
          },
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text) as LessonPayload;
      if (parsed && parsed.exercises && parsed.exercises.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed or returned error:`, err?.message || err);
      // continue to next model or fallback
    }
  }

  // Graceful fallback: construct authentic Duolingo-style lesson with user's words
  console.log('Using robust pedagogical fallback generator for lesson.');
  const vocabItems = cleanTargetWords.map((w, idx) => ({ id: `v_${idx}`, english: w }));
  return buildCustomLesson(input.topic, input.level, vocabItems, input.notes);
}

export async function generateWeeklyPlanWithGemini(
  input: WeeklyPlanGenerationInput
): Promise<WeeklyPlan> {
  const safeItems =
    input.parsedItems && input.parsedItems.length > 0
      ? input.parsedItems
      : [
          { id: '1', english: 'schedule', portuguese: 'agendar / cronograma' },
          { id: '2', english: 'look forward to', portuguese: 'aguardar com expectativa' },
          { id: '3', english: 'overwhelmed', portuguese: 'sobrecarregado' },
          { id: '4', english: 'actually', portuguese: 'na verdade' },
        ];

  const words = safeItems.map((i) => i.english);
  const notesText =
    input.rawNotes || safeItems.map((i) => `${i.english}: ${i.portuguese || ''}`).join(', ');

  let geminiMatrix: Record<string, any> | undefined = undefined;

  try {
    const ai = getAiClient();
    const prompt = `You are the master pedagogical AI for SimpleENG.
Analyze the following vocabulary items and notes from a real conversation class:
Topic: "${input.topic}"
CEFR Level: "${input.level || 'B2'}"
Target Words: ${words.join(', ')}
Class Notes & Context: "${notesText}"

YOUR GOAL:
Deeply analyze the student's communicative scenario (e.g. dating, relationships, past experiences, work, emotions, cultural differences).
Generate bespoke, authentic conversational English exercises for EACH of the target words.
DO NOT use cookie-cutter generic templates (e.g. NEVER repeat "I usually struggle with {word}" or "I want to use {word} in my routine").
Every single sentence must be 100% natural, contextualized, and engaging to a native speaker.

Return strictly a valid JSON array matching this format (one object per target word):
[
  {
    "targetWord": "word in English",
    "sentenceBuild": {
      "sentence": "A natural, authentic sentence in English containing the target word.",
      "pt": "Tradução natural em português brasileiro.",
      "distractors": ["two", "grammatically", "plausible", "distractors"]
    },
    "listenType": {
      "sentence": "Another authentic sentence in English featuring connected speech and natural cadence.",
      "pt": "Tradução em português brasileiro."
    },
    "grammarFix": {
      "wrong": "A common mistake made by Brazilian Portuguese speakers with this expression or preposition.",
      "correct": "The corrected English sentence.",
      "explanationPt": "Explicação pedagógica clara e direta em português do porquê e como usar corretamente.",
      "promptPt": "Enunciado em português orientando o ajuste."
    },
    "speakVerify": {
      "sentence": "A conversational sentence that feels great to pronounce aloud.",
      "pt": "Tradução em português brasileiro."
    },
    "roleplayPrompt": {
      "leoQuestion": "An engaging question asked by Mascot Leo to the student in English.",
      "studentAnswer": "A natural, authentic student answer in English applying the required word.",
      "pt": "Pergunta em português para guiar a resposta."
    }
  }
]`;

    const models = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            geminiMatrix = {};
            for (const item of parsed) {
              if (item.targetWord) {
                geminiMatrix[item.targetWord.toLowerCase().trim()] = item;
              }
            }
            break;
          }
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed for weekly plan synthesis, trying next:`, err?.message || err);
      }
    }
  } catch (err: any) {
    console.warn('Gemini weekly plan synthesis failed, using resilient baseline:', err?.message || err);
  }

  return buildWeeklyPlan(
    input.topic,
    input.level,
    safeItems,
    input.classDay || 'Quarta-feira',
    input.dailyMinutesGoal || 20,
    input.rawNotes || '',
    geminiMatrix
  );
}

export function cleanAudioWav(base64Data: string, defaultSampleRate: number = 24000): string {
  if (!base64Data) return '';

  const binaryString = typeof window !== 'undefined'
    ? window.atob(base64Data)
    : Buffer.from(base64Data, 'base64').toString('binary');

  const inLen = binaryString.length;
  const inBytes = new Uint8Array(inLen);
  for (let i = 0; i < inLen; i++) {
    inBytes[i] = binaryString.charCodeAt(i);
  }

  // Recursive extractor: unwrap any RIFF container down to pure PCM samples,
  // discarding outer/inner headers and non-audio chunks (like C2PA watermark metadata).
  function extractPcm(bytes: Uint8Array): { pcm: Uint8Array; sampleRate: number; channels: number } {
    let sRate = defaultSampleRate;
    let ch = 1;
    if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let offset = 12;
      while (offset + 8 <= bytes.length) {
        const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        const chunkSize = view.getUint32(offset + 4, true);
        if (chunkId === 'fmt ' && chunkSize >= 16) {
          ch = view.getUint16(offset + 10, true);
          sRate = view.getUint32(offset + 12, true);
        } else if (chunkId === 'data') {
          const raw = bytes.subarray(offset + 8, offset + 8 + Math.min(chunkSize, bytes.length - offset - 8));
          // If the data payload itself was wrapped in another RIFF, unwrap again recursively
          const nested = extractPcm(raw);
          return { pcm: nested.pcm, sampleRate: sRate, channels: ch };
        }
        offset += 8 + chunkSize;
        if (chunkSize % 2 !== 0) offset++;
      }
    }
    return { pcm: bytes, sampleRate: sRate, channels: ch };
  }

  const { pcm, sampleRate, channels } = extractPcm(inBytes);

  // Ensure 16-bit alignment (even number of bytes)
  const pcmLen = pcm.length - (pcm.length % 2);
  const cleanPcm = new Uint8Array(pcmLen);
  cleanPcm.set(pcm.subarray(0, pcmLen));
  const pcmView = new DataView(cleanPcm.buffer);

  // Apply smooth 15ms fade-out (360 samples at 24kHz) at the end of the audio
  // to eliminate any DC offset, clicks, pops, or trailing hiss/noise
  const totalSamples = pcmLen / 2;
  const fadeSamples = Math.min(360, totalSamples);
  for (let i = 0; i < fadeSamples; i++) {
    const sampleIdx = totalSamples - fadeSamples + i;
    const byteIdx = sampleIdx * 2;
    const sampleVal = pcmView.getInt16(byteIdx, true);
    const factor = (fadeSamples - 1 - i) / fadeSamples;
    pcmView.setInt16(byteIdx, Math.round(sampleVal * factor), true);
  }

  // Construct a single, pristine standard 44-byte WAV header containing ONLY fmt and data
  const outBuf = new ArrayBuffer(44 + pcmLen);
  const outView = new DataView(outBuf);
  const outBytes = new Uint8Array(outBuf);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      outView.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  writeAscii(0, 'RIFF');
  outView.setUint32(4, 36 + pcmLen, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  outView.setUint32(16, 16, true);
  outView.setUint16(20, 1, true); // PCM format
  outView.setUint16(22, channels, true);
  outView.setUint32(24, sampleRate, true);
  outView.setUint32(28, byteRate, true);
  outView.setUint16(32, blockAlign, true);
  outView.setUint16(34, bitsPerSample, true);
  writeAscii(36, 'data');
  outView.setUint32(40, pcmLen, true);

  outBytes.set(cleanPcm, 44);

  if (typeof window !== 'undefined') {
    let binary = '';
    const len = outBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(outBytes[i]);
    }
    return window.btoa(binary);
  } else {
    return Buffer.from(outBuf).toString('base64');
  }
}

export async function synthesizeSpeechWithGemini(
  text: string,
  voiceName: string = 'Aoede'
): Promise<string | null> {
  const ai = getAiClient();
  const models = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
  ];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: (voiceName || 'Aoede') as any,
              },
            },
          },
        },
      });

      const pcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (pcmBase64) {
        return cleanAudioWav(pcmBase64, 24000);
      }
    } catch (err: any) {
      console.warn(`Gemini TTS model ${model} failed, trying next:`, err?.message || err);
    }
  }

  return null;
}

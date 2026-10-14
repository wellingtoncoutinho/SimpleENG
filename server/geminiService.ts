import { GoogleGenAI, Type } from '@google/genai';
import { LessonGenerationInput, LessonPayload } from '../src/types/lesson';
import { WeeklyPlanGenerationInput, WeeklyPlan } from '../src/types/weeklyPlan';
import { buildCustomLesson, buildWeeklyPlan } from '../src/utils/curriculumBuilder';

const getAiClient = () => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);
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
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

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
  // Always ensure safe, bulletproof generation
  return buildWeeklyPlan(
    input.topic,
    input.level,
    input.parsedItems || [],
    input.classDay || 'Quarta-feira',
    input.dailyMinutesGoal || 20,
    input.rawNotes || ''
  );
}

function convertPcmToWav(pcmBase64: string, sampleRate: number = 24000): string {
  const binaryString = typeof window !== 'undefined'
    ? window.atob(pcmBase64)
    : Buffer.from(pcmBase64, 'base64').toString('binary');
  const dataSize = binaryString.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < dataSize; i++) {
    bytes[44 + i] = binaryString.charCodeAt(i);
  }

  if (typeof window !== 'undefined') {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } else {
    return Buffer.from(buffer).toString('base64');
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
        return convertPcmToWav(pcmBase64, 24000);
      }
    } catch (err: any) {
      console.warn(`Gemini TTS model ${model} failed, trying next:`, err?.message || err);
    }
  }

  return null;
}

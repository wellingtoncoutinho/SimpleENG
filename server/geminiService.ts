import { GoogleGenAI, Type } from '@google/genai';
import { LessonGenerationInput, LessonPayload } from '../src/types/lesson';
import { WeeklyPlanGenerationInput, WeeklyPlan } from '../src/types/weeklyPlan';
import { buildCustomLesson, buildWeeklyPlan } from '../src/utils/curriculumBuilder';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
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

const SYSTEM_INSTRUCTION = `You are the core pedagogical AI engine for "SimpleENG", a web application designed to transform raw notes and vocabulary from private English conversation classes into interactive, gamified micro-lessons (Duolingo-style).

Your role is to receive user input (class topic, CEFR level, list of unfamiliar words/phrases, and student notes) and output an end-to-end, structured JSON payload. This payload will directly drive a front-end interface featuring audio synthesis (TTS), speech recognition (STT), tactile game loops, and the mascot "Leo".

PEDAGOGICAL & LINGUISTIC RULES:
1. Context-Driven Immersion: Never teach words in isolation. Every exercise must use authentic, conversational, and natural English matching the target CEFR level (A2, B1, B2, or C1).
2. Grammar & Collocation Awareness: Actively address common pitfalls associated with the target words (e.g., dependent prepositions like "depend ON", false friends, transitive vs. intransitive phrasal verbs, gerund vs. infinitive).
3. Phonetic & Audio Scaffolding:
   - Sentences prepared for TTS (audioSentence) must use natural punctuation (commas, question marks) to enforce realistic speech cadence.
   - For listening exercises, avoid convoluted tongue-twisters; prioritize high-frequency collocations.
4. Adaptive Feedback: Every exercise must include:
   - hint: A gentle clue without revealing the exact solution.
   - explanation: A crisp, 1-2 sentence breakdown explaining why the answer is correct and highlighting collocations or grammatical rules.

EXERCISE MECHANICS & PEDAGOGICAL ORDER:
To make learning gentle and progressive like Duolingo, ALWAYS order exercises as follows:
1. sentence_build (Interactive Word Bank): Start with this as exercise 1 so the learner begins with a visual, low-stress warm-up. Provide ordered words + 3-4 distractors in wordBank.
2. listen_type (Audio Dictation with Word Bank): TTS reads audioSentence. Provide wordBank with words + 2-3 distractors so user can click words or type.
3. grammar_fix (Contextual Error Correction): Identifies and fixes typical learner preposition/grammar mistake.
4. speak_verify (Pronunciation & Spoken Production): Prompt to say a sentence aloud.
5. roleplay_prompt (Conversational Exchange with Mascot "Leo"): Leo asks a direct question, student replies using requiredWords.

Mascot Leo should be upbeat, warm, and encourage the student in natural Portuguese.
You must ALWAYS reply with valid JSON only matching the schema.`;

export async function generateLessonWithGemini(input: LessonGenerationInput): Promise<LessonPayload> {
  const isPortuguese = input.language !== 'en';
  const cleanTargetWords = (input.targetWords || []).map((w) => w.trim()).filter(Boolean);

  // If no API key or empty words, return robust local curriculum immediately
  if (!process.env.GEMINI_API_KEY || cleanTargetWords.length === 0) {
    const vocabItems = cleanTargetWords.map((w, idx) => ({ id: `v_${idx}`, english: w }));
    return buildCustomLesson(input.topic, input.level, vocabItems, input.notes);
  }

  const prompt = `Generate a complete SimpleENG micro-lesson module for:
Topic: ${input.topic}
Level: ${input.level}
Target Vocabulary: ${cleanTargetWords.join(', ')}
Student Notes / Pain points: ${input.notes || 'Focus on natural spoken English, prepositions, and practical collocations.'}
Target Learner Profile: ${isPortuguese ? 'Native speaker of Brazilian Portuguese learning English. Provide clear instructions, hints, explanations, and mascot dialogues in warm, natural Brazilian Portuguese (or bilingual with PT explanations), while keeping the English target exercises, audio sentences, and word banks in 100% authentic conversational English!' : 'Standard ESL learner.'}

Ensure you provide between 5 and 7 exercises.
CRITICAL PEDAGOGICAL ORDER:
Exercise 1 MUST ALWAYS be "sentence_build" (tactile word bank blocks like Duolingo so the learner starts with a friendly, low-stress exercise, clicking words to assemble the sentence and hearing pronunciation).
Exercise 2 is "listen_type" (audio listening with word bank blocks provided in wordBank).
Exercise 3 is "grammar_fix" (spot and fix common preposition/structure errors).
Exercise 4 is "speak_verify" (speaking out loud).
Exercise 5 is "roleplay_prompt" (conversational exchange with mascot Leo).
Mascot Leo should be upbeat, warm, and pedagogically sharp in natural Brazilian Portuguese.`;

  // Use gemini-3.8-flash directly
  const modelsToTry = ['gemini-3.8-flash'];

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

export async function synthesizeSpeechWithGemini(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Clear, warm English language teacher, friendly and encouraging',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.error('Gemini TTS synthesis failed, fallback to browser speech synthesis:', err);
    return null;
  }
}

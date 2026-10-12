export type CEFRLevel = 'A2' | 'B1' | 'B2' | 'C1';

export type ExerciseType = 
  | 'listen_type'
  | 'speak_verify'
  | 'sentence_build'
  | 'roleplay_prompt'
  | 'grammar_fix';

export interface ModuleMeta {
  appName: string;
  topic: string;
  targetLevel: CEFRLevel;
  estimatedDurationMinutes: number;
  wordsCovered: string[];
}

export interface MascotWelcome {
  greeting: string;
  topicIntro: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  targetWord: string;
  instruction: string;
  instructionPt?: string;
  promptText: string;
  promptTextPt?: string;
  audioSentence: string | null;
  expectedAnswer: string;
  acceptableVariations: string[];
  wordBank: string[];
  requiredWords: string[];
  hint: string;
  hintPt?: string;
  explanation: string;
  explanationPt?: string;
  audioSpeedDefault: number;
  slowSpeedAvailable?: boolean;
}

export interface ReviewSummary {
  keyTakeaways: string[];
  keyTakeawaysPt?: string[];
  commonPitfallsToAvoid: string[];
  commonPitfallsToAvoidPt?: string[];
}

export interface LessonPayload {
  moduleMeta: ModuleMeta;
  mascotWelcome: MascotWelcome;
  exercises: Exercise[];
  reviewSummary: ReviewSummary;
}

export interface LessonGenerationInput {
  topic: string;
  level: CEFRLevel;
  targetWords: string[];
  notes: string;
  language?: 'pt' | 'en';
}

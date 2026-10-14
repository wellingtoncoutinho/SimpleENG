export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExerciseType = 
  | 'listen_type'
  | 'speak_verify'
  | 'sentence_build'
  | 'roleplay_prompt'
  | 'grammar_fix'
  | 'multiple_choice'
  | 'match_pairs'
  | 'fill_blank';

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

export interface MatchPair {
  id: string;
  english: string;
  portuguese: string;
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
  expectedAnswerPt?: string;
  acceptableVariations: string[];
  wordBank: string[];
  requiredWords: string[];
  hint: string;
  hintPt?: string;
  explanation: string;
  explanationPt?: string;
  audioSpeedDefault: number;
  slowSpeedAvailable?: boolean;

  // Dynamic exercise extensions:
  options?: string[]; // Multiple choice options or Fill-in-the-blank choices
  sentenceWithBlank?: string; // For fill_blank e.g. "I wish I had _______ to avoid the traffic."
  pairs?: MatchPair[]; // For match_pairs game
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

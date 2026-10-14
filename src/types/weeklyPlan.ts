import { CEFRLevel, Exercise, LessonPayload } from './lesson';

export interface ParsedVocabularyItem {
  id: string;
  english: string;
  portuguese?: string;
  pronunciation?: string;
  note?: string;
}

export interface LessonBlock {
  id: string;
  blockNumber: number; // e.g. 1, 2, 3, 4
  title: string;
  subtitle: string;
  durationMinutes: number; // e.g. 5
  type: ExerciseType | 'mini_game';
  targetWords: string[];
  isCompleted: boolean;
  completedAt?: string;
  score?: number;
  xpEarned?: number;
  lesson: LessonPayload;
}

export interface DayPlan {
  dayIndex: number; // 0 to 6 (Day 1 to Day 7)
  dateIso?: string; // e.g. "2026-10-12"
  dateFormatted?: string; // e.g. "12 Out"
  dayNumber?: number; // e.g. 12
  monthName?: string; // e.g. "Out"
  shortDayName?: string; // e.g. "Seg", "Ter", "Qua"
  dayName: string; // e.g. "Segunda-feira"
  dayLabel: string; // e.g. "Hoje · Aquecimento & Descoberta"
  theme: string;
  themeKey?: string; // 'restaurant' | 'family' | 'work' | 'travel' | 'friends' | 'dating' | 'city'
  isToday?: boolean;
  isClassDay?: boolean;
  isCompleted: boolean;
  totalMinutes: number;
  blocks: LessonBlock[];
}

export interface WeeklyPlan {
  id: string;
  createdAt: string;
  topic: string;
  cefrLevel: CEFRLevel;
  classDay: string; // e.g. "Quarta-feira"
  dailyMinutesGoal: number; // e.g. 20
  blocksPerDay: number; // e.g. 4
  rawNotes: string;
  parsedItems: ParsedVocabularyItem[];
  days: DayPlan[];
}

export interface WeeklyPlanGenerationInput {
  topic: string;
  level: CEFRLevel;
  rawNotes: string;
  parsedItems: ParsedVocabularyItem[];
  classDay: string;
  dailyMinutesGoal: number;
  language?: 'pt' | 'en';
  clientDateIso?: string;
}

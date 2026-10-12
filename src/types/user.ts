import { CEFRLevel } from './lesson';

export interface UserProfile {
  name: string;
  email: string;
  level: CEFRLevel;
  avatarStyle?: string;
  totalXp: number;
  lessonsCompleted: number;
  dailyMinutesGoal?: number; // e.g. 20 minutes default
  classDay?: string; // e.g. 'Quarta-feira'
  streakDays?: number;
  lastActiveDate?: string;
}

export const DEFAULT_USER: UserProfile = {
  name: 'Well',
  email: 'well@example.com',
  level: 'B2',
  avatarStyle: 'mascot',
  totalXp: 120,
  lessonsCompleted: 3,
  dailyMinutesGoal: 20,
  classDay: 'Quarta-feira',
  streakDays: 3,
};


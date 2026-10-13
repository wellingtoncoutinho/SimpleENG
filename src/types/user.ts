import { CEFRLevel } from './lesson';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  level: CEFRLevel;
  avatarStyle?: string;
  totalXp: number;
  lessonsCompleted: number;
  dailyMinutesGoal: number; // e.g. 20 minutes default
  classDay: string; // e.g. 'Quarta-feira'
  streakDays: number;
  lastActiveDate?: string;
  isAuthenticated: boolean;
  appLanguage: 'pt' | 'en';
  createdAt?: string;
}

export const DEFAULT_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  level: 'B2',
  avatarStyle: 'mascot',
  totalXp: 0,
  lessonsCompleted: 0,
  dailyMinutesGoal: 20,
  classDay: 'Quarta-feira',
  streakDays: 1,
  isAuthenticated: false,
  appLanguage: 'pt',
};

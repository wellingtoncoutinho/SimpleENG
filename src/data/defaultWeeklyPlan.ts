import { WeeklyPlan } from '../types/weeklyPlan';
import { buildWeeklyPlan } from '../utils/curriculumBuilder';

const DEFAULT_ITEMS = [
  {
    id: 'v1',
    english: 'schedule',
    portuguese: 'agendar / cronograma',
    pronunciation: 'eskedul',
    note: 'confundi com timetable na aula',
  },
  {
    id: 'v2',
    english: 'look forward to',
    portuguese: 'aguardar com expectativa',
    pronunciation: 'luk foruard tu',
    note: 'sempre seguido de verbo com -ING',
  },
  {
    id: 'v3',
    english: 'actually',
    portuguese: 'na verdade',
    pronunciation: 'aktchuali',
    note: 'falso amigo: não significa atualmente!',
  },
  {
    id: 'v4',
    english: 'overwhelmed',
    portuguese: 'sobrecarregado(a)',
    pronunciation: 'ouver-uelmd',
    note: 'sensação de excesso de tarefas',
  },
  {
    id: 'v5',
    english: 'put off',
    portuguese: 'adiar / postergar',
    note: 'phrasal verb comum no trabalho',
  },
  {
    id: 'v6',
    english: 'take for granted',
    portuguese: 'dar como certo / não valorizar',
    note: 'cuidado com a posição dos pronomes',
  },
];

export const INITIAL_WEEKLY_PLAN: WeeklyPlan = buildWeeklyPlan(
  'Rotina de Trabalho, Reuniões & Compromissos',
  'B2',
  DEFAULT_ITEMS,
  'Quarta-feira',
  20,
  'Anotações da aula de quarta: Tive dificuldade de usar "schedule" vs "timetable", errei a preposição em "look forward to", e confundi "actually" achando que era atualmente.'
);

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Flame,
  CheckCircle2,
  Check,
  Play,
  Volume2,
  Sparkles,
  BookOpen,
  Plus,
  RotateCcw,
  GraduationCap,
  ArrowRight,
  X,
  Target,
  Zap,
  Smile,
} from 'lucide-react';
import { WeeklyPlan, DayPlan, LessonBlock } from '../types/weeklyPlan';
import { UserProfile } from '../types/user';
import { LearnerMascot } from './LearnerMascot';
import { speakWord, soundEffects } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

interface WeeklyPlannerViewProps {
  plan: WeeklyPlan | null;
  user: UserProfile;
  lang?: Language;
  onStartBlock: (block: LessonBlock, dayIndex: number) => void;
  onOpenNewPlanCreator: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onUpgradePlan?: () => void;
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  user,
  lang = 'pt',
  onStartBlock,
  onOpenNewPlanCreator,
  onOpenAuth,
  onUpgradePlan,
}) => {
  const t = translations[lang];

  // Local real calendar date calculation (prevents timezone/UTC drift)
  const getLocalDateIso = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayIso = getLocalDateIso();

  // A day is TODAY strictly if its dateIso matches today's real local date!
  const isDayToday = (d: DayPlan) => Boolean(d.dateIso && d.dateIso === todayIso);

  const hasValidPlan = Boolean(plan && plan.days && plan.days.length > 0);
  const todayIndex = hasValidPlan && plan ? plan.days.findIndex(isDayToday) : -1;

  // If today is within the 7-day plan, ALWAYS open TODAY by default!
  const initialDayIndex =
    todayIndex !== -1
      ? todayIndex
      : hasValidPlan && plan
      ? Math.max(0, plan.days.findIndex((d) => !d.isCompleted))
      : 0;

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    initialDayIndex !== -1 ? initialDayIndex : 0
  );
  const [showVocabModal, setShowVocabModal] = useState<boolean>(false);

  // Auto-sync selection when plan changes or on date rollover
  React.useEffect(() => {
    if (todayIndex !== -1) {
      setSelectedDayIndex(todayIndex);
    } else if (hasValidPlan && plan) {
      const firstUncompleted = plan.days.findIndex((d) => !d.isCompleted);
      setSelectedDayIndex(firstUncompleted !== -1 ? firstUncompleted : 0);
    }
  }, [plan?.id, plan?.createdAt, todayIso, todayIndex]);

  // If no plan is active, display an inviting Empty State
  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in">
        {/* Empty State Welcome Card */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Mascot */}
          <div className="flex justify-center mb-5">
            <LearnerMascot mood="speaking" size="md" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full mb-3 border border-emerald-200/80 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Bem-vindo ao SimpleENG</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            {user.isAuthenticated && user.name
              ? `Olá, ${user.name}! Pronto para estudar sua última aula?`
              : 'Pronto para transformar suas aulas de inglês em fluência?'}
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Você ainda não cadastrou as anotações da sua aula semanal. Cole as palavras, frases e correções do seu professor para criarmos um <strong>roteiro de 7 dias prático e dinâmico</strong>, com 20 minutos de estudo diário!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                onOpenNewPlanCreator();
              }}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl text-white font-black text-sm sm:text-base btn-3d-green shadow-md cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{t.createPlanBtn}</span>
            </button>

            {!user.isAuthenticated && onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenAuth('login');
                }}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-black text-sm sm:text-base hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.navLogin}</span>
              </button>
            )}
          </div>

          {/* 3 Step Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm mb-2.5">
                1
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                Cole suas Anotações
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Jogue as palavras em inglês, pronúncias e significados da sua aula sem se preocupar com formatação.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm mb-2.5">
                2
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                Ciclo de 7 Dias
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                A IA do Simple distribui as palavras em 4 blocos ágeis de 5 minutos para cada dia da sua semana.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm mb-2.5">
                3
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                Pratique & Fixe
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Monte frases, treine audição, fale no microfone e mantenha sua ofensiva ativa até a próxima aula!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedDay: DayPlan = plan.days[selectedDayIndex] || plan.days[0];

  // Aggregate stats
  const totalBlocks = plan.days.reduce((acc, d) => acc + d.blocks.length, 0);
  const completedBlocks = plan.days.reduce(
    (acc, d) => acc + d.blocks.filter((b) => b.isCompleted).length,
    0
  );
  const progressPercent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
  const completedDaysCount = plan.days.filter((d) => d.isCompleted).length;

  const handleDaySelect = (index: number) => {
    soundEffects.playTap();
    setSelectedDayIndex(index);
  };

  const handlePronounceWord = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    speakWord(word);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 sm:py-8 animate-in fade-in">
      {/* 1. Header Overview Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ciclo de 7 Dias</span>
              </span>

              {plan.classDay && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>Aula: {plan.classDay}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {plan.topic}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Meta: {plan.dailyMinutesGoal} min/dia · Nível {plan.cefrLevel}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            {onUpgradePlan && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onUpgradePlan();
                }}
                title="Regenera os exercícios da semana com frases naturais e cenários atualizados, mantendo seu progresso"
                className="px-3.5 py-2.5 btn-3d-slate font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Atualizar Exercícios</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setShowVocabModal(true);
              }}
              className="px-3.5 py-2.5 btn-3d-slate font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.thisWeekVocab} ({plan.parsedItems?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                onOpenNewPlanCreator();
              }}
              className="px-4 py-2.5 btn-3d-green text-white font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t.navNewLesson}</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-5">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/60 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{t.dailyGoal}</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {plan.dailyMinutesGoal} min
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/60 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{t.completed}</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {completedBlocks} / {totalBlocks}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/60 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Target className="w-3 h-3 text-blue-500" />
              <span>Progresso Semanal</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {progressPercent}%
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/60 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Dias Feitos</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {completedDaysCount} / 7
            </div>
          </div>
        </div>

        {/* Weekly Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive 7-Day Rolling Calendar Bar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Seus 7 Dias de Estudo
          </span>
          {todayIndex !== -1 && (
            <button
              type="button"
              onClick={() => handleDaySelect(todayIndex)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Ir para Hoje</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 7-Day Buttons Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {plan.days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const completedCount = day.blocks.filter((b) => b.isCompleted).length;
            const isAllCompleted = completedCount === day.blocks.length && day.blocks.length > 0;
            const isToday = isDayToday(day);
            const isClassDay = day.isClassDay;

            const shortLabel =
              day.shortDayName ||
              (day.dayName ? day.dayName.split('-')[0].slice(0, 3) : `D${idx + 1}`);

            return (
              <button
                key={day.dayIndex ?? idx}
                type="button"
                onClick={() => handleDaySelect(idx)}
                className={`group relative p-2 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-between min-h-[82px] sm:min-h-[96px] text-center ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                    : isAllCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                }`}
              >
                {/* Top Badge */}
                <div className="h-4 flex items-center justify-center gap-1 w-full">
                  {isToday ? (
                    <span
                      className={`text-[9px] font-black uppercase tracking-tight px-1.5 py-0.2 rounded-full leading-tight ${
                        isSelected
                          ? 'bg-white text-emerald-700'
                          : 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      Hoje
                    </span>
                  ) : isClassDay ? (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-tight px-1 rounded leading-tight flex items-center gap-0.5 ${
                        isSelected ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <GraduationCap className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Aula</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] uppercase font-bold tracking-tight ${
                        isSelected ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      D{idx + 1}
                    </span>
                  )}
                </div>

                {/* Day Name & Date Number */}
                <div className="my-1">
                  <span
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-tight block ${
                      isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {shortLabel}
                  </span>
                  <span
                    className={`text-sm sm:text-lg font-black leading-tight block ${
                      isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {day.dayNumber || idx + 1}
                  </span>
                </div>

                {/* 4 dots for the blocks */}
                <div className="w-full flex items-center justify-center gap-0.5 sm:gap-1 mt-1">
                  {isAllCompleted ? (
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {day.blocks.map((b, bIdx) => (
                        <span
                          key={b.id || bIdx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            b.isCompleted
                              ? isSelected
                                ? 'bg-white'
                                : 'bg-emerald-500'
                              : isSelected
                              ? 'bg-emerald-800'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Day Panel & 4 Daily Blocks */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        {/* Selected Day Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isDayToday(selectedDay)
                  ? `Hoje · ${selectedDay.dayLabel.replace(/^Dia \d+\s*·\s*/, '').replace(/^Hoje\s*·\s*/, '')}`
                  : selectedDay.dayLabel.replace(/^Hoje\s*·\s*/, `Dia ${selectedDayIndex + 1} · `)}
              </span>
              {selectedDay.dateFormatted && (
                <span className="text-xs text-slate-400 font-semibold">
                  · {selectedDay.dateFormatted}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {selectedDay.dayName}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              {selectedDay.theme}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto text-left sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Status do Dia
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {selectedDay.blocks.filter((b) => b.isCompleted).length} de {selectedDay.blocks.length} blocos feitos
            </span>
          </div>
        </div>

        {/* 4 Blocks */}
        <div className="space-y-3">
          {selectedDay.blocks.map((block) => (
            <div
              key={block.id}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                block.isCompleted
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    <span>{block.durationMinutes} min</span>
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Bloco {block.blockNumber} de 4
                  </span>

                  {block.isCompleted && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Concluído</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-0.5">
                  {block.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
                  {block.subtitle}
                </p>

                {/* Vocabulary chips with audio */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400">Palavras-chave:</span>
                  {block.targetWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={(e) => handlePronounceWord(e, word)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                      title="Ouvir pronúncia"
                    >
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>{word}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start block button with Duolingo 3D style */}
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    onStartBlock(block, selectedDayIndex);
                  }}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    block.isCompleted
                      ? 'btn-3d-slate'
                      : 'btn-3d-green text-white shadow-xs'
                  }`}
                >
                  {block.isCompleted ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.reviewBlock} (5 min)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{t.startBlock} (5 min)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Vocabulary Modal */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t.thisWeekVocab}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {plan.parsedItems?.length || 0} termos cadastrados para este ciclo
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowVocabModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {plan.parsedItems?.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {item.english}
                      </span>
                      {item.pronunciation && (
                        <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800">
                          /{item.pronunciation}/
                        </span>
                      )}
                    </div>
                    {item.portuguese && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                        = {item.portuguese}
                      </div>
                    )}
                    {item.note && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                        Nota: {item.note}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handlePronounceWord(e, item.english)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowVocabModal(false)}
                className="w-full py-2.5 btn-3d-slate font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

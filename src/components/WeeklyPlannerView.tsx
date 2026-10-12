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
  ChevronRight,
  ArrowRight,
  X,
  Target,
} from 'lucide-react';
import { WeeklyPlan, DayPlan, LessonBlock } from '../types/weeklyPlan';
import { UserProfile } from '../types/user';
import { speakWord, soundEffects } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

interface WeeklyPlannerViewProps {
  plan: WeeklyPlan;
  user: UserProfile;
  lang?: Language;
  onStartBlock: (block: LessonBlock, dayIndex: number) => void;
  onOpenNewPlanCreator: () => void;
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  user,
  lang = 'pt',
  onStartBlock,
  onOpenNewPlanCreator,
}) => {
  const t = translations[lang];

  // Match today or default to first incomplete day
  const todayIso = new Date().toISOString().split('T')[0];
  const todayIndex = plan.days.findIndex(
    (d) => d.isToday || (d.dateIso && d.dateIso === todayIso)
  );

  const initialDayIndex =
    todayIndex !== -1
      ? todayIndex
      : Math.max(0, plan.days.findIndex((d) => !d.isCompleted));

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    initialDayIndex !== -1 ? initialDayIndex : 0
  );
  const [showVocabModal, setShowVocabModal] = useState<boolean>(false);

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
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ciclo de 7 Dias</span>
              </span>

              {plan.classDay && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>Aula: {plan.classDay}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {plan.topic}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              {lang === 'pt'
                ? `Meta: ${plan.dailyMinutesGoal} min/dia (4 blocos de 5 min) · Nível ${plan.cefrLevel}`
                : `Goal: ${plan.dailyMinutesGoal} min/day (4 blocks of 5 min) · Level ${plan.cefrLevel}`}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setShowVocabModal(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/60"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anotações ({plan.parsedItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                onOpenNewPlanCreator();
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Aula</span>
            </button>
          </div>
        </div>

        {/* Unified, Minimalist Stats Strip (Aesthetic, no emoji clutter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-5">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-left">
            <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Meta Diária</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {plan.dailyMinutesGoal} min
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-left">
            <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              <span>Blocos Feitos</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {completedBlocks} / {totalBlocks}
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-left">
            <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Flame className="w-3 h-3 text-emerald-600" />
              <span>Sequência</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {user.streakDays || 1} {user.streakDays === 1 ? 'dia' : 'dias'}
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-left">
            <div className="flex items-center justify-between text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Progresso</span>
              <span className="text-emerald-700 font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Organized 7-Day Calendar Strip */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Calendário da Semana
            </span>
            <span className="text-2xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              7 dias a partir de hoje
            </span>
          </div>

          {todayIndex !== -1 && selectedDayIndex !== todayIndex && (
            <button
              type="button"
              onClick={() => handleDaySelect(todayIndex)}
              className="text-2xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
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
            const isToday = day.isToday || (day.dateIso && day.dateIso === todayIso);
            const isClassDay = day.isClassDay;

            const shortLabel =
              day.shortDayName ||
              (day.dayName ? day.dayName.split('-')[0].slice(0, 3) : `D${idx + 1}`);

            return (
              <button
                key={day.dayIndex ?? idx}
                type="button"
                onClick={() => handleDaySelect(idx)}
                className={`group relative p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[82px] sm:min-h-[96px] text-center ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                    : isAllCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 text-slate-800'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                }`}
              >
                {/* Top Badges: Hoje / Aula */}
                <div className="h-4 flex items-center justify-center gap-1 w-full">
                  {isToday ? (
                    <span
                      className={`text-3xs sm:text-2xs font-black uppercase tracking-tight px-1.5 py-0.2 rounded-full leading-tight ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 text-emerald-800 font-extrabold'
                      }`}
                    >
                      Hoje
                    </span>
                  ) : isClassDay ? (
                    <span
                      className={`text-3xs sm:text-2xs font-bold uppercase tracking-tight px-1 rounded leading-tight flex items-center gap-0.5 ${
                        isSelected ? 'text-emerald-300' : 'text-slate-500'
                      }`}
                      title="Dia da Aula de Inglês"
                    >
                      <GraduationCap className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Aula</span>
                    </span>
                  ) : (
                    <span
                      className={`text-3xs uppercase font-bold tracking-tight ${
                        isSelected ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      D{idx + 1}
                    </span>
                  )}
                </div>

                {/* Day Name & Date Number */}
                <div className="my-1">
                  <span
                    className={`text-2xs sm:text-xs font-bold uppercase tracking-tight block ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {shortLabel}
                  </span>
                  <span
                    className={`text-sm sm:text-lg font-black leading-tight block ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {day.dayNumber || (idx + 1)}
                  </span>
                </div>

                {/* Progress Indicators: 4 Dots for the 4 Blocks */}
                <div className="w-full flex items-center justify-center gap-0.5 sm:gap-1 mt-1">
                  {isAllCompleted ? (
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-500 text-white'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {day.blocks.map((b, bIdx) => (
                        <span
                          key={b.id || bIdx}
                          className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full transition-all ${
                            b.isCompleted
                              ? isSelected
                                ? 'bg-emerald-400'
                                : 'bg-emerald-500'
                              : isSelected
                              ? 'bg-slate-700'
                              : 'bg-slate-200'
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
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
        {/* Selected Day Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                {selectedDay.dayLabel}
              </span>
              {selectedDay.dateFormatted && (
                <span className="text-xs text-slate-400 font-semibold">
                  · {selectedDay.dateFormatted}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {selectedDay.dayName}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              {selectedDay.theme}
            </p>
          </div>

          <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 self-start sm:self-auto text-left sm:text-right">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Status do Dia
            </span>
            <span className="text-xs font-black text-slate-800">
              {selectedDay.blocks.filter((b) => b.isCompleted).length} de 4 blocos feitos (
              {selectedDay.blocks.filter((b) => b.isCompleted).length * 5} min de{' '}
              {selectedDay.totalMinutes} min)
            </span>
          </div>
        </div>

        {/* The 4 Blocks of 5 Minutes Each */}
        <div className="space-y-3">
          {selectedDay.blocks.map((block) => (
            <div
              key={block.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                block.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex-1">
                {/* Meta pills */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    <span>{block.durationMinutes} min</span>
                  </span>

                  <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Bloco {block.blockNumber} de 4
                  </span>

                  {block.isCompleted && (
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Concluído</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-black text-slate-900 mb-0.5">
                  {block.title}
                </h3>
                <p className="text-slate-500 text-xs font-medium mb-3">{block.subtitle}</p>

                {/* Vocabulary chips with audio preview */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-2xs font-bold text-slate-400">Palavras do bloco:</span>
                  {block.targetWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={(e) => handlePronounceWord(e, word)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold text-slate-800 transition-all cursor-pointer"
                      title="Ouvir pronúncia"
                    >
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>{word}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Block Button */}
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    onStartBlock(block, selectedDayIndex);
                  }}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    block.isCompleted
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  }`}
                >
                  {block.isCompleted ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'pt' ? 'Revisar (5 min)' : 'Review (5 min)'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{lang === 'pt' ? 'Iniciar (5 min)' : 'Start (5 min)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Classroom Vocabulary Modal (Clean & Organized) */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Anotações da sua Aula</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {plan.parsedItems.length} termos catalogados para este ciclo
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowVocabModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {plan.parsedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{item.english}</span>
                      {item.pronunciation && (
                        <span className="text-2xs font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          /{item.pronunciation}/
                        </span>
                      )}
                    </div>
                    {item.portuguese && (
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        = {item.portuguese}
                      </div>
                    )}
                    {item.note && (
                      <div className="text-2xs text-slate-600 bg-white border border-slate-200/80 rounded px-2 py-0.5 mt-1.5 font-medium inline-block">
                        Nota: {item.note}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handlePronounceWord(e, item.english)}
                    className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-all cursor-pointer"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowVocabModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
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

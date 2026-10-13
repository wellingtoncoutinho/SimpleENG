import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Check, X, Calendar, ArrowRight } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { LearnerMascot } from './LearnerMascot';

interface StreakBadgeProps {
  streakDays: number;
  lessonsCompleted?: number;
  onStartLesson?: () => void;
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streakDays = 0,
  lessonsCompleted = 0,
  onStartLesson,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // If user completed 0 lessons, streak is strictly 0
  const effectiveStreak = (lessonsCompleted || 0) === 0 ? 0 : Math.max(0, streakDays || 0);
  const isIgnited = effectiveStreak > 0;

  const handleToggle = () => {
    soundEffects.playTap();
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    soundEffects.playTap();
    setIsOpen(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Current day index in week (0 = Monday, 6 = Sunday)
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="relative inline-block">
      <style>{`
        @keyframes flameFlicker {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4)); }
          25% { transform: scale(1.1) rotate(-3deg); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6)); }
          50% { transform: scale(1.05) rotate(2deg); filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.5)); }
          75% { transform: scale(1.15) rotate(-1deg); filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.7)); }
        }
        .anim-flame {
          animation: flameFlicker 1.8s ease-in-out infinite;
          transform-origin: center bottom;
        }
      `}</style>

      {/* Header Pill Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer select-none group ${
          isIgnited
            ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-red-500/10 dark:from-amber-950/40 dark:to-orange-950/40 border-orange-400/80 dark:border-orange-500/60 shadow-xs hover:border-orange-500 hover:scale-105 active:scale-95'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 hover:border-amber-400'
        }`}
        title={
          isIgnited
            ? `Ofensiva ativa: ${effectiveStreak} dia(s) seguido(s)! Clique para detalhes.`
            : 'Sua ofensiva está em 0. Complete sua primeira atividade hoje para acender o fogo!'
        }
      >
        {isIgnited ? (
          <div className="anim-flame">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
        ) : (
          <Flame className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
        )}

        <span
          className={`text-xs font-black tracking-tight ${
            isIgnited
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-slate-500 dark:text-slate-400 group-hover:text-amber-600'
          }`}
        >
          {effectiveStreak}
        </span>
      </button>

      {/* Popover Dropdown (Anchored directly under the button) */}
      {isOpen && (
        <>
          {/* Backdrop overlay: clicking anywhere outside closes the popover */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in cursor-default"
            onClick={handleClose}
          />

          {/* Popover Card */}
          <div
            className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-18 sm:top-full sm:mt-2 w-auto sm:w-88 max-w-sm sm:max-w-[calc(100vw-24px)] mx-auto z-50 bg-white dark:bg-slate-900 rounded-3xl p-5 text-center shadow-2xl border-2 border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 sm:origin-top-right overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div
              className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                isIgnited ? 'bg-orange-500/20' : 'bg-amber-500/15'
              }`}
            />

            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between mb-3 relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80">
                <Flame
                  className={`w-3.5 h-3.5 ${
                    isIgnited ? 'text-orange-500 fill-orange-500 anim-flame' : 'text-slate-400'
                  }`}
                />
                <span className="text-[11px] font-black text-orange-700 dark:text-orange-300">
                  {isIgnited ? `${effectiveStreak} dias seguidos` : 'Ofensiva: 0 dias'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mascot Illustration */}
            <div className="relative flex justify-center mb-2">
              <LearnerMascot mood={isIgnited ? 'celebrate' : 'speaking'} size="xs" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
              {isIgnited ? 'Sua chama está acesa! 🔥' : 'Acenda sua Ofensiva Hoje! 🔥'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {isIgnited
                ? 'Você está mantendo o hábito diário de praticar seu inglês. Treine todos os dias para não deixar o fogo apagar!'
                : 'Sua sequência está em 0. Conclua sua primeira atividade de 5 minutos hoje para acender a chama e manter o ritmo!'}
            </p>

            {/* Mini Weekly Tracker */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 mb-4 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>Esta semana</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                  {lessonsCompleted} atividade(s) concluída(s)
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEK_DAYS.map((day, idx) => {
                  const isToday = idx === todayIdx;
                  // Only check days within the active streak window
                  const isChecked =
                    isIgnited && idx <= todayIdx && todayIdx - idx < effectiveStreak;

                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                        isToday
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 shadow-2xs'
                          : isChecked
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] font-black">{day}</span>
                      <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center">
                        {isChecked ? (
                          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        ) : isToday ? (
                          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setIsOpen(false);
                  if (onStartLesson) onStartLesson();
                }}
                className="w-full py-3 px-4 btn-3d-green text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm tracking-wide"
              >
                <span>{isIgnited ? 'Continuar Praticando' : 'Começar Treino Agora!'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

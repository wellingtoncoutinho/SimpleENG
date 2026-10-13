import React, { useState } from 'react';
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
  const [showModal, setShowModal] = useState<boolean>(false);
  const isIgnited = streakDays > 0;

  const handleClick = () => {
    soundEffects.playTap();
    setShowModal(true);
  };

  // Current day index in week (0 = Monday, 6 = Sunday)
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <>
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
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer select-none group ${
          isIgnited
            ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-red-500/10 dark:from-amber-950/40 dark:to-orange-950/40 border-orange-400/80 dark:border-orange-500/60 shadow-xs hover:border-orange-500 hover:scale-105 active:scale-95'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 hover:border-amber-400'
        }`}
        title={
          isIgnited
            ? `Ofensiva ativa: ${streakDays} dia(s) seguido(s)! Clique para detalhes.`
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
          {streakDays}
        </span>
      </button>

      {/* Motivational Streak Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-2 border-slate-200 dark:border-slate-800 animate-in zoom-in-95 relative overflow-hidden">
            {/* Background Glow */}
            <div
              className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                isIgnited ? 'bg-orange-500/20' : 'bg-amber-500/15'
              }`}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mascot & Flame Illustration */}
            <div className="relative flex justify-center mb-3 pt-2">
              <LearnerMascot mood={isIgnited ? 'celebrate' : 'speaking'} size="xs" />
            </div>

            {/* Title & Streak Number */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 mb-2">
              <Flame
                className={`w-4 h-4 ${
                  isIgnited ? 'text-orange-500 fill-orange-500 anim-flame' : 'text-amber-500'
                }`}
              />
              <span className="text-xs font-black text-orange-700 dark:text-orange-300">
                {isIgnited ? `${streakDays} dias seguidos!` : 'Ofensiva: 0 dias'}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              {isIgnited
                ? 'Sua chama está acesa! 🔥'
                : 'Acenda sua Ofensiva Hoje! 🔥'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              {isIgnited
                ? 'Você está mantendo o hábito diário de praticar seu inglês. Treine todos os dias para não deixar o fogo apagar!'
                : 'Complete sua primeira lição de 5 minutos hoje para acender o fogo e começar sua sequência ininterrupta de estudos!'}
            </p>

            {/* Mini Weekly Tracker */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>Esta semana</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {lessonsCompleted} atividade(s) concluída(s)
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEK_DAYS.map((day, idx) => {
                  const isToday = idx === todayIdx;
                  const isChecked = isIgnited && idx <= todayIdx;

                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                        isToday
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200'
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
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setShowModal(false);
                if (onStartLesson) onStartLesson();
              }}
              className="w-full py-3.5 px-4 btn-3d-green text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{isIgnited ? 'Continuar Praticando' : 'Bora Começar Agora!'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

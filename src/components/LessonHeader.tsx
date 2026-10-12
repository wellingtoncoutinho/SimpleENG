import React from 'react';
import { X, Heart, Flame, Sparkles } from 'lucide-react';

interface LessonHeaderProps {
  currentIndex: number;
  totalExercises: number;
  hearts: number;
  maxHearts?: number;
  xp: number;
  onExit: () => void;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  currentIndex,
  totalExercises,
  hearts,
  maxHearts = 5,
  xp,
  onExit,
}) => {
  const progressPercent = Math.min(
    100,
    Math.round(((currentIndex) / totalExercises) * 100)
  );

  return (
    <header className="w-full max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
      {/* Exit Button */}
      <button
        type="button"
        onClick={onExit}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        title="Exit micro-lesson"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Progress Bar */}
      <div className="flex-1 max-w-md h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 relative">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Subtle glossy sheen */}
          <div className="absolute inset-0 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Stats (Hearts & XP) */}
      <div className="flex items-center gap-3">
        {/* XP Badge */}
        <div className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
          <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>{xp} XP</span>
        </div>

        {/* Hearts */}
        <div className="inline-flex items-center gap-1 text-xs font-black text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span>{hearts}</span>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Wrench, AlertTriangle, RotateCcw } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { Language, translations } from '../../utils/i18n';
import { ClickableSentence } from '../ClickableSentence';

interface GrammarFixExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  lang?: Language;
  disabled?: boolean;
}

export const GrammarFixExercise: React.FC<GrammarFixExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  onSubmit,
  lang = 'pt',
  disabled = false,
}) => {
  const t = translations[lang];
  const activeInstruction = lang === 'pt' ? (exercise.instructionPt || exercise.instruction) : exercise.instruction;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userAnswer.trim() && !disabled) {
      onSubmit();
    }
  };

  const handlePreFill = () => {
    onChangeAnswer(exercise.promptText);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word Chip */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200 shadow-xs">
        <Wrench className="w-3.5 h-3.5" />
        <span>Grammar Fix</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white text-center mb-6 tracking-tight">
        {activeInstruction}
      </h2>

      {/* Flawed Sentence Card */}
      <div className="w-full bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-900 rounded-2xl p-5 mb-5 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
          <AlertTriangle className="w-4 h-4" /> {t.containsMistake}
        </div>
        <div className="text-lg sm:text-xl font-bold leading-relaxed my-1">
          <ClickableSentence
            sentence={exercise.promptText}
            highlightWord={exercise.targetWord}
            wordClassName="text-slate-900 dark:text-white"
          />
        </div>
        <p className="text-2xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
          💡 Toque em qualquer palavra para ver a tradução (ex: clique em "{exercise.targetWord}")
        </p>
      </div>

      {/* Pre-fill button */}
      {!userAnswer && !disabled && (
        <button
          type="button"
          onClick={handlePreFill}
          className="mb-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
        >
          {t.clickToLoadSentence}
        </button>
      )}

      {/* Correction Input */}
      <div className="w-full relative">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t.typeFixPlaceholder}
          className="w-full text-base sm:text-lg font-medium px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
        />

        {userAnswer && !disabled && (
          <button
            type="button"
            onClick={() => onChangeAnswer('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            title={t.clearAll}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500 text-center">
        {t.grammarFixTip}
      </p>
    </div>
  );
};

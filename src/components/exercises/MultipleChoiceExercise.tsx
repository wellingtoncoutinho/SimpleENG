import React from 'react';
import { Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { Language } from '../../utils/i18n';
import { playTextToSpeech, soundEffects } from '../../utils/audio';

interface MultipleChoiceExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (answer: string) => void;
  onSubmit?: () => void;
  lang?: Language;
  disabled?: boolean;
}

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  lang = 'pt',
  disabled = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  const options = React.useMemo(() => {
    if (exercise.options && exercise.options.length > 0) {
      return exercise.options;
    }
    // Fallback: expected answer + variations or bank items
    const opts = [exercise.expectedAnswer];
    if (exercise.acceptableVariations) {
      for (const v of exercise.acceptableVariations) {
        if (!opts.includes(v) && opts.length < 3) opts.push(v);
      }
    }
    return opts;
  }, [exercise]);

  const handlePlayAudio = async (speed: number = 1.0) => {
    if (!exercise.audioSentence || isPlayingAudio) return;
    setIsPlayingAudio(true);
    await playTextToSpeech(exercise.audioSentence, speed, () => setIsPlayingAudio(false));
  };

  const handleSelect = (option: string) => {
    if (disabled) return;
    soundEffects.playTap();
    onChangeAnswer(option);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in duration-200">
      {/* Category / Skill Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{lang === 'pt' ? 'Quiz de Contexto Real' : 'Context Scenario Quiz'}</span>
      </div>

      {/* Main Instruction */}
      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 text-center mb-2">
        {exercise.instructionPt || exercise.instruction || 'Qual é a resposta correta para esta situação?'}
      </h2>

      {/* Scenario / Prompt Box */}
      <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 mb-6 shadow-xs text-center relative">
        {exercise.promptTextPt && exercise.promptText && exercise.promptTextPt !== exercise.promptText && (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            {exercise.promptTextPt}
          </p>
        )}
        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {exercise.promptText || exercise.promptTextPt}
        </p>

        {disabled && exercise.audioSentence && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handlePlayAudio(1.0)}
              disabled={isPlayingAudio}
              className={`p-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-2 ${
                isPlayingAudio ? 'opacity-70 animate-pulse' : ''
              }`}
              title="Ouvir a frase em inglês"
            >
              <Volume2 className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs font-bold">Ouvir pronúncia</span>
            </button>
          </div>
        )}
      </div>

      {/* Options List */}
      <div className="w-full space-y-3 mb-4">
        {options.map((option, idx) => {
          const isSelected = userAnswer === option;
          const letter = letters[idx % letters.length];

          return (
            <button
              key={`${option}-${idx}`}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={disabled}
              className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 text-left group active:scale-[0.99] ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
              } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200'
                }`}
              >
                {letter}
              </span>

              <span className="text-sm sm:text-base font-bold flex-1 leading-snug">
                {option}
              </span>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

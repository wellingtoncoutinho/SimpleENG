import React from 'react';
import { Volume2, Sparkles, X, Check } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { Language } from '../../utils/i18n';
import { playTextToSpeech, soundEffects } from '../../utils/audio';

interface FillBlankExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (answer: string) => void;
  onSubmit?: () => void;
  lang?: Language;
  disabled?: boolean;
}

export const FillBlankExercise: React.FC<FillBlankExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  lang = 'pt',
  disabled = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  // Parse sentence into before blank / after blank
  const { beforeBlank, afterBlank } = React.useMemo(() => {
    const raw = exercise.sentenceWithBlank || exercise.expectedAnswer || '';
    if (raw.includes('______') || raw.includes('_______') || raw.includes('_____')) {
      const parts = raw.split(/_{3,}/);
      return { beforeBlank: parts[0] || '', afterBlank: parts[1] || '' };
    }
    // If no explicit blank in sentence, replace the target word with blank!
    const target = exercise.targetWord || '';
    if (target && raw.toLowerCase().includes(target.toLowerCase())) {
      const regex = new RegExp(target, 'i');
      const parts = raw.split(regex);
      return { beforeBlank: parts[0] || '', afterBlank: parts[1] || '' };
    }
    return { beforeBlank: raw, afterBlank: '' };
  }, [exercise]);

  // Options: target word + 2-3 distractors
  const options = React.useMemo(() => {
    if (exercise.options && exercise.options.length > 0) {
      return exercise.options;
    }
    const safeWord = exercise.targetWord || exercise.expectedAnswer;
    const list = [safeWord];
    if (exercise.wordBank && exercise.wordBank.length > 0) {
      for (const w of exercise.wordBank) {
        if (!list.includes(w) && w.toLowerCase() !== safeWord.toLowerCase() && list.length < 4) {
          list.push(w);
        }
      }
    }
    // Shuffle options once
    return list.sort(() => 0.5 - Math.random());
  }, [exercise.options, exercise.targetWord, exercise.wordBank]);

  const handlePlayAudio = async (speed: number = 1.0) => {
    if (!exercise.audioSentence || isPlayingAudio) return;
    setIsPlayingAudio(true);
    await playTextToSpeech(exercise.audioSentence, speed, () => setIsPlayingAudio(false));
  };

  const handleSelectOption = (opt: string) => {
    if (disabled) return;
    soundEffects.playTap();
    onChangeAnswer(opt);
  };

  const handleClear = () => {
    if (disabled) return;
    soundEffects.playTap();
    onChangeAnswer('');
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in duration-200">
      {/* Category / Skill Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{lang === 'pt' ? 'Complete a Frase' : 'Fill in the Blank'}</span>
      </div>

      {/* Main Instruction */}
      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 text-center mb-2">
        {exercise.instructionPt || exercise.instruction || 'Toque na palavra correta para preencher a lacuna:'}
      </h2>

      {/* Audio Button */}
      {exercise.audioSentence && (
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => handlePlayAudio(1.0)}
            disabled={isPlayingAudio}
            className={`px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
              isPlayingAudio ? 'opacity-70 animate-pulse' : ''
            }`}
            title="Ouvir a frase completa"
          >
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
            <span className="text-xs font-black uppercase tracking-wider">Ouvir Frase</span>
          </button>
        </div>
      )}

      {/* Sentence Cloze Box */}
      <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 mb-6 shadow-xs text-center">
        <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-loose flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {beforeBlank && <span>{beforeBlank.trim()}</span>}

          {/* Blank Slot */}
          {userAnswer ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 text-white rounded-2xl font-black text-base shadow-xs hover:bg-emerald-600 cursor-pointer transition-all active:scale-95 animate-in zoom-in-90"
              title="Toque para remover"
            >
              <span>{userAnswer}</span>
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <span className="inline-block min-w-[90px] h-9 border-b-4 border-dashed border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg mx-1 animate-pulse" />
          )}

          {afterBlank && <span>{afterBlank.trim()}</span>}
        </div>

        {/* Translation Scaffolding */}
        {(exercise.expectedAnswerPt || exercise.promptTextPt) && (
          <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium italic">
            "{exercise.expectedAnswerPt || exercise.promptTextPt}"
          </p>
        )}
      </div>

      {/* Tactile Option Pills */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-4">
        {options.map((opt, idx) => {
          const isSelected = userAnswer === opt;
          return (
            <button
              key={`${opt}-${idx}`}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={disabled}
              className={`px-5 py-3 rounded-2xl border-2 text-sm sm:text-base font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-600 text-white opacity-40 cursor-default scale-95'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

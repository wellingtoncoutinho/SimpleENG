import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Check, Flame } from 'lucide-react';
import { Exercise, MatchPair } from '../../types/lesson';
import { Language } from '../../utils/i18n';
import { soundEffects, speakWord } from '../../utils/audio';

interface MatchPairsExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (answer: string) => void;
  onSubmit?: () => void;
  lang?: Language;
  disabled?: boolean;
}

interface TileItem {
  id: string; // pairId
  text: string;
  lang: 'en' | 'pt';
}

export const MatchPairsExercise: React.FC<MatchPairsExerciseProps> = ({
  exercise,
  onChangeAnswer,
  onSubmit,
  lang = 'pt',
  disabled = false,
}) => {
  // Pairs from exercise or constructed from targetWords / bank
  const pairs: MatchPair[] = useMemo(() => {
    if (exercise.pairs && exercise.pairs.length > 0) {
      return exercise.pairs.slice(0, 5);
    }
    // Fallback: construct pairs from expected answer or bank
    const list: MatchPair[] = [];
    if (exercise.targetWord) {
      list.push({
        id: 'p1',
        english: exercise.targetWord,
        portuguese: exercise.hintPt || exercise.expectedAnswerPt || 'expressão da aula',
      });
    }
    return list;
  }, [exercise]);

  // Two columns: Left (English), Right (Portuguese), shuffled
  const [leftTiles, setLeftTiles] = useState<TileItem[]>([]);
  const [rightTiles, setRightTiles] = useState<TileItem[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [mismatchPair, setMismatchPair] = useState<{ leftId: string; rightId: string } | null>(null);

  // Initialize and shuffle once
  useEffect(() => {
    const left: TileItem[] = pairs.map((p) => ({
      id: p.id,
      text: p.english,
      lang: 'en',
    })).sort(() => 0.5 - Math.random());

    const right: TileItem[] = pairs.map((p) => ({
      id: p.id,
      text: p.portuguese,
      lang: 'pt',
    })).sort(() => 0.5 - Math.random());

    setLeftTiles(left);
    setRightTiles(right);
    setMatchedPairIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [exercise.id, pairs]);

  // When both sides selected, evaluate match
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    if (selectedLeft === selectedRight) {
      // Correct Match!
      soundEffects.playCorrect();
      setMatchedPairIds((prev) => {
        const next = new Set(prev);
        next.add(selectedLeft);
        if (next.size === pairs.length && pairs.length > 0) {
          onChangeAnswer('completed');
          if (onSubmit) {
            setTimeout(() => onSubmit(), 350);
          }
        }
        return next;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Mismatch
      soundEffects.playIncorrect();
      setMismatchPair({ leftId: selectedLeft, rightId: selectedRight });
      const timer = setTimeout(() => {
        setMismatchPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [selectedLeft, selectedRight, pairs.length, onChangeAnswer]);

  const handleTileClick = (tile: TileItem) => {
    if (disabled || matchedPairIds.has(tile.id)) return;

    if (tile.lang === 'en') {
      soundEffects.playTap();
      speakWord(tile.text);
      setSelectedLeft(tile.id === selectedLeft ? null : tile.id);
    } else {
      soundEffects.playTap();
      setSelectedRight(tile.id === selectedRight ? null : tile.id);
    }
  };

  const isAllMatched = pairs.length > 0 && matchedPairIds.size === pairs.length;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in duration-200">
      {/* Category / Skill Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-4">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>{lang === 'pt' ? 'Minigame: Ligar os Pares' : 'Match the Pairs'}</span>
      </div>

      {/* Main Instruction */}
      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 text-center mb-2">
        {exercise.instructionPt || exercise.instruction || 'Toque nos pares correspondentes para conectá-los:'}
      </h2>

      {/* Progress pill */}
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
        <Flame className="w-3.5 h-3.5 text-amber-500" />
        <span>
          {matchedPairIds.size} de {pairs.length} pares conectados
        </span>
      </div>

      {/* 2-Column Matching Grid */}
      <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {/* Left Column: English */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center">
            Inglês
          </p>
          {leftTiles.map((tile) => {
            const isMatched = matchedPairIds.has(tile.id);
            const isSelected = selectedLeft === tile.id;
            const isError = mismatchPair?.leftId === tile.id;

            return (
              <button
                key={`left-${tile.id}`}
                type="button"
                onClick={() => handleTileClick(tile)}
                disabled={disabled || isMatched}
                className={`w-full min-h-[64px] p-3 rounded-2xl border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                  isMatched
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 opacity-60 cursor-default scale-95 shadow-none'
                    : isError
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 animate-shake'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs active:scale-98'
                }`}
              >
                <span className="leading-snug">{tile.text}</span>
                {isMatched && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Portuguese */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center">
            Português
          </p>
          {rightTiles.map((tile) => {
            const isMatched = matchedPairIds.has(tile.id);
            const isSelected = selectedRight === tile.id;
            const isError = mismatchPair?.rightId === tile.id;

            return (
              <button
                key={`right-${tile.id}`}
                type="button"
                onClick={() => handleTileClick(tile)}
                disabled={disabled || isMatched}
                className={`w-full min-h-[64px] p-3 rounded-2xl border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                  isMatched
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 opacity-60 cursor-default scale-95 shadow-none'
                    : isError
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 animate-shake'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs active:scale-98'
                }`}
              >
                <span className="leading-snug">{tile.text}</span>
                {isMatched && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isAllMatched && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-2 animate-in zoom-in-95">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Todos os pares conectados com perfeição! Clique em "Verificar" para continuar.</span>
        </div>
      )}
    </div>
  );
};

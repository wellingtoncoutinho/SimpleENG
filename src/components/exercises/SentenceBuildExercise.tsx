import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, Snail } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, speakWord, soundEffects } from '../../utils/audio';
import { Language, translations } from '../../utils/i18n';

interface SentenceBuildExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
  lang?: Language;
  disabled?: boolean;
}

interface TileItem {
  id: string;
  word: string;
  isUsed: boolean;
}

export const SentenceBuildExercise: React.FC<SentenceBuildExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  lang = 'pt',
  disabled = false,
}) => {
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [speakingTileId, setSpeakingTileId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);

  const t = translations[lang];
  const audioText = exercise.audioSentence || exercise.expectedAnswer;

  useEffect(() => {
    const bankWords = exercise.wordBank && exercise.wordBank.length > 0
      ? exercise.wordBank
      : exercise.expectedAnswer.split(/\s+/);

    const items: TileItem[] = bankWords.map((word, idx) => ({
      id: `${word}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      word,
      isUsed: false,
    }));

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setTiles(shuffled);
    setSelectedTileIds([]);
    setSpeakingTileId(null);
  }, [exercise.id]);

  const updateAnswer = (newSelectedIds: string[]) => {
    const selectedWords = newSelectedIds
      .map(id => tiles.find(t => t.id === id)?.word)
      .filter(Boolean) as string[];

    const sentence = selectedWords.join(' ');
    onChangeAnswer(sentence);
  };

  const cleanWordForSpeech = (rawWord: string) => {
    return rawWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '').trim();
  };

  const triggerWordAudio = (tileId: string, word: string) => {
    const spoken = cleanWordForSpeech(word);
    if (!spoken) return;

    setSpeakingTileId(tileId);

    speakWord(spoken, () => {
      setSpeakingTileId(null);
    });

    setTimeout(() => {
      setSpeakingTileId((current) => (current === tileId ? null : current));
    }, 700);
  };

  const handleTileClick = (tile: TileItem) => {
    if (disabled || tile.isUsed) return;
    soundEffects.playTap();

    triggerWordAudio(tile.id, tile.word);

    const nextSelected = [...selectedTileIds, tile.id];
    setSelectedTileIds(nextSelected);

    setTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, isUsed: true } : t))
    );

    updateAnswer(nextSelected);
  };

  const handleRemovePlacedTile = (tileId: string) => {
    if (disabled) return;
    soundEffects.playTap();

    const tile = tiles.find(t => t.id === tileId);
    if (tile) {
      triggerWordAudio(tile.id, tile.word);
    }

    const nextSelected = selectedTileIds.filter(id => id !== tileId);
    setSelectedTileIds(nextSelected);

    setTiles(prev =>
      prev.map(t => (t.id === tileId ? { ...t, isUsed: false } : t))
    );

    updateAnswer(nextSelected);
  };

  const handlePronounceOnly = (e: React.MouseEvent, tile: TileItem) => {
    e.stopPropagation();
    soundEffects.playTap();
    triggerWordAudio(tile.id, tile.word);
  };

  const handlePlaySentence = (speed: number = 1.0) => {
    setIsPlayingAudio(true);
    setCurrentSpeed(speed);
    soundEffects.playTap();
    playTextToSpeech(audioText, speed, () => {
      setIsPlayingAudio(false);
    });
  };

  // Auto-play audio on exercise mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlaySentence(1.0);
    }, 350);
    return () => clearTimeout(timer);
  }, [exercise.id]);

  const handleReset = () => {
    if (disabled) return;
    soundEffects.playTap();
    setSelectedTileIds([]);
    setTiles(prev => prev.map(t => ({ ...t, isUsed: false })));
    onChangeAnswer('');
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word Chip */}
      <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 shadow-2xs">
        <span>{t.targetWordLabel}</span>
        <span className="font-extrabold underline decoration-emerald-400">{exercise.targetWord}</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white text-center mb-1 tracking-tight">
        {lang === 'pt' ? (exercise.instructionPt || 'Monte a frase em inglês:') : exercise.instruction}
      </h2>

      {exercise.promptTextPt && (
        <p className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300 text-center mb-2 max-w-lg">
          🇧🇷 {exercise.promptTextPt}
        </p>
      )}

      {/* Audio Playback Controls: Normal (fast) + Snail (slow) like Duolingo */}
      <div className="flex items-center justify-center gap-4 my-3">
        <button
          type="button"
          onClick={() => handlePlaySentence(1.0)}
          className={`relative group flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_5px_0_#047857] active:shadow-[0_1px_0_#047857] active:translate-y-1 transition-all cursor-pointer ${
            isPlayingAudio && currentSpeed === 1.0 ? 'ring-4 ring-emerald-300 ring-offset-2 animate-pulse' : ''
          }`}
          title={t.listenNormalTip}
        >
          <Volume2 className={`w-9 h-9 sm:w-10 sm:h-10 ${isPlayingAudio && currentSpeed === 1.0 ? 'scale-110' : ''}`} />
          {isPlayingAudio && currentSpeed === 1.0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600" />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handlePlaySentence(0.6)}
          className={`group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 border-2 border-amber-300 shadow-[0_4px_0_#d97706] active:shadow-[0_1px_0_#d97706] active:translate-y-1 transition-all cursor-pointer ${
            isPlayingAudio && currentSpeed < 1.0 ? 'ring-4 ring-amber-300 ring-offset-2 animate-pulse' : ''
          }`}
          title={t.listenTurtleTip}
        >
          <Snail className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Assembly Tray */}
      <div className="w-full min-h-[96px] p-4 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-wrap gap-2.5 items-center justify-start mb-3 transition-all shadow-xs">
        {selectedTileIds.length === 0 ? (
          <span className="text-slate-300 dark:text-slate-600 text-sm font-medium italic mx-auto text-center px-4">
            &nbsp;
          </span>
        ) : (
          selectedTileIds.map((tileId) => {
            const tile = tiles.find(t => t.id === tileId);
            if (!tile) return null;
            const isSpeaking = speakingTileId === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleRemovePlacedTile(tile.id)}
                disabled={disabled}
                className={`px-4 py-2.5 font-black text-base rounded-2xl border-2 transition-all cursor-pointer animate-in zoom-in-95 duration-150 flex items-center gap-2 ${
                  isSpeaking
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-400 ring-2 ring-emerald-300 ring-offset-1 shadow-[0_2px_0_#34d399]'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 shadow-[0_3px_0_#6ee7b7] dark:shadow-[0_3px_0_#064e3b] hover:border-rose-400 hover:text-rose-700 hover:bg-rose-50 active:translate-y-0.5'
                }`}
                title="Toque para remover"
              >
                <span>{tile.word}</span>
                {isSpeaking && <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />}
              </button>
            );
          })
        )}
      </div>

      {/* Clear Button */}
      {selectedTileIds.length > 0 && !disabled && (
        <div className="w-full flex justify-end mb-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.clearAll}
          </button>
        </div>
      )}

      {/* Word Bank Container */}
      <div className="w-full p-4 sm:p-5 bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="flex flex-wrap gap-2.5 justify-center">
          {tiles.map((tile) => {
            const isSpeaking = speakingTileId === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile)}
                disabled={disabled || tile.isUsed}
                className={`relative px-4 py-2.5 rounded-2xl font-black text-base transition-all select-none flex items-center gap-1.5 ${
                  tile.isUsed
                    ? 'bg-slate-100 dark:bg-slate-850 text-slate-300 dark:text-slate-600 border-2 border-slate-200 dark:border-slate-800 shadow-none cursor-default'
                    : isSpeaking
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-500 ring-2 ring-emerald-300 ring-offset-1 shadow-[0_2px_0_#10b981] scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 shadow-[0_4px_0_#cbd5e1] dark:shadow-[0_4px_0_#0f172a] hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-750 active:translate-y-1 cursor-pointer'
                }`}
                title="Clique para encaixar e ouvir a pronúncia"
              >
                <span>{tile.word}</span>
                {!tile.isUsed && (
                  <span
                    onClick={(e) => handlePronounceOnly(e, tile)}
                    className="p-0.5 rounded-md hover:bg-emerald-200/60 text-slate-400 hover:text-emerald-700 transition-colors"
                    title="Apenas ouvir a pronúncia"
                  >
                    <Volume2 className={`w-3 h-3 ${isSpeaking ? 'text-emerald-600 animate-ping' : ''}`} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


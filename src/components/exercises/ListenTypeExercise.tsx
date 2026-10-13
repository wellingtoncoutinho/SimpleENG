import React, { useState, useEffect } from 'react';
import { Volume2, Snail, RotateCcw, Keyboard, Grid, Sparkles } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, speakWord, soundEffects } from '../../utils/audio';
import { Language, translations } from '../../utils/i18n';

interface ListenTypeExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  lang?: Language;
  disabled?: boolean;
}

interface TileItem {
  id: string;
  word: string;
  isUsed: boolean;
}

export const ListenTypeExercise: React.FC<ListenTypeExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  onSubmit,
  lang = 'pt',
  disabled = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  // Default to Word Bank mode for friendly Duolingo-style onboarding!
  const [useKeyboard, setUseKeyboard] = useState<boolean>(false);

  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);

  const t = translations[lang];
  const activeInstruction = lang === 'pt' ? (exercise.instructionPt || exercise.instruction) : exercise.instruction;
  const audioText = exercise.audioSentence || exercise.promptText || exercise.expectedAnswer;

  // Initialize word tiles from sentence words + natural distractors
  useEffect(() => {
    const rawWords = exercise.expectedAnswer.split(/\s+/).filter(Boolean);
    // Add common distractors if available in wordBank or generate suitable ones
    const distractors = exercise.wordBank && exercise.wordBank.length > 0
      ? exercise.wordBank.filter(w => !rawWords.includes(w)).slice(0, 3)
      : ['to', 'for', 'the', 'with'].filter(d => !rawWords.map(w => w.toLowerCase()).includes(d)).slice(0, 3);

    const allWords = [...rawWords, ...distractors];

    const items: TileItem[] = allWords.map((word, idx) => ({
      id: `${word}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      word,
      isUsed: false,
    }));

    // Shuffle tiles
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setTiles(shuffled);
    setSelectedTileIds([]);
  }, [exercise.id]);

  const updateAnswerFromTiles = (newSelectedIds: string[]) => {
    const selectedWords = newSelectedIds
      .map(id => tiles.find(t => t.id === id)?.word)
      .filter(Boolean) as string[];

    const sentence = selectedWords.join(' ');
    onChangeAnswer(sentence);
  };

  const cleanWordForSpeech = (rawWord: string) => {
    return rawWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '').trim();
  };

  const handleTileClick = (tile: TileItem) => {
    if (disabled || tile.isUsed) return;
    soundEffects.playTap();

    // Pronounce the word aloud so the learner hears how it speaks!
    const spoken = cleanWordForSpeech(tile.word);
    if (spoken) {
      speakWord(spoken);
    }

    const nextSelected = [...selectedTileIds, tile.id];
    setSelectedTileIds(nextSelected);

    setTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, isUsed: true } : t))
    );

    updateAnswerFromTiles(nextSelected);
  };

  const handleRemovePlacedTile = (tileId: string) => {
    if (disabled) return;
    soundEffects.playTap();

    const tile = tiles.find(t => t.id === tileId);
    if (tile) {
      const spoken = cleanWordForSpeech(tile.word);
      if (spoken) {
        speakWord(spoken);
      }
    }

    const nextSelected = selectedTileIds.filter(id => id !== tileId);
    setSelectedTileIds(nextSelected);

    setTiles(prev =>
      prev.map(t => (t.id === tileId ? { ...t, isUsed: false } : t))
    );

    updateAnswerFromTiles(nextSelected);
  };

  const handleResetTiles = () => {
    if (disabled) return;
    soundEffects.playTap();
    setSelectedTileIds([]);
    setTiles(prev => prev.map(t => ({ ...t, isUsed: false })));
    onChangeAnswer('');
  };

  const handlePlay = (speed: number = 1.0) => {
    setIsPlaying(true);
    setCurrentSpeed(speed);
    soundEffects.playTap();

    playTextToSpeech(audioText, speed, () => {
      setIsPlaying(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlay(1.0);
    }, 400);
    return () => clearTimeout(timer);
  }, [exercise.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userAnswer.trim() && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word Chip */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 shadow-2xs">
        <span>{t.targetWordLabel}</span>
        <span className="font-extrabold underline decoration-emerald-400">{exercise.targetWord}</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center mb-6 tracking-tight">
        {activeInstruction}
      </h2>

      {/* Audio Playback Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => handlePlay(1.0)}
          className={`relative group flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_5px_0_#047857] active:shadow-[0_1px_0_#047857] active:translate-y-1 transition-all cursor-pointer ${
            isPlaying && currentSpeed === 1.0 ? 'ring-4 ring-emerald-300 ring-offset-2 animate-pulse' : ''
          }`}
          title={t.listenNormalTip}
        >
          <Volume2 className={`w-10 h-10 ${isPlaying && currentSpeed === 1.0 ? 'scale-110' : ''}`} />
          {isPlaying && currentSpeed === 1.0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600" />
            </span>
          )}
        </button>

        {exercise.slowSpeedAvailable !== false && (
          <button
            type="button"
            onClick={() => handlePlay(0.6)}
            className={`group flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 border-2 border-amber-300 shadow-[0_4px_0_#d97706] active:shadow-[0_1px_0_#d97706] active:translate-y-1 transition-all cursor-pointer ${
              isPlaying && currentSpeed < 1.0 ? 'ring-4 ring-amber-300 ring-offset-2 animate-pulse' : ''
            }`}
            title={t.listenTurtleTip}
          >
            <Snail className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Mode Switcher: Word Bank (Default) vs Keyboard */}
      <div className="w-full flex justify-end mb-3">
        <button
          type="button"
          onClick={() => {
            soundEffects.playTap();
            setUseKeyboard(!useKeyboard);
          }}
          className="text-xs font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          {useKeyboard ? (
            <>
              <Grid className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'pt' ? 'Usar banco de palavras' : 'Use word bank'}</span>
            </>
          ) : (
            <>
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'pt' ? 'Prefiro digitar' : 'Use keyboard'}</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Mode: Word Bank (Default like Duolingo!) */}
      {!useKeyboard ? (
        <div className="w-full flex flex-col items-center">
          {/* Sentence Tray */}
          <div className="w-full min-h-[90px] p-4 bg-white border-2 border-dashed border-slate-300 rounded-3xl flex flex-wrap gap-2.5 items-center justify-start mb-4 shadow-xs">
            {selectedTileIds.length === 0 ? (
              <span className="text-slate-300 text-sm font-medium italic mx-auto text-center px-4">
                &nbsp;
              </span>
            ) : (
              selectedTileIds.map((tileId) => {
                const tile = tiles.find(t => t.id === tileId);
                if (!tile) return null;
                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => handleRemovePlacedTile(tile.id)}
                    disabled={disabled}
                    className="px-4 py-2.5 bg-emerald-50 text-emerald-950 font-extrabold text-base rounded-2xl border-2 border-emerald-300 shadow-[0_3px_0_#6ee7b7] hover:border-rose-400 hover:text-rose-700 hover:bg-rose-50 active:translate-y-0.5 transition-all cursor-pointer animate-in zoom-in-95 duration-150"
                  >
                    {tile.word}
                  </button>
                );
              })
            )}
          </div>

          {selectedTileIds.length > 0 && !disabled && (
            <div className="w-full flex justify-end mb-3">
              <button
                type="button"
                onClick={handleResetTiles}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t.clearAll}
              </button>
            </div>
          )}

          {/* Word Bank */}
          <div className="w-full p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-black text-slate-400 tracking-wider">
                {t.wordBankTitle}
              </span>
              <span className="text-2xs font-bold text-slate-400 inline-flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-600" />
                {lang === 'pt' ? 'Clique para ouvir' : 'Click to pronounce'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 justify-center">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTileClick(tile)}
                  disabled={disabled || tile.isUsed}
                  className={`px-4 py-2.5 rounded-2xl font-extrabold text-base transition-all select-none ${
                    tile.isUsed
                      ? 'bg-slate-100 text-slate-300 border-2 border-slate-200 shadow-none cursor-default'
                      : 'bg-white text-slate-800 border-2 border-slate-200 shadow-[0_4px_0_#e2e8f0] hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-[0_4px_0_#a7f3d0] active:shadow-[0_1px_0_#e2e8f0] active:translate-y-1 cursor-pointer'
                  }`}
                >
                  {tile.word}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Keyboard input mode */
        <div className="w-full relative">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => onChangeAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={t.typeEnglishPlaceholder}
            autoFocus
            className="w-full text-base sm:text-lg font-bold px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
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
      )}

      <p className="mt-4 text-xs text-slate-500 text-center font-medium">
        {t.listenTypeTip}
      </p>
    </div>
  );
};

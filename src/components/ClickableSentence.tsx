import React, { useState, useRef, useEffect } from 'react';
import { Volume2, X, Sparkles } from 'lucide-react';
import { cleanWord, getWordTranslation } from '../utils/wordTranslations';
import { speakWord, soundEffects } from '../utils/audio';

interface ClickableSentenceProps {
  sentence: string;
  targetVocabMap?: Record<string, string>;
  className?: string;
  wordClassName?: string;
  highlightWord?: string;
}

export const ClickableSentence: React.FC<ClickableSentenceProps> = ({
  sentence,
  targetVocabMap,
  className = '',
  wordClassName = '',
  highlightWord,
}) => {
  const [activeWordData, setActiveWordData] = useState<{
    word: string;
    translation: string;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveWordData(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleWordClick = (
    e: React.MouseEvent<HTMLSpanElement>,
    rawWord: string
  ) => {
    e.stopPropagation();
    const cleaned = cleanWord(rawWord);
    if (!cleaned) return;

    soundEffects.playTap();
    speakWord(cleaned);

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    const translation =
      getWordTranslation(cleaned, targetVocabMap) ||
      'Palavra em contexto (ouça a pronúncia no 🔊)';

    setActiveWordData({
      word: cleaned,
      translation,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
    });
  };

  const handlePlayWordAudio = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    soundEffects.playTap();
    speakWord(word);
  };

  // Tokenize sentence into words and non-words (spaces, punctuation)
  const tokens = sentence.split(/(\s+|[.,!?;:"'()\[\]{}]+)/).filter(Boolean);

  const normHighlight = highlightWord ? cleanWord(highlightWord) : null;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <span className="leading-relaxed inline-block">
        {tokens.map((token, index) => {
          const isWord = /[a-zA-Z0-9]/.test(token);
          if (!isWord) {
            return <span key={index}>{token}</span>;
          }

          const cleaned = cleanWord(token);
          const isTargetHighlight = normHighlight && cleaned === normHighlight;

          return (
            <span
              key={index}
              onClick={(e) => handleWordClick(e, token)}
              className={`inline-block mx-0.5 cursor-pointer rounded-sm border-b border-dashed transition-all select-none hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-0.5 ${
                isTargetHighlight
                  ? 'border-emerald-500 font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40'
                  : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100'
              } ${wordClassName}`}
              title="Toque para ouvir e ver a tradução"
            >
              {token}
            </span>
          );
        })}
      </span>

      {/* Floating Word Translation Popover Tooltip */}
      {activeWordData && (
        <div
          className="absolute z-50 transform -translate-x-1/2 -translate-y-full mb-2 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.max(90, Math.min(activeWordData.x, (containerRef.current?.offsetWidth || 300) - 90))}px`,
            top: `${activeWordData.y - 6}px`,
          }}
        >
          <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-xl border border-slate-700 min-w-[160px] max-w-[240px] text-left relative">
            <div className="flex items-center justify-between gap-2 mb-1 border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-xs text-emerald-400 capitalize flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {activeWordData.word}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handlePlayWordAudio(e, activeWordData.word)}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Ouvir pronúncia"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWordData(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-200 font-medium leading-snug">
              🇧🇷 {activeWordData.translation}
            </p>
            {/* Popover Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
};

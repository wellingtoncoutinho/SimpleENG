import React, { useState } from 'react';
import { Check, X, Lightbulb, ArrowRight, Volume2 } from 'lucide-react';
import { playTextToSpeech, soundEffects } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

export type FeedbackStatus = 'idle' | 'correct' | 'incorrect';

interface FeedbackBannerProps {
  status: FeedbackStatus;
  userAnswer: string;
  expectedAnswer: string;
  explanation: string;
  explanationPt?: string;
  hint: string;
  hintPt?: string;
  lang?: Language;
  onCheck: () => void;
  onContinue: () => void;
  canCheck: boolean;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  status,
  userAnswer,
  expectedAnswer,
  explanation,
  explanationPt,
  hint,
  hintPt,
  lang = 'pt',
  onCheck,
  onContinue,
  canCheck,
}) => {
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const t = translations[lang];
  const activeExplanation = lang === 'pt' ? (explanationPt || explanation) : explanation;
  const activeHint = lang === 'pt' ? (hintPt || hint) : hint;

  const handlePlaySolutionAudio = () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    soundEffects.playTap();
    playTextToSpeech(expectedAnswer, 1.0, () => {
      setIsPlayingAudio(false);
    });
  };

  return (
    <>
      {/* Hint Dialog / Drawer */}
      {showHint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2.5 bg-amber-100 rounded-2xl">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">{t.hintTitle}</h3>
            </div>
            <p className="text-slate-700 text-base leading-relaxed mb-6 font-medium">
              {activeHint || 'Preste atenção na ordem das palavras, na preposição e no contexto.'}
            </p>
            <button
              type="button"
              onClick={() => setShowHint(false)}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-amber-950 font-bold rounded-2xl shadow-[0_4px_0_#d97706] transition-all cursor-pointer text-center"
            >
              {t.hintCloseBtn}
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 transition-all duration-300 pb-safe ${
          status === 'correct'
            ? 'bg-emerald-50 border-emerald-300'
            : status === 'incorrect'
            ? 'bg-rose-50 border-rose-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Message or Hint Button */}
          {status === 'idle' && (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setShowHint(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 rounded-2xl shadow-[0_3px_0_#d97706] active:translate-y-0.5 active:shadow-[0_1px_0_#d97706] transition-all cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-700" />
                <span>{t.hintBtn}</span>
              </button>
              <span className="text-xs text-slate-400 hidden sm:inline font-medium">
                {t.pressEnterToCheck}
              </span>
            </div>
          )}

          {status === 'correct' && (
            <div className="w-full sm:flex-1 flex items-center gap-3 animate-in fade-in duration-200">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-emerald-900 font-black text-lg sm:text-xl tracking-tight leading-tight">
                  {t.correctBannerTitle}
                </h4>
              </div>
            </div>
          )}

          {status === 'incorrect' && (
            <div className="w-full sm:flex-1 flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-rose-900 font-black text-base sm:text-lg tracking-tight">
                    {lang === 'pt' ? 'Você errou. Resposta correta:' : 'Incorrect. Correct answer:'}
                  </h4>
                  <button
                    type="button"
                    onClick={handlePlaySolutionAudio}
                    className="p-1 rounded-md text-rose-700 hover:bg-rose-100 cursor-pointer"
                    title={t.nativePronunciationTip}
                  >
                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
                {/* Clear, highlighted correct phrase */}
                <p className="text-emerald-900 font-extrabold text-sm sm:text-base leading-snug break-words bg-white/70 border border-emerald-200/80 px-3 py-1.5 rounded-xl my-1.5 shadow-2xs">
                  {expectedAnswer}
                </p>
                {/* Minimal breakdown showing where the discrepancy occurred */}
                {userAnswer && (
                  <p className="text-rose-800 text-xs font-semibold leading-tight">
                    <span className="text-rose-500 font-normal">{lang === 'pt' ? 'O que você colocou: ' : 'You answered: '}</span>
                    <span className="line-through text-rose-700">{userAnswer}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="w-full sm:w-auto flex-shrink-0">
            {status === 'idle' ? (
              <button
                type="button"
                onClick={onCheck}
                disabled={!canCheck}
                className={`w-full sm:w-44 py-3.5 px-6 font-black text-base rounded-2xl tracking-wide uppercase transition-all duration-150 ${
                  canCheck
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_5px_0_#059669] active:shadow-[0_1px_0_#059669] active:translate-y-1 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {t.checkBtn}
              </button>
            ) : status === 'correct' ? (
              <button
                type="button"
                onClick={onContinue}
                autoFocus
                className="w-full sm:w-44 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 active:shadow-[0_1px_0_#047857] active:translate-y-1 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#047857] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <span>{t.continueBtn}</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinue}
                autoFocus
                className="w-full sm:w-44 py-3.5 px-6 bg-rose-600 hover:bg-rose-500 active:shadow-[0_1px_0_#be123c] active:translate-y-1 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#be123c] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <span>{t.gotItBtn}</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

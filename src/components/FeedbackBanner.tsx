import React, { useState } from 'react';
import { Check, X, Lightbulb, ArrowRight, Volume2, SkipForward, HelpCircle, RotateCcw } from 'lucide-react';
import { playTextToSpeech, soundEffects } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

import { ExerciseType } from '../types/lesson';
import { RoleplayEvaluation } from '../utils/roleplayEvaluator';

export type FeedbackStatus = 'idle' | 'correct' | 'incorrect' | 'skipped';

interface FeedbackBannerProps {
  status: FeedbackStatus;
  userAnswer: string;
  expectedAnswer: string;
  sentenceTranslation?: string;
  explanation: string;
  explanationPt?: string;
  hint: string;
  hintPt?: string;
  lang?: Language;
  exerciseType?: ExerciseType;
  roleplayEvaluation?: RoleplayEvaluation | null;
  onCheck: () => void;
  onSkip?: () => void;
  onRetry?: () => void;
  onContinue: () => void;
  canCheck: boolean;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  status,
  userAnswer,
  expectedAnswer,
  sentenceTranslation,
  explanation,
  explanationPt,
  hint,
  hintPt,
  lang = 'pt',
  exerciseType,
  roleplayEvaluation,
  onCheck,
  onSkip,
  onRetry,
  onContinue,
  canCheck,
}) => {
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const isRoleplay = exerciseType === 'roleplay_prompt';
  const t = translations[lang];
  const activeExplanation = lang === 'pt' ? (explanationPt || explanation) : explanation;
  const rawHint = lang === 'pt' ? (hintPt || hint) : hint;
  // Clean up hint if raw notes were passed
  const activeHint = rawHint && rawHint.length > 250 ? rawHint.split('\n')[0].slice(0, 200) + '...' : rawHint;

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 dark:border-amber-700 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-2xl">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">{t.hintTitle}</h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mb-6 font-medium">
              {activeHint || 'Preste atenção na ordem das palavras, na preposição e no contexto.'}
            </p>
            <button
              type="button"
              onClick={() => setShowHint(false)}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-2xl shadow-[0_4px_0_#d97706] transition-all cursor-pointer text-center"
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
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
            : status === 'incorrect'
            ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
            : status === 'skipped'
            ? 'bg-sky-50 dark:bg-sky-950/90 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Status Message or Hint & Skip Buttons */}
          {status === 'idle' && (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
              {/* Skip / Don't Know Button */}
              {onSkip && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    onSkip();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs transition-all cursor-pointer"
                  title="Não sei a resposta / Pular este exercício"
                >
                  <SkipForward className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Não sei / Pular</span>
                </button>
              )}

              {/* Hint Button */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setShowHint(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 rounded-2xl shadow-[0_3px_0_#d97706] active:translate-y-0.5 active:shadow-[0_1px_0_#d97706] transition-all cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                <span>{t.hintBtn}</span>
              </button>

              <span className="text-xs text-slate-400 hidden md:inline font-medium ml-1">
                {t.pressEnterToCheck}
              </span>
            </div>
          )}

          {status === 'correct' && (
            <div className="w-full sm:flex-1 flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              {isRoleplay ? (
                <div className="flex-1 min-w-0">
                  <h4 className="text-emerald-900 dark:text-emerald-200 font-black text-base sm:text-lg tracking-tight leading-tight">
                    {roleplayEvaluation?.summaryFeedback || t.correctBannerTitle}
                  </h4>
                  {/* User's sentence & Portuguese gloss */}
                  <div className="mt-1.5 bg-white/80 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl shadow-2xs text-xs sm:text-sm">
                    <p className="text-emerald-950 dark:text-emerald-100 font-bold">
                      💬 Sua resposta: <span className="font-extrabold italic">"{userAnswer}"</span>
                    </p>
                    {roleplayEvaluation?.userSentencePt && (
                      <p className="text-emerald-800 dark:text-emerald-300 text-xs mt-0.5 font-medium">
                        🇧🇷 Tradução aproximada: <span className="italic">"{roleplayEvaluation.userSentencePt}"</span>
                      </p>
                    )}
                  </div>
                  {/* Minor corrections if applicable */}
                  {roleplayEvaluation && roleplayEvaluation.corrections.length > 0 && (
                    <div className="mt-2 space-y-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2 rounded-xl text-xs">
                      {roleplayEvaluation.corrections.map((c, i) => (
                        <p key={i} className="text-amber-900 dark:text-amber-200 font-medium">
                          💡 <span className="font-bold underline">{c.mistake}</span> ➔ <span className="font-bold text-emerald-700 dark:text-emerald-300">{c.fix}</span>: {c.tip}
                        </p>
                      ))}
                    </div>
                  )}
                  {/* Leo's sample answer clearly marked as alternative */}
                  {expectedAnswer && (
                    <div className="mt-2 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                      <span className="font-bold">🦁 Resposta modelo do Leo: </span>
                      <span className="italic">"{expectedAnswer}"</span>
                      {sentenceTranslation && (
                        <span className="opacity-80 block text-2xs sm:text-xs">
                          (Tradução do modelo: "{sentenceTranslation}")
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <h4 className="text-emerald-900 dark:text-emerald-200 font-black text-lg sm:text-xl tracking-tight leading-tight">
                    {t.correctBannerTitle}
                  </h4>
                  {sentenceTranslation && (
                    <p className="text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold mt-1">
                      <span className="opacity-75">🇧🇷 Tradução: </span>
                      <span className="font-bold italic">"{sentenceTranslation}"</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {status === 'incorrect' && (
            <div className="w-full sm:flex-1 flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
              {isRoleplay ? (
                <div className="flex-1 min-w-0">
                  <h4 className="text-rose-900 dark:text-rose-200 font-black text-base sm:text-lg tracking-tight">
                    {roleplayEvaluation?.summaryFeedback || (lang === 'pt' ? 'Atenção aos ajustes da sua frase:' : 'Check the adjustments:')}
                  </h4>
                  {/* Student's answer */}
                  <div className="mt-1.5 bg-white/80 dark:bg-slate-800/80 border border-rose-200 dark:border-rose-800/80 px-3 py-1.5 rounded-xl shadow-2xs text-xs sm:text-sm">
                    <p className="text-rose-950 dark:text-rose-100 font-bold">
                      💬 O que você respondeu: <span className="font-extrabold italic">"{userAnswer}"</span>
                    </p>
                  </div>
                  {/* Detailed Grammar Corrections */}
                  {roleplayEvaluation && roleplayEvaluation.corrections.length > 0 && (
                    <div className="mt-2 space-y-1.5 bg-rose-100/70 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 p-2.5 rounded-xl">
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Ajustes sugeridos pelo Leo:
                      </p>
                      {roleplayEvaluation.corrections.map((c, i) => (
                        <p key={i} className="text-rose-900 dark:text-rose-200 text-xs font-semibold leading-snug">
                          • <span className="font-bold line-through">{c.mistake}</span> ➔ <span className="font-bold text-emerald-700 dark:text-emerald-300">{c.fix}</span>: {c.tip}
                        </p>
                      ))}
                      {roleplayEvaluation.naturalSuggestion && (
                        <div className="mt-1.5 pt-1.5 border-t border-rose-200 dark:border-rose-800">
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                            ✨ Como soaria natural: <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">"{roleplayEvaluation.naturalSuggestion}"</span>
                          </p>
                          {roleplayEvaluation.naturalSuggestionPt && (
                            <p className="text-2xs text-slate-600 dark:text-slate-400 italic font-medium">
                              🇧🇷 ({roleplayEvaluation.naturalSuggestionPt})
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Leo's sample answer clearly marked as alternative */}
                  {expectedAnswer && (
                    <div className="mt-2 text-xs text-rose-900 dark:text-rose-200 font-medium">
                      <span className="font-bold">🦁 Resposta modelo do Leo: </span>
                      <span className="italic">"{expectedAnswer}"</span>
                      {sentenceTranslation && (
                        <span className="opacity-80 block text-2xs sm:text-xs">
                          (Tradução do modelo: "{sentenceTranslation}")
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-rose-900 dark:text-rose-200 font-black text-base sm:text-lg tracking-tight">
                      {lang === 'pt' ? 'Você errou. Resposta correta:' : 'Incorrect. Correct answer:'}
                    </h4>
                    <button
                      type="button"
                      onClick={handlePlaySolutionAudio}
                      className="p-1 rounded-md text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                      title={t.nativePronunciationTip}
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                  {/* Clear, highlighted correct phrase */}
                  <p className="text-emerald-900 dark:text-emerald-200 font-extrabold text-sm sm:text-base leading-snug break-words bg-white/80 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl my-1.5 shadow-2xs">
                    {expectedAnswer}
                  </p>
                  {sentenceTranslation && (
                    <p className="text-rose-900 dark:text-rose-200 text-xs sm:text-sm font-semibold mb-1">
                      <span className="opacity-75">🇧🇷 Tradução: </span>
                      <span className="font-bold italic">"{sentenceTranslation}"</span>
                    </p>
                  )}
                  {/* Minimal breakdown showing user's answer */}
                  {userAnswer && (
                    <p className="text-rose-800 dark:text-rose-300 text-xs font-semibold leading-tight">
                      <span className="text-rose-500 font-normal">{lang === 'pt' ? 'O que você colocou: ' : 'You answered: '}</span>
                      <span className="line-through text-rose-700 dark:text-rose-400">{userAnswer}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {status === 'skipped' && (
            <div className="w-full sm:flex-1 flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
                <HelpCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              {isRoleplay ? (
                <div className="flex-1 min-w-0">
                  <h4 className="text-sky-900 dark:text-sky-200 font-black text-base sm:text-lg tracking-tight">
                    {lang === 'pt' ? 'Tudo bem pular! Veja a resposta modelo para aprender:' : "That's okay! Here is a model answer to learn:"}
                  </h4>
                  {expectedAnswer && (
                    <div className="mt-1.5 p-3 bg-white/80 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800/80 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                          🦁 Sugestão do Leo:
                        </span>
                        <button
                          type="button"
                          onClick={handlePlaySolutionAudio}
                          className="p-1 rounded-md text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer"
                          title={t.nativePronunciationTip}
                        >
                          <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                      <p className="text-sky-950 dark:text-sky-100 font-extrabold text-sm sm:text-base leading-snug">
                        "{expectedAnswer}"
                      </p>
                      {sentenceTranslation && (
                        <p className="text-sky-900 dark:text-sky-300 text-xs mt-1 font-medium">
                          🇧🇷 <span className="italic">"{sentenceTranslation}"</span>
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed mt-2">
                    💡 {lang === 'pt' ? 'Dica do Leo: Em diálogos livres, você pode responder de forma curta e direta usando a palavra obrigatória.' : 'Tip: Keep your answer short and natural including the required word.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sky-900 dark:text-sky-200 font-black text-base sm:text-lg tracking-tight">
                      {lang === 'pt' ? 'Tudo bem! Veja a resposta para aprender:' : "That's okay! Here is the answer to learn:"}
                    </h4>
                    <button
                      type="button"
                      onClick={handlePlaySolutionAudio}
                      className="p-1 rounded-md text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer"
                      title={t.nativePronunciationTip}
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                  {/* Highlighted expected answer */}
                  <p className="text-sky-950 dark:text-sky-100 font-extrabold text-sm sm:text-base leading-snug break-words bg-white/80 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800/80 px-3 py-1.5 rounded-xl my-1.5 shadow-2xs">
                    {expectedAnswer}
                  </p>
                  {sentenceTranslation && (
                    <p className="text-sky-900 dark:text-sky-200 text-xs sm:text-sm font-semibold mb-1">
                      <span className="opacity-75">🇧🇷 Tradução: </span>
                      <span className="font-bold italic">"{sentenceTranslation}"</span>
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed mt-1">
                    💡 {lang === 'pt' ? 'Dica: Toque no alto-falante acima para ouvir com calma. Essa frase voltará nos seus treinos para você dominar!' : 'Tip: Tap the speaker above to hear pronunciation. This phrase will reappear in your practice!'}
                  </p>
                </div>
              )}
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
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
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
            ) : status === 'skipped' ? (
              <button
                type="button"
                onClick={onContinue}
                autoFocus
                className="w-full sm:w-44 py-3.5 px-6 bg-sky-600 hover:bg-sky-500 active:shadow-[0_1px_0_#0369a1] active:translate-y-1 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#0369a1] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <span>{t.continueBtn}</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            ) : (
              <div className="w-full sm:w-auto flex items-center gap-2 sm:gap-3">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="flex-1 sm:flex-initial sm:w-36 py-3 px-3 sm:px-4 bg-white hover:bg-rose-50 text-rose-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-700 font-extrabold text-xs sm:text-sm rounded-2xl shadow-[0_4px_0_#fda4af] dark:shadow-[0_4px_0_#881337] active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                    title="Tentar responder novamente este exercício"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tentar de novo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onContinue}
                  autoFocus
                  className="flex-1 sm:flex-initial sm:w-36 py-3 px-3 sm:px-4 bg-rose-600 hover:bg-rose-500 active:shadow-[0_1px_0_#be123c] active:translate-y-1 text-white font-black text-xs sm:text-sm rounded-2xl shadow-[0_5px_0_#be123c] transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wide uppercase"
                >
                  <span>{t.gotItBtn}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

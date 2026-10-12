import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, CheckCircle2, AlertTriangle, RotateCcw, PlusCircle, Volume2, Copy, Check } from 'lucide-react';
import { LessonPayload } from '../types/lesson';
import { LearnerMascot } from './LearnerMascot';
import { playTextToSpeech, soundEffects } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

interface LessonCompleteProps {
  lesson: LessonPayload;
  stats: {
    totalExercises: number;
    correctCount: number;
    incorrectCount: number;
    xpEarned: number;
  };
  lang?: Language;
  onRestart: () => void;
  onCreateNew: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({
  lesson,
  stats,
  lang = 'pt',
  onRestart,
  onCreateNew,
}) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const t = translations[lang];

  useEffect(() => {
    soundEffects.playFanfare();

    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const accuracy = Math.round(
    (stats.correctCount / Math.max(1, stats.totalExercises)) * 100
  );

  const handlePronounceWord = (word: string) => {
    if (playingWord === word) return;
    setPlayingWord(word);
    soundEffects.playTap();
    playTextToSpeech(word, 0.9, () => {
      setPlayingWord(null);
    });
  };

  const takeaways = lang === 'pt' && lesson.reviewSummary.keyTakeawaysPt?.length
    ? lesson.reviewSummary.keyTakeawaysPt
    : lesson.reviewSummary.keyTakeaways;

  const pitfalls = lang === 'pt' && lesson.reviewSummary.commonPitfallsToAvoidPt?.length
    ? lesson.reviewSummary.commonPitfallsToAvoidPt
    : lesson.reviewSummary.commonPitfallsToAvoid;

  const handleCopySummary = () => {
    const text = `SimpleENG - Resumo da Lição: ${lesson.moduleMeta.topic} (${lesson.moduleMeta.targetLevel})
Vocabulário: ${lesson.moduleMeta.wordsCovered.join(', ')}

Regras & Dicas Principais:
${takeaways.map(takeaway => `- ${takeaway}`).join('\n')}

Erros para Evitar:
${pitfalls.map(p => `- ${p}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center animate-in fade-in duration-300">
      {/* Celebrating Mascot Leo */}
      <div className="mb-4">
        <LearnerMascot
          mood="celebrate"
          size="lg"
          speechText={t.engySpeechComplete}
        />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight text-center mb-1">
        {t.lessonCompleteTitle}
      </h1>
      <p className="text-base font-semibold text-emerald-600 mb-6 text-center">
        {lesson.moduleMeta.topic} · Nível {lesson.moduleMeta.targetLevel}
      </p>

      {/* Stats Cards */}
      <div className="w-full grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-xs uppercase font-extrabold text-slate-400 mb-1">{t.accuracyLabel}</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{accuracy}%</div>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-xs uppercase font-extrabold text-slate-400 mb-1">{t.xpEarnedLabel}</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center justify-center gap-1">
            <Sparkles className="w-5 h-5 fill-amber-400" />
            <span>+{stats.xpEarned}</span>
          </div>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-xs uppercase font-extrabold text-slate-400 mb-1">{t.durationLabel}</div>
          <div className="text-2xl sm:text-3xl font-black text-sky-600">
            ~{lesson.moduleMeta.estimatedDurationMinutes}m
          </div>
        </div>
      </div>

      {/* Words Mastered Chips */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 mb-6 shadow-xs">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>{t.wordsCoveredTitle} ({lesson.moduleMeta.wordsCovered.length})</span>
          <span className="text-xs font-semibold text-slate-400 normal-case">{t.tapToHearAudio}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {lesson.moduleMeta.wordsCovered.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => handlePronounceWord(word)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-sm transition-all cursor-pointer shadow-2xs group"
            >
              <Volume2 className={`w-4 h-4 text-emerald-600 group-hover:scale-110 ${playingWord === word ? 'animate-bounce' : ''}`} />
              <span>{word}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Review Summary: Key Takeaways & Pitfalls */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Key Takeaways */}
        <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-sm mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{t.keyTakeawaysTitle}</span>
          </div>
          <ul className="space-y-2">
            {takeaways.map((takeaway, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pitfalls to Avoid */}
        <div className="bg-rose-50/70 border-2 border-rose-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-black text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{t.pitfallsTitle}</span>
          </div>
          <ul className="space-y-2">
            {pitfalls.map((pitfall, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full sm:flex-1 py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:translate-y-1 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#059669] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{t.newLessonBtn}</span>
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="w-full sm:w-auto py-4 px-6 bg-white hover:bg-slate-50 active:translate-y-1 text-slate-700 font-bold text-base rounded-2xl border-2 border-slate-300 shadow-[0_4px_0_#cbd5e1] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{t.practiceAgainBtn}</span>
        </button>
      </div>

      {/* Share / Export Bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopySummary}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t.notesCopied : t.copyNotesBtn}</span>
        </button>
      </div>
    </div>
  );
};

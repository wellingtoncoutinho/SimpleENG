import React, { useState } from 'react';
import { Plus, X, Zap, RefreshCw, Wand2, ClipboardList, Settings2, Calendar, Lightbulb } from 'lucide-react';
import { LessonGenerationInput, LessonPayload } from '../types/lesson';
import { UserProfile } from '../types/user';
import { PRESET_LESSONS } from '../data/presetLessons';
import { LearnerMascot } from './LearnerMascot';
import { soundEffects } from '../utils/audio';
import { parseClassNotes } from '../utils/noteParser';
import { buildCustomLesson } from '../utils/curriculumBuilder';
import { Language, translations } from '../utils/i18n';

interface LessonGeneratorProps {
  user: UserProfile;
  onStartLesson: (lesson: LessonPayload) => void;
  onOpenProfile: () => void;
  onSwitchToWeeklyPlanner?: () => void;
  lang?: Language;
}

export const LessonGenerator: React.FC<LessonGeneratorProps> = ({
  user,
  onStartLesson,
  onOpenProfile,
  onSwitchToWeeklyPlanner,
  lang = 'pt',
}) => {
  const t = translations[lang];
  const [topic, setTopic] = useState<string>('');
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [newWordInput, setNewWordInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteAreaText, setPasteAreaText] = useState<string>('');

  const handleUseExample = () => {
    soundEffects.playTap();
    setTopic('Job Interview & Expressões Profissionais');
    setTargetWords(['flabbergasted', 'seamless', 'schedule', 'take for granted']);
    setNotes('Dificuldade com collocations de trabalho e preposições.');
  };

  // Function to process words (handles single words, notes with translations/pronunciations, comma lists, lines)
  const processAndAddWords = (rawText: string) => {
    if (!rawText.trim()) return;

    const parsed = parseClassNotes(rawText);
    const wordsFromParsed = parsed.map((p) => p.english);

    const tokensToAdd =
      wordsFromParsed.length > 0
        ? wordsFromParsed
        : rawText
            .split(/[\n,;•·\t]+/)
            .map((w) => w.replace(/^[-*0-9.)\s]+/, '').trim())
            .filter((w) => w.length > 0);

    if (tokensToAdd.length === 0) return;

    soundEffects.playTap();
    setTargetWords((prev) => {
      const combined = [...prev, ...tokensToAdd];
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const item of combined) {
        const lower = item.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(item);
        }
      }
      return unique;
    });

    const extraNotes = parsed
      .filter((p) => p.note || p.portuguese)
      .map((p) => `${p.english}: ${p.portuguese || ''} ${p.note ? `(${p.note})` : ''}`)
      .join('; ');

    if (extraNotes && !notes.trim()) {
      setNotes(extraNotes);
    }
  };

  const handleAddSingleOrSeparated = () => {
    processAndAddWords(newWordInput);
    setNewWordInput('');
  };

  const handleRemoveWord = (wordToRemove: string) => {
    soundEffects.playTap();
    setTargetWords((prev) => prev.filter((w) => w !== wordToRemove));
  };

  const handleApplyPasteModal = () => {
    processAndAddWords(pasteAreaText);
    setPasteAreaText('');
    setShowPasteModal(false);
  };

  const handleLoadPreset = (preset: (typeof PRESET_LESSONS)[0]) => {
    soundEffects.playTap();
    setTopic(preset.topic);
    setTargetWords([...preset.words]);
    setNotes(preset.data.moduleMeta?.topic || '');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Por favor, informe o assunto da aula.');
      return;
    }
    if (targetWords.length === 0) {
      setErrorMsg('Adicione pelo menos 1 palavra ou expressão da sua aula.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    soundEffects.playTap();

    const payloadInput: LessonGenerationInput = {
      topic: topic.trim(),
      level: user.level,
      targetWords,
      notes: notes.trim(),
      language: lang,
    };

    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadInput),
      });

      if (res.ok) {
        const generatedLesson: LessonPayload = await res.json();
        setIsGenerating(false);
        onStartLesson(generatedLesson);
        return;
      }
    } catch (err: any) {
      console.warn('API call encountered issue, switching to robust local generator:', err);
    }

    // High-quality local builder fallback (Guarantees zero downtime, never shows 500 error!)
    try {
      const items = targetWords.map((w, idx) => ({
        id: `vocab_${idx}`,
        english: w,
      }));
      const fallbackLesson = buildCustomLesson(
        topic.trim(),
        user.level,
        items,
        notes.trim()
      );
      setIsGenerating(false);
      onStartLesson(fallbackLesson);
    } catch (fallbackErr: any) {
      console.error('Local builder fallback error:', fallbackErr);
      const matchedPreset = PRESET_LESSONS.find(
        (p) => p.topic.toLowerCase() === topic.toLowerCase()
      );
      if (matchedPreset) {
        setIsGenerating(false);
        onStartLesson(matchedPreset.data);
      } else {
        setIsGenerating(false);
        setErrorMsg('Não foi possível gerar a lição. Tente novamente.');
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in">
      {/* Clean Welcome Banner */}
      <div className="flex items-center justify-between gap-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs mb-6 relative overflow-hidden">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-full mb-2 border border-amber-200/80 dark:border-amber-800">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.navQuickPractice}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1.5">
            {t.generatorTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-4">
            {t.generatorSubtitle}
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t.levelLabel}:</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              {user.level}
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <Settings2 className="w-3 h-3" />
              <span>{t.changePlan}</span>
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 hidden sm:block">
          <LearnerMascot mood={isGenerating ? 'thinking' : 'happy'} size="sm" />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs mb-8 space-y-5">
        {/* 1. Class Topic */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.customTopicLabel}
            </label>
            <button
              type="button"
              onClick={handleUseExample}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Preencher exemplo</span>
            </button>
          </div>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.customTopicPlaceholder}
            className="w-full text-sm font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* 2. Target Words */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. Palavras & Expressões ({targetWords.length})
            </label>
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Colar Lista</span>
            </button>
          </div>

          {/* Chips container */}
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl min-h-[56px] items-center mb-3">
            {targetWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs group"
              >
                <span>{word}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word)}
                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                  title="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {targetWords.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Nenhuma palavra adicionada. Digite uma abaixo e aperte Enter!
              </span>
            )}
          </div>

          {/* Quick Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWordInput}
              onChange={(e) => setNewWordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSingleOrSeparated();
                }
              }}
              placeholder="Digite uma palavra ou várias separadas por vírgula..."
              className="flex-1 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddSingleOrSeparated}
              className="py-2.5 px-4 btn-3d-slate font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* 3. Class Notes */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            3. Anotações ou Dificuldades <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Confundi a pronúncia, esqueci a preposição..."
            className="w-full text-xs sm:text-sm font-medium p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden transition-all resize-none"
          />
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Action Button: Generate */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-3.5 px-6 text-white font-black text-sm rounded-2xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
            isGenerating
              ? 'bg-emerald-400 cursor-wait'
              : 'btn-3d-green shadow-xs'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{t.generatingLesson}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>{t.startQuickLesson}</span>
            </>
          )}
        </button>
      </div>

      {/* Quick 1-Click Presets */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.quickPresetsTitle}</span>
          </span>
          <span className="text-[11px] text-slate-400">1-clique para carregar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_LESSONS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-2xl text-left shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {preset.level}
                </span>
                <span className="text-[10px] text-slate-400">{preset.words.length} palavras</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-snug group-hover:text-emerald-600">
                {preset.title}
              </h4>
            </button>
          ))}
        </div>
      </div>

      {/* Paste Multi-line List Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Colar Lista de Vocabulário
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              Cole palavras ou expressões da sua aula (separadas por linha ou vírgula).
            </p>
            <textarea
              rows={5}
              value={pasteAreaText}
              onChange={(e) => setPasteAreaText(e.target.value)}
              placeholder={`fall for\ntake for granted\ncrush\nghost someone`}
              className="w-full text-xs font-semibold p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 outline-none resize-none mb-4 font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyPasteModal}
                disabled={!pasteAreaText.trim()}
                className="px-5 py-2 btn-3d-green text-white text-xs font-black rounded-xl"
              >
                Importar Palavras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

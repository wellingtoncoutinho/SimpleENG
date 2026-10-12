import React, { useState } from 'react';
import { Plus, X, Zap, RefreshCw, Wand2, ClipboardList, Settings2, Calendar } from 'lucide-react';
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

  const [topic, setTopic] = useState<string>(
    lang === 'pt' ? 'Relacionamentos & Namoro Moderno' : 'Relationships & Modern Dating'
  );
  const [targetWords, setTargetWords] = useState<string[]>([
    'fall for',
    'take for granted',
    'crush',
    'ghost someone',
    'commitment',
  ]);
  const [newWordInput, setNewWordInput] = useState<string>('');
  const [notes, setNotes] = useState<string>(
    lang === 'pt'
      ? 'Tive dificuldade de usar "take for granted" com pronomes e confundi as preposições em "fall for".'
      : 'Had trouble using "take for granted" with objects/pronouns, and confused prepositions with "fall for".'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteAreaText, setPasteAreaText] = useState<string>('');

  // Function to process words (handles single words, notes with translations/pronunciations, comma lists, lines)
  const processAndAddWords = (rawText: string) => {
    if (!rawText.trim()) return;

    // Use intelligent parser that extracts English words even from lines like:
    // "schedule - agendar / eskedul - confundi na aula"
    const parsed = parseClassNotes(rawText);
    const wordsFromParsed = parsed.map((p) => p.english);

    // If parser found words, add them
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

    // If user pasted notes with explanations, also append any detected notes to the notes box!
    const extraNotes = parsed
      .filter((p) => p.note || p.portuguese)
      .map((p) => `${p.english}: ${p.portuguese || ''} ${p.note ? `(${p.note})` : ''}`)
      .join('; ');

    if (extraNotes && (!notes.trim() || notes.includes('Tive dificuldade'))) {
      setNotes(extraNotes);
    }
  };

  const handleAddSingleOrSeparated = () => {
    processAndAddWords(newWordInput);
    setNewWordInput('');
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setTargetWords((prev) => prev.filter((w) => w !== wordToRemove));
    soundEffects.playTap();
  };

  const handleApplyPasteModal = () => {
    processAndAddWords(pasteAreaText);
    setPasteAreaText('');
    setShowPasteModal(false);
  };

  const handleLoadPreset = (preset: typeof PRESET_LESSONS[0]) => {
    soundEffects.playTap();
    setTopic(preset.topic);
    setTargetWords(preset.words);
    setNotes(lang === 'pt' ? preset.notes : preset.notesEn);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg(
        lang === 'pt'
          ? 'Por favor, informe o assunto da sua aula.'
          : 'Please specify the topic of your class.'
      );
      return;
    }
    if (targetWords.length === 0) {
      setErrorMsg(
        lang === 'pt'
          ? 'Adicione pelo menos 1 ou 2 palavras da sua aula.'
          : 'Please add at least 1 or 2 target vocabulary items.'
      );
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    soundEffects.playTap();

    try {
      const payloadInput: LessonGenerationInput = {
        topic: topic.trim(),
        level: user.level, // Automatically takes the user's saved profile level!
        targetWords,
        notes: notes.trim(),
        language: lang,
      };

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
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in">
      {/* Clean Welcome Banner with User Mascot */}
      <div className="flex items-center justify-between gap-6 bg-white border-2 border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs mb-8 relative overflow-hidden">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
            {lang === 'pt' ? `Olá, ${user.name}!` : `Hey, ${user.name}!`}
          </h1>
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
            {lang === 'pt'
              ? 'O que você estudou na sua última aula particular de inglês? Monte um treino sob medida para fixar!'
              : 'What did you cover in your private English lesson? Turn your raw notes into an interactive workout!'}
          </p>

          {/* User Level Pill with Quick Change link */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all">
            <span>{lang === 'pt' ? 'Seu Nível:' : 'Your Level:'}</span>
            <span className="font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              {user.level}
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <Settings2 className="w-3 h-3" />
              <span>{lang === 'pt' ? 'Alterar' : 'Change'}</span>
            </button>
          </div>

          {onSwitchToWeeklyPlanner && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onSwitchToWeeklyPlanner}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-black text-emerald-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ver Minha Programação Semanal (20 min/dia)</span>
              </button>
            </div>
          )}
        </div>

        {/* User Mascot Avatar (boy with headphones) */}
        <div className="flex-shrink-0">
          <LearnerMascot mood={isGenerating ? 'thinking' : 'happy'} size="sm" />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs mb-8 space-y-6">
        {/* 1. Class Topic */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            {lang === 'pt' ? '1. Assunto da Aula' : '1. Class Topic'}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              lang === 'pt'
                ? 'Ex: Relacionamentos, Entrevista de Emprego, Viagem...'
                : 'e.g., Job Interview, Airport Logistics...'
            }
            className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* 2. Target Words & Multiple / Batch Paste */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
              {lang === 'pt'
                ? `2. Vocabulário & Expressões (${targetWords.length})`
                : `2. Target Vocabulary (${targetWords.length})`}
            </label>
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{lang === 'pt' ? 'Colar Lista Pronta' : 'Paste List'}</span>
            </button>
          </div>

          {/* Chips container */}
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-2 border-slate-200/90 rounded-2xl min-h-[56px] items-center mb-3">
            {targetWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 font-bold text-sm rounded-xl border border-slate-200 shadow-2xs group"
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
                {lang === 'pt'
                  ? 'Nenhuma palavra adicionada. Digite uma ou cole sua lista abaixo!'
                  : 'No words yet. Add individual words or paste your list below!'}
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
              placeholder={
                lang === 'pt'
                  ? 'Digite palavras separadas por vírgula ou aperte Enter...'
                  : 'Type words separated by comma or press Enter...'
              }
              className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none text-slate-800"
            />
            <button
              type="button"
              onClick={handleAddSingleOrSeparated}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'pt' ? 'Adicionar' : 'Add'}</span>
            </button>
          </div>
          <p className="text-2xs text-slate-400 mt-1.5 font-medium">
            {lang === 'pt'
              ? 'Dica: Você pode digitar várias palavras separadas por vírgula (ex: fall for, commitment, ghost someone).'
              : 'Tip: You can type multiple words separated by commas.'}
          </p>
        </div>

        {/* 3. Class Notes & Errors */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            {lang === 'pt'
              ? '3. Anotações da Aula & Suas Dificuldades'
              : '3. Class Notes & Pain Points'}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              lang === 'pt'
                ? 'Ex: Confundi as preposições em "fall for", esqueci onde colocar o pronome em "take for granted", etc.'
                : 'e.g., Confused prepositions with "fall for", struggled with word order...'
            }
            className="w-full text-sm font-medium p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-slate-800 resize-none"
          />
        </div>

        {errorMsg && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs sm:text-sm text-amber-900 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Action Button: Generate */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-4 px-6 text-white font-black text-base sm:text-lg rounded-2xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
            isGenerating
              ? 'bg-emerald-400 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_5px_0_#047857] active:shadow-[0_1px_0_#047857] active:translate-y-1'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>
                {lang === 'pt' ? 'Montando seu Treino Prático...' : 'Assembling Your Practice...'}
              </span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>
                {lang === 'pt' ? 'Iniciar Treino com a Minha Aula' : 'Start Lesson Workout'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Quick 1-Click Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {lang === 'pt' ? 'Exemplos Prontos' : 'Instant Presets'}
          </span>
          <span className="text-2xs text-slate-400">1-clique para carregar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_LESSONS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-400 rounded-2xl text-left shadow-2xs hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {preset.level}
                </span>
                <span className="text-2xs text-slate-400">{preset.words.length} palavras</span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug group-hover:text-emerald-700">
                {lang === 'pt' ? preset.title : preset.titleEn}
              </h4>
            </button>
          ))}
        </div>
      </div>

      {/* Paste Multi-line List Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">
                {lang === 'pt' ? 'Colar Lista de Vocabulário' : 'Paste Vocabulary List'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
              {lang === 'pt'
                ? 'Cole aqui palavras ou expressões da sua aula (separadas por vírgula, ponto e vírgula ou uma por linha). O site vai separar certinho automaticamente!'
                : 'Paste words or expressions from your notes (separated by commas, semicolons or line breaks).'}
            </p>
            <textarea
              rows={6}
              value={pasteAreaText}
              onChange={(e) => setPasteAreaText(e.target.value)}
              placeholder={`fall for\ntake for granted\ncrush\nghost someone\ncommitment`}
              className="w-full text-sm font-semibold p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 outline-none resize-none mb-4 font-mono text-slate-800"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {lang === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplyPasteModal}
                disabled={!pasteAreaText.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
              >
                {lang === 'pt' ? 'Importar Palavras' : 'Import Words'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

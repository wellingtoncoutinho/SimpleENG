import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  BookOpen,
  Volume2,
  AlertCircle,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { WeeklyPlan, ParsedVocabularyItem } from '../types/weeklyPlan';
import { UserProfile } from '../types/user';
import { LearnerMascot } from './LearnerMascot';
import { parseClassNotes } from '../utils/noteParser';
import { buildWeeklyPlan } from '../utils/curriculumBuilder';
import { soundEffects, speakWord } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

interface WeeklyPlanCreatorProps {
  user: UserProfile;
  lang?: Language;
  onPlanCreated: (plan: WeeklyPlan) => void;
  onCancel?: () => void;
}

const CLASS_DAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const DAILY_TIME_OPTIONS = [
  { minutes: 10, label: '10 min/dia (2 blocos de 5 min)' },
  { minutes: 15, label: '15 min/dia (3 blocos de 5 min)' },
  { minutes: 20, label: '20 min/dia (4 blocos de 5 min) - Recomendado' },
  { minutes: 30, label: '30 min/dia (6 blocos de 5 min)' },
];

const SAMPLE_NOTES = `schedule - agendar / eskedul - confundi com timetable na aula
actually - na verdade (não é atualmente) / actshually
look forward to - aguardar ansiosamente (+ verb-ing)
overwhelmed - sobrecarregado / ouver-uelmd
put off - adiar / post-pone
take for granted - dar como certo (cuidado com pronomes no meio)
commitment - compromisso sério`;

export const WeeklyPlanCreator: React.FC<WeeklyPlanCreatorProps> = ({
  user,
  lang = 'pt',
  onPlanCreated,
  onCancel,
}) => {
  const [topic, setTopic] = useState<string>('');
  const [classDay, setClassDay] = useState<string>(user.classDay || 'Quarta-feira');
  const [dailyMinutes, setDailyMinutes] = useState<number>(user.dailyMinutesGoal || 20);
  const [rawNotes, setRawNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live parsed items as the user types/pastes
  const parsedItems: ParsedVocabularyItem[] = React.useMemo(() => {
    return parseClassNotes(rawNotes);
  }, [rawNotes]);

  const handleUseExample = () => {
    soundEffects.playTap();
    setTopic('Trabalho, Reuniões & Prazos');
    setRawNotes(SAMPLE_NOTES);
  };

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      setStatusMessage('Por favor, informe o tema ou assunto principal da sua aula.');
      return;
    }
    if (parsedItems.length === 0) {
      setStatusMessage('Adicione pelo menos 1 ou 2 palavras/anotações da sua aula no campo abaixo.');
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);
    soundEffects.playTap();

    try {
      const response = await fetch('/api/generate-weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level: user.level,
          rawNotes,
          parsedItems,
          classDay,
          dailyMinutesGoal: dailyMinutes,
          language: lang,
        }),
      });

      if (response.ok) {
        const plan: WeeklyPlan = await response.json();
        setIsGenerating(false);
        onPlanCreated(plan);
        return;
      }
      console.warn('API returned non-ok, using fallback curriculum builder');
    } catch (err) {
      console.warn('Weekly plan API failed, using resilient local builder:', err);
    }

    // High-quality local builder fallback (never fails, instant, 100% reliable)
    const fallbackPlan = buildWeeklyPlan(
      topic.trim(),
      user.level,
      parsedItems,
      classDay,
      dailyMinutes,
      rawNotes
    );

    setIsGenerating(false);
    onPlanCreated(fallbackPlan);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs mb-6 flex items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full mb-2.5 border border-emerald-200/80 dark:border-emerald-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Novo Roteiro de Estudos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1.5">
            Cadastrar Anotações da Aula
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
            Cole as palavras, frases ou correções da sua última aula de conversação. O SimpleENG vai montar um ciclo de 7 dias com exercícios interativos e práticos.
          </p>
        </div>

        <div className="flex-shrink-0 hidden md:block">
          <LearnerMascot mood={isGenerating ? 'thinking' : 'speaking'} size="sm" />
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs mb-6 space-y-5">
        {/* 1. Class Topic */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            1. Tema ou Assunto da Aula
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Job Interview, Conversa sobre Viagem, Tecnologia no Trabalho..."
            className="w-full text-sm font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* 2. Class Day & Daily Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              2. Dia da sua Aula de Inglês
            </label>
            <select
              value={classDay}
              onChange={(e) => setClassDay(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold px-3.5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
            >
              {CLASS_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              3. Meta Diária de Treino
            </label>
            <select
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              className="w-full text-xs sm:text-sm font-bold px-3.5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
            >
              {DAILY_TIME_OPTIONS.map((opt) => (
                <option key={opt.minutes} value={opt.minutes}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Class Notes Box */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              4. Anotações & Vocabulário ({parsedItems.length} detectados)
            </label>
            <button
              type="button"
              onClick={handleUseExample}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Inserir exemplo para teste</span>
            </button>
          </div>

          <textarea
            rows={6}
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder={`Digite ou cole aqui como anotou no caderno.\n\nExemplo:\nschedule - agendar / eskedul - confundi com timetable na aula\nactually - na verdade (não é atualmente)\nlook forward to - aguardar ansiosamente\noverwhelmed - sobrecarregado`}
            className="w-full text-sm font-mono p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />

          {/* Live recognition preview */}
          {parsedItems.length > 0 && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Vocabulário identificado:</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  {parsedItems.length} termos prontos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          {item.english}
                        </span>
                        {item.pronunciation && (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                            /{item.pronunciation}/
                          </span>
                        )}
                      </div>
                      {item.portuguese && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {item.portuguese}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => speakWord(item.english)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      title="Ouvir pronúncia"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {statusMessage && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs sm:text-sm text-amber-900 dark:text-amber-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className={`flex-1 py-3.5 px-6 text-white font-black text-xs sm:text-sm rounded-2xl tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isGenerating
                ? 'bg-emerald-400 cursor-wait'
                : 'btn-3d-green shadow-xs'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gerando seu plano de 7 dias com a IA do Simple...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Gerar Plano de 7 Dias ({dailyMinutes} min/dia)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

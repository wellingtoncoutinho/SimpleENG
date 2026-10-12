import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Wand2,
  BookOpen,
  Volume2,
  Trash2,
  Plus,
  HelpCircle,
  AlertCircle,
  FileText,
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
  const t = translations[lang];

  const [topic, setTopic] = useState<string>('Reuniões, Prazos & Rotina de Trabalho');
  const [classDay, setClassDay] = useState<string>(user.classDay || 'Quarta-feira');
  const [dailyMinutes, setDailyMinutes] = useState<number>(user.dailyMinutesGoal || 20);
  const [rawNotes, setRawNotes] = useState<string>(SAMPLE_NOTES);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live parsed items as the user types/pastes
  const parsedItems: ParsedVocabularyItem[] = React.useMemo(() => {
    return parseClassNotes(rawNotes);
  }, [rawNotes]);

  const handleUseExample = () => {
    soundEffects.playTap();
    setTopic('Relacionamentos, Conversas & Socialização');
    setRawNotes(`crush - paixonite / krash
fall for - se apaixonar por (errei preposição)
ghost someone - sumir sem avisar
take for granted - não valorizar
commitment - compromisso
put off - adiar a conversa`);
  };

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      setStatusMessage('Por favor, informe o assunto principal da sua aula.');
      return;
    }
    if (parsedItems.length === 0) {
      setStatusMessage('Adicione pelo menos 1 ou 2 palavras/anotações da sua aula.');
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);
    soundEffects.playTap();

    try {
      // First attempt server endpoint with clean payload
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
      // If server returned non-ok, fallback to local builder
      console.warn('API returned non-ok, using local curriculum builder fallback');
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
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs mb-6 flex items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-2.5 border border-emerald-200/80">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ciclo de Treino Semanal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
            Nova Aula & Planejamento Semanal
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
            Cole suas anotações da aula (expressões, correções do professor e vocabulário). O sistema criará um ciclo inteligente de 7 dias, começando hoje, com 4 blocos de 5 minutos diários.
          </p>
        </div>

        <div className="flex-shrink-0 hidden md:block">
          <LearnerMascot mood={isGenerating ? 'thinking' : 'speaking'} size="sm" />
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs mb-6 space-y-5">
        {/* 1. Class Topic */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            1. Assunto da Aula
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Reuniões, Prazos & Rotina de Trabalho..."
            className="w-full text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900"
          />
        </div>

        {/* 2. Class Day & Daily Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              2. Dia da sua Aula de Inglês
            </label>
            <select
              value={classDay}
              onChange={(e) => setClassDay(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
            >
              {CLASS_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <p className="text-2xs text-slate-400 mt-1 font-medium">
              O plano começa hoje e destaca o dia da sua aula no calendário da semana.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              3. Meta Diária de Treino
            </label>
            <select
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
            >
              {DAILY_TIME_OPTIONS.map((opt) => (
                <option key={opt.minutes} value={opt.minutes}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-2xs text-slate-400 mt-1 font-medium">
              Exercícios divididos em blocos ágeis de 5 min para encaixar na sua rotina.
            </p>
          </div>
        </div>

        {/* 3. Class Notes & Vocabulary Box with live detection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
              4. Anotações & Vocabulário da Aula ({parsedItems.length} identificados)
            </label>
            <button
              type="button"
              onClick={handleUseExample}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              Usar outro exemplo
            </button>
          </div>

          <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
            Cole como você anota no caderno: com a palavra em inglês, o significado em português e a
            pronúncia aproximada. O sistema lê e organiza tudo automaticamente:
          </p>

          <textarea
            rows={7}
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder={`schedule - agendar / eskedul - confundi na aula\nactually - na verdade / actshually\nlook forward to - aguardar ansiosamente\noverwhelmed - sobrecarregado`}
            className="w-full text-sm font-mono p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-slate-800"
          />

          {/* Live recognition preview */}
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>O que o sistema reconheceu nas suas anotações:</span>
              </span>
              <span className="text-2xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {parsedItems.length} termos prontos para o plano
              </span>
            </div>

            {parsedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-xs">{item.english}</span>
                        {item.pronunciation && (
                          <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                            /{item.pronunciation}/
                          </span>
                        )}
                      </div>
                      {item.portuguese && (
                        <div className="text-2xs text-slate-600 font-medium">
                          Significa: {item.portuguese}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-2xs text-amber-700 font-medium">
                          Nota: {item.note}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => speakWord(item.english)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      title="Ouvir"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Digite ou cole anotações acima para ver a identificação em tempo real.
              </p>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs sm:text-sm text-amber-900 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className={`flex-1 py-3.5 px-6 text-white font-bold text-sm rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isGenerating
                ? 'bg-emerald-400 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-xs'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Montando Programação da Semana...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Gerar Ciclo Semanal (7 Dias · {dailyMinutes} min/dia)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

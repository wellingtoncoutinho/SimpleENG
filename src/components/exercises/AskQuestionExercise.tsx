import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, MicOff, HelpCircle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, soundEffects, prefetchAudio, stopAllAudio } from '../../utils/audio';
import { containsRequiredWords, createSpeechRecognizer, isSpeechRecognitionSupported } from '../../utils/speechRecognition';
import { LearnerMascot } from '../LearnerMascot';
import { Language, translations } from '../../utils/i18n';
import { ClickableSentence } from '../ClickableSentence';

interface AskQuestionExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  lang?: Language;
  disabled?: boolean;
}

export const AskQuestionExercise: React.FC<AskQuestionExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  lang = 'pt',
  disabled = false,
}) => {
  const [isPlayingPrompt, setIsPlayingPrompt] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interim, setInterim] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  const t = translations[lang];
  const activeInstruction =
    lang === 'pt'
      ? exercise.instructionPt || 'Faça a pergunta em inglês para esta resposta do Leo:'
      : exercise.instruction || 'Formulate the question in English that leads to this answer:';

  const requiredWords = exercise.requiredWords || [exercise.targetWord];
  const requiredCheck = containsRequiredWords(userAnswer || interim, requiredWords);
  const supported = isSpeechRecognitionSupported();

  // In AskQuestionExercise, Leo gives the ANSWER, and the student asks the QUESTION!
  const leoGivenAnswer = exercise.givenAnswer || exercise.promptText;
  const leoGivenAnswerPt = exercise.givenAnswerPt || exercise.promptTextPt;

  const handlePlayLeoVoice = () => {
    if (isPlayingPrompt) return;
    setIsPlayingPrompt(true);
    soundEffects.playTap();
    playTextToSpeech(leoGivenAnswer, 1.0, () => {
      setIsPlayingPrompt(false);
    });
  };

  useEffect(() => {
    prefetchAudio(leoGivenAnswer);
    const timer = setTimeout(() => {
      handlePlayLeoVoice();
    }, 450);
    return () => clearTimeout(timer);
  }, [exercise.id, leoGivenAnswer]);

  const toggleMic = () => {
    if (disabled) return;
    setMicError(null);

    if (isListening) {
      if (interim.trim()) {
        onChangeAnswer(interim.trim());
      }
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {}
        recognizerRef.current = null;
      }
      setIsListening(false);
      return;
    }

    stopAllAudio();
    setIsPlayingPrompt(false);
    setIsListening(true);
    setInterim('');

    try {
      const recognizer = createSpeechRecognizer(
        (transcript, isFinal) => {
          if (isFinal) {
            const formatted = transcript.trim().endsWith('?') ? transcript.trim() : `${transcript.trim()}?`;
            onChangeAnswer(formatted);
            setInterim('');
            setIsListening(false);
          } else {
            setInterim(transcript);
          }
        },
        (error) => {
          setMicError(error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        },
        3600
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
      }
    } catch (err) {
      console.warn('Microphone start error:', err);
      setMicError('Não foi possível iniciar o microfone. Você pode digitar sua pergunta abaixo!');
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          if (recognizerRef.current.safeAbort) {
            recognizerRef.current.safeAbort();
          } else {
            recognizerRef.current.stop();
          }
        } catch {}
      }
      stopAllAudio();
    };
  }, []);

  // Starter question helper pills (optional 1-tap question starters to unstick thinking)
  const questionStarters = ['What', 'How', 'Why', 'Where', 'Do you', 'Did you', 'Could you'];

  const handleInsertStarter = (starter: string) => {
    if (disabled) return;
    soundEffects.playTap();
    const current = userAnswer.trim();
    if (!current) {
      onChangeAnswer(`${starter} `);
    } else if (!current.toLowerCase().startsWith(starter.toLowerCase())) {
      onChangeAnswer(`${starter} ${current}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800 shadow-xs">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Desafio Invertido · Crie a Pergunta</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white text-center mb-5 tracking-tight">
        {activeInstruction}
      </h2>

      {/* Leo's Answer Card */}
      <div className="w-full bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-5 mb-4 flex items-start gap-4 shadow-sm">
        <div className="flex-shrink-0">
          <LearnerMascot mood={isPlayingPrompt ? 'speaking' : 'happy'} size="sm" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black tracking-wider uppercase text-indigo-800 dark:text-indigo-300">
              {lang === 'pt' ? 'Resposta dada pelo Leo:' : "Leo's Answer:"}
            </span>
            <button
              type="button"
              onClick={handlePlayLeoVoice}
              disabled={isPlayingPrompt}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs"
              title={t.nativePronunciationTip}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingPrompt ? 'animate-bounce text-indigo-600' : ''}`} />
            </button>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
            <ClickableSentence
              sentence={leoGivenAnswer}
              highlightWord={exercise.targetWord}
              wordClassName="text-slate-900 dark:text-white"
            />
          </div>
          {lang === 'pt' && leoGivenAnswerPt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 pt-1.5 border-t border-indigo-100 dark:border-indigo-900/60">
              🇧🇷 Tradução da resposta: "{leoGivenAnswerPt}"
            </p>
          )}
        </div>
      </div>

      {/* Required Word Requirement */}
      <div className="w-full mb-3 flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-300">
          {lang === 'pt' ? 'Inclua na sua pergunta:' : 'Include in your question:'}
        </span>
        <div className="flex items-center gap-2">
          {requiredWords.map((rw) => {
            const hasWord = !requiredCheck.missing.includes(rw);
            return (
              <span
                key={rw}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  hasWord
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                }`}
              >
                {hasWord ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                "{rw}"
              </span>
            );
          })}
        </div>
      </div>

      {/* Quick Starter Chips */}
      <div className="w-full mb-3 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Início rápido:</span>
        </span>
        {questionStarters.map((starter) => (
          <button
            key={starter}
            type="button"
            disabled={disabled}
            onClick={() => handleInsertStarter(starter)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
          >
            {starter}...
          </button>
        ))}
      </div>

      {/* Question Input */}
      <div className="w-full relative">
        <textarea
          rows={3}
          value={userAnswer || interim}
          onChange={(e) => onChangeAnswer(e.target.value)}
          disabled={disabled}
          placeholder={`Escreva ou fale a pergunta em inglês usando "${requiredWords.join(', ')}"?`}
          className="w-full text-base font-medium p-4 pr-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none shadow-xs"
        />

        {supported && !disabled && (
          <button
            type="button"
            onClick={toggleMic}
            className={`absolute right-3 bottom-4 p-2.5 rounded-xl transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title={isListening ? 'Parar gravação' : 'Falar pergunta no microfone'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
      </div>

      {isListening && (
        <div className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
          <span>Ouvindo sua pergunta em inglês...</span>
        </div>
      )}

      {micError && (
        <div className="mt-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-center max-w-md animate-in fade-in">
          {micError}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
        Dica: Lembre-se de inverter o verbo auxiliar na pergunta (ex: <em>What do you...</em>, <em>How did you...</em>, <em>Where are you...</em>).
      </p>
    </div>
  );
};

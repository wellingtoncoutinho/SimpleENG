import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, MicOff, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, soundEffects, prefetchAudio, stopAllAudio } from '../../utils/audio';
import { containsRequiredWords, createSpeechRecognizer, isSpeechRecognitionSupported } from '../../utils/speechRecognition';
import { LearnerMascot } from '../LearnerMascot';
import { Language, translations } from '../../utils/i18n';
import { ClickableSentence } from '../ClickableSentence';

interface RoleplayPromptExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  lang?: Language;
  disabled?: boolean;
}

export const RoleplayPromptExercise: React.FC<RoleplayPromptExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  onSubmit,
  lang = 'pt',
  disabled = false,
}) => {
  const [isPlayingPrompt, setIsPlayingPrompt] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interim, setInterim] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  const t = translations[lang];
  const activeInstruction = lang === 'pt' ? (exercise.instructionPt || exercise.instruction) : exercise.instruction;

  const requiredWords = exercise.requiredWords || [exercise.targetWord];
  const requiredCheck = containsRequiredWords(userAnswer || interim, requiredWords);
  const supported = isSpeechRecognitionSupported();

  const dialogueSentence = exercise.audioSentence || exercise.promptText;

  const handlePlayEngyVoice = () => {
    if (isPlayingPrompt) return;
    setIsPlayingPrompt(true);
    soundEffects.playTap();
    playTextToSpeech(dialogueSentence, 1.0, () => {
      setIsPlayingPrompt(false);
    });
  };

  useEffect(() => {
    prefetchAudio(dialogueSentence);
    const timer = setTimeout(() => {
      handlePlayEngyVoice();
    }, 450);
    return () => clearTimeout(timer);
  }, [exercise.id, dialogueSentence]);

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

    // Stop all audio output immediately to avoid mobile audio session conflict/freeze
    stopAllAudio();
    setIsPlayingPrompt(false);
    setIsListening(true);
    setInterim('');

    try {
      const recognizer = createSpeechRecognizer(
        (transcript, isFinal) => {
          if (isFinal) {
            onChangeAnswer(transcript);
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
        3200 // 3.2s silence timeout
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
      }
    } catch (err) {
      console.warn('Microphone start error:', err);
      setMicError('Não foi possível iniciar o microfone no momento. Você pode digitar sua resposta abaixo!');
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

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word Chip */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 shadow-xs">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Roleplay Conversacional</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white text-center mb-5 tracking-tight">
        {activeInstruction}
      </h2>

      {/* Leo Dialogue Box */}
      <div className="w-full bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 mb-5 flex items-start gap-4 shadow-sm">
        <div className="flex-shrink-0">
          <LearnerMascot mood={isPlayingPrompt ? 'speaking' : 'happy'} size="sm" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
              {t.roleplayEngyAsks}
            </span>
            <button
              type="button"
              onClick={handlePlayEngyVoice}
              disabled={isPlayingPrompt}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
              title={t.nativePronunciationTip}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingPrompt ? 'animate-bounce text-emerald-600' : ''}`} />
            </button>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
            <ClickableSentence
              sentence={dialogueSentence}
              highlightWord={exercise.targetWord}
              wordClassName="text-slate-900 dark:text-white"
            />
          </div>
          {lang === 'pt' && exercise.promptTextPt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 pt-1 border-t border-emerald-100 dark:border-emerald-900/60">
              🇧🇷 Contexto: {exercise.promptTextPt}
            </p>
          )}
        </div>
      </div>

      {/* Required Word Requirement */}
      <div className="w-full mb-4 flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-300">{t.roleplayRequiredWord}</span>
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

      {/* Response Input */}
      <div className="w-full relative">
        <textarea
          rows={3}
          value={userAnswer || interim}
          onChange={(e) => onChangeAnswer(e.target.value)}
          disabled={disabled}
          placeholder={t.roleplayPlaceholder.replace('{word}', requiredWords.join(', '))}
          className="w-full text-base font-medium p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all bg-white text-slate-900 resize-none shadow-xs"
        />

        {supported && !disabled && (
          <button
            type="button"
            onClick={toggleMic}
            className={`absolute right-3 bottom-4 p-2.5 rounded-xl transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title={isListening ? 'Parar gravação' : 'Gravar resposta'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
      </div>

      {isListening && (
        <div className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
          <span>Ouvindo sua resposta em inglês... Fale naturalmente!</span>
        </div>
      )}

      {micError && (
        <div className="mt-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-center max-w-md animate-in fade-in">
          {micError}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500 text-center">
        {t.roleplayTip}
      </p>
    </div>
  );
};

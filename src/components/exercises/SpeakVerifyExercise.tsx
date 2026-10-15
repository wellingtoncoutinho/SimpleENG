import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Keyboard, Check, StopCircle } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, soundEffects, prefetchAudio, stopAllAudio } from '../../utils/audio';
import { Language, translations } from '../../utils/i18n';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  verifyAnswer,
} from '../../utils/speechRecognition';
import { ClickableSentence } from '../ClickableSentence';

interface SpeakVerifyExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  lang?: Language;
  disabled?: boolean;
}

export const SpeakVerifyExercise: React.FC<SpeakVerifyExerciseProps> = ({
  exercise,
  userAnswer,
  onChangeAnswer,
  onSubmit,
  lang = 'pt',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPlayingModel, setIsPlayingModel] = useState<boolean>(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>('');
  const [useTextInput, setUseTextInput] = useState<boolean>(false);
  const recognizerRef = useRef<any>(null);

  const t = translations[lang];
  const targetSentence = exercise.expectedAnswer;
  const sentenceTranslation = exercise.expectedAnswerPt || exercise.promptTextPt;

  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    prefetchAudio(targetSentence);
  }, [targetSentence]);

  const handleListenModel = () => {
    if (isPlayingModel) return;
    setIsPlayingModel(true);
    soundEffects.playTap();
    playTextToSpeech(targetSentence, 0.9, () => {
      setIsPlayingModel(false);
    });
  };

  const startListening = () => {
    if (disabled || isListening) return;
    setSttError(null);
    setInterimText('');

    // Stop all audio output before microphone hardware access to prevent mobile lockup
    stopAllAudio();
    setIsPlayingModel(false);

    try {
      const recognizer = createSpeechRecognizer(
        (transcript, isFinal) => {
          if (isFinal) {
            onChangeAnswer(transcript);
            setInterimText('');
            setIsListening(false);
          } else {
            setInterimText(transcript);
          }
        },
        (error) => {
          setSttError(error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        },
        3200 // 3.2 seconds silence timeout
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch {
      setSttError('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (interimText.trim() && !userAnswer) {
      onChangeAnswer(interimText.trim());
    }
    if (recognizerRef.current) {
      try {
        if (recognizerRef.current.safeAbort) {
          recognizerRef.current.safeAbort();
        } else {
          recognizerRef.current.stop();
        }
      } catch {}
      recognizerRef.current = null;
    }
    setIsListening(false);
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

  const verification = userAnswer
    ? verifyAnswer(userAnswer, exercise.expectedAnswer, exercise.acceptableVariations, 0.78)
    : null;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word Chip */}
      <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full border border-sky-200 shadow-2xs">
        <span>{t.targetWordLabel}</span>
        <span className="font-extrabold underline decoration-sky-400">{exercise.targetWord}</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white text-center mb-4 tracking-tight">
        {lang === 'pt' ? 'Leia a frase completa em voz alta:' : 'Read the full sentence aloud:'}
      </h2>

      {/* Target Sentence Card */}
      <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 mb-6 shadow-xs relative">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            {/* Interactive Sentence where user can click words to see meaning */}
            <ClickableSentence
              sentence={targetSentence}
              highlightWord={exercise.targetWord}
              className="text-lg sm:text-xl font-black leading-snug"
              wordClassName="text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={handleListenModel}
            disabled={isPlayingModel}
            className="flex-shrink-0 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs cursor-pointer"
            title={t.nativePronunciationTip}
          >
            <Volume2 className={`w-5 h-5 ${isPlayingModel ? 'animate-bounce' : ''}`} />
          </button>
        </div>

        {/* Portuguese Translation Banner */}
        {sentenceTranslation && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="opacity-75">🇧🇷 Tradução:</span>
            <span className="italic text-slate-700 dark:text-slate-300 font-bold">"{sentenceTranslation}"</span>
          </div>
        )}

        <div className="mt-3 text-2xs text-slate-400 dark:text-slate-500 font-medium">
          💡 Toque nas palavras em inglês para ver o significado ou no 🔊 para ouvir a pronúncia.
        </div>
      </div>

      {/* Microphone or Text Toggle */}
      {!useTextInput && supported ? (
        <div className="flex flex-col items-center w-full">
          <div className="relative mb-4">
            {isListening && (
              <>
                <span className="animate-ping absolute inset-0 rounded-full bg-rose-400 opacity-70" />
                <span className="animate-pulse absolute -inset-3 rounded-full bg-rose-200 opacity-50" />
              </>
            )}

            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={disabled}
              className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white shadow-[0_6px_0_#be123c] scale-105'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_6px_0_#059669] active:shadow-[0_2px_0_#059669] active:translate-y-1'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 text-center">
            {isListening ? (
              <span className="text-rose-600 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
                <span>Ouvindo... Fale a frase completa! (Toque no mic para parar)</span>
              </span>
            ) : (
              t.tapMicToSpeak
            )}
          </p>

          {/* Live transcript preview */}
          {(interimText || userAnswer) && (
            <div className="w-full mt-2 p-4 bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xs text-center animate-in fade-in">
              <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
                {t.youSaid}
              </span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                "{userAnswer || interimText}"
              </p>
              {verification && userAnswer && (
                <div className="mt-2 text-xs font-semibold flex items-center justify-center gap-1 text-emerald-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.accuracyScore} {Math.round(verification.similarity * 100)}%
                </div>
              )}
            </div>
          )}

          {sttError && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center max-w-md">
              {sttError}
            </div>
          )}

          <button
            type="button"
            onClick={() => setUseTextInput(true)}
            className="mt-4 text-xs font-semibold text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1 cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" /> {t.micIssueText}
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => onChangeAnswer(e.target.value)}
            disabled={disabled}
            placeholder={t.typeEnglishPlaceholder}
            className="w-full text-base sm:text-lg font-medium px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all bg-white text-slate-900 shadow-sm"
          />
          {supported && (
            <button
              type="button"
              onClick={() => setUseTextInput(false)}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" /> {t.switchBackMic}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

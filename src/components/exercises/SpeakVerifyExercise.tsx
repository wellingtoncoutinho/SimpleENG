import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Keyboard } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, soundEffects } from '../../utils/audio';
import { Language, translations } from '../../utils/i18n';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  verifyAnswer,
} from '../../utils/speechRecognition';

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
  const activeInstruction = lang === 'pt' ? (exercise.instructionPt || exercise.instruction) : exercise.instruction;
  const activePromptText = lang === 'pt' ? (exercise.promptTextPt || exercise.promptText) : exercise.promptText;

  const supported = isSpeechRecognitionSupported();

  const handleListenModel = () => {
    if (isPlayingModel) return;
    setIsPlayingModel(true);
    soundEffects.playTap();
    playTextToSpeech(exercise.expectedAnswer, 0.9, () => {
      setIsPlayingModel(false);
    });
  };

  const startListening = () => {
    if (disabled || isListening) return;
    setSttError(null);
    setInterimText('');
    soundEffects.playTap();

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
        }
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
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const verification = userAnswer
    ? verifyAnswer(userAnswer, exercise.expectedAnswer, exercise.acceptableVariations)
    : null;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded-full border border-sky-200 shadow-xs">
        <span>{t.targetWordLabel}</span>
        <span className="font-bold underline decoration-sky-400">{exercise.targetWord}</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center mb-6 tracking-tight">
        {activeInstruction}
      </h2>

      {/* Target Prompt Box */}
      <div className="w-full bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-5 mb-6 relative group hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed">
            "{activePromptText}"
          </p>
          <button
            type="button"
            onClick={handleListenModel}
            disabled={isPlayingModel}
            className="flex-shrink-0 p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            title={t.nativePronunciationTip}
          >
            <Volume2 className={`w-5 h-5 ${isPlayingModel ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      </div>

      {/* Microphone or Text Toggle */}
      {!useTextInput && supported ? (
        <div className="flex flex-col items-center w-full">
          <div className="relative mb-5">
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

          <p className="text-sm font-semibold text-slate-600 mb-2">
            {isListening ? (
              <span className="text-rose-600 animate-pulse flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
                {t.listeningSpeakNow}
              </span>
            ) : (
              t.tapMicToSpeak
            )}
          </p>

          {/* Live transcript preview */}
          {(interimText || userAnswer) && (
            <div className="w-full mt-3 p-4 bg-white border-2 border-emerald-200 rounded-2xl shadow-xs text-center animate-in fade-in">
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                {t.youSaid}
              </span>
              <p className="text-lg font-bold text-slate-800">
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
            className="w-full text-base sm:text-lg font-medium px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all bg-white text-slate-900"
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

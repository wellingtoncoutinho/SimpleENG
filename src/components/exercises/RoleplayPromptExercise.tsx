import React, { useState, useEffect } from 'react';
import { Volume2, Mic, MicOff, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { Exercise } from '../../types/lesson';
import { playTextToSpeech, soundEffects } from '../../utils/audio';
import { containsRequiredWords, createSpeechRecognizer, isSpeechRecognitionSupported } from '../../utils/speechRecognition';
import { LearnerMascot } from '../LearnerMascot';
import { Language, translations } from '../../utils/i18n';

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

  const t = translations[lang];
  const activeInstruction = lang === 'pt' ? (exercise.instructionPt || exercise.instruction) : exercise.instruction;
  const activePromptText = lang === 'pt' ? (exercise.promptTextPt || exercise.promptText) : exercise.promptText;

  const requiredWords = exercise.requiredWords || [exercise.targetWord];
  const requiredCheck = containsRequiredWords(userAnswer || interim, requiredWords);
  const supported = isSpeechRecognitionSupported();

  const handlePlayEngyVoice = () => {
    if (isPlayingPrompt) return;
    setIsPlayingPrompt(true);
    soundEffects.playTap();
    const sentenceToPlay = exercise.audioSentence || exercise.promptText;
    playTextToSpeech(sentenceToPlay, 1.0, () => {
      setIsPlayingPrompt(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlayEngyVoice();
    }, 450);
    return () => clearTimeout(timer);
  }, [exercise.id]);

  const toggleMic = () => {
    if (disabled) return;
    if (isListening) {
      setIsListening(false);
      return;
    }

    soundEffects.playTap();
    setIsListening(true);
    setInterim('');

    createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          onChangeAnswer(transcript);
          setInterim('');
          setIsListening(false);
        } else {
          setInterim(transcript);
        }
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    )?.start();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Target Word Chip */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 shadow-xs">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Roleplay</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center mb-6 tracking-tight">
        {activeInstruction}
      </h2>

      {/* Leo Dialogue Box */}
      <div className="w-full bg-emerald-50/70 border-2 border-emerald-200 rounded-3xl p-5 mb-5 flex items-start gap-4 shadow-sm">
        <div className="flex-shrink-0">
          <LearnerMascot mood={isPlayingPrompt ? 'speaking' : 'happy'} size="sm" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black tracking-wider uppercase text-emerald-800">
              {t.roleplayEngyAsks}
            </span>
            <button
              type="button"
              onClick={handlePlayEngyVoice}
              disabled={isPlayingPrompt}
              className="p-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
              title={t.nativePronunciationTip}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingPrompt ? 'animate-bounce text-emerald-600' : ''}`} />
            </button>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
            "{exercise.audioSentence || exercise.promptText}"
          </p>
          {lang === 'pt' && exercise.promptTextPt && (
            <p className="text-xs text-slate-500 font-medium mt-1">
              Contexto: {exercise.promptTextPt}
            </p>
          )}
        </div>
      </div>

      {/* Required Word Requirement */}
      <div className="w-full mb-4 flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
        <span className="text-slate-600">{t.roleplayRequiredWord}</span>
        <div className="flex items-center gap-2">
          {requiredWords.map((rw) => {
            const hasWord = !requiredCheck.missing.includes(rw);
            return (
              <span
                key={rw}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  hasWord
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
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

      <p className="mt-2 text-xs text-slate-500 text-center">
        {t.roleplayTip}
      </p>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  Volume2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageCircle,
  Loader2,
  Headphones,
  Wand2,
  History,
  Trash2,
} from 'lucide-react';
import { LearnerMascot } from './LearnerMascot';
import { UserProfile } from '../types/user';
import { createContinuousSpeechRecognizer } from '../utils/speechRecognition';
import { playTextToSpeech, speakWord, soundEffects, stopAllAudio } from '../utils/audio';
import { Language } from '../utils/i18n';

export interface DaySpeechAnalysisResult {
  faithfulTranscript: string;
  portugueseMeaning: string;
  overallFeedbackPt: string;
  score: number;
  grammarCorrections: Array<{
    whatYouSaid: string;
    betterWay: string;
    explanationPt: string;
  }>;
  pronunciationAndFluencyTips: Array<{
    wordOrPhrase: string;
    tipPt: string;
  }>;
  correctedVersion: string;
  nativeLevelUpVersion: string;
  nativeExpressionsUsed: Array<{
    expression: string;
    meaningPt: string;
  }>;
}

export interface SavedDayEntry {
  id: string;
  dateFormatted: string;
  durationSec: number;
  result: DaySpeechAnalysisResult;
}

interface TellYourDayViewProps {
  user: UserProfile;
  targetWords?: string[];
  lang?: Language;
  onBack: () => void;
  onAwardXp?: (xp: number) => void;
}

export const TellYourDayView: React.FC<TellYourDayViewProps> = ({
  user,
  targetWords = [],
  onBack,
  onAwardXp,
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [confirmedText, setConfirmedText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DaySpeechAnalysisResult | null>(null);
  const [isPlayingLeoIntro, setIsPlayingLeoIntro] = useState<boolean>(false);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState<string | null>(null);

  const [history, setHistory] = useState<SavedDayEntry[]>(() => {
    try {
      const saved = localStorage.getItem('simpleeng_day_journal_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognizerRef = useRef<ReturnType<typeof createContinuousSpeechRecognizer> | null>(null);
  const timerRef = useRef<any>(null);
  const confirmedTextRef = useRef<string>('');
  confirmedTextRef.current = confirmedText;

  const leoGreeting = "Hey! Tell me a little about how your day went. Take your time to think — the microphone won't cut you off!";

  const handlePlayLeoIntro = () => {
    if (isPlayingLeoIntro) return;
    setIsPlayingLeoIntro(true);
    soundEffects.playTap();
    playTextToSpeech(leoGreeting, 1.0, () => {
      setIsPlayingLeoIntro(false);
    });
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
      cleanupRecordingResources();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const cleanupRecordingResources = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.abort();
      } catch {}
      speechRecognizerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    stopAllAudio();
    setIsPlayingLeoIntro(false);
    setErrorMsg(null);
    setAnalysisResult(null);
    soundEffects.playTap();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const supportedMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      setMimeType(recorder.mimeType || 'audio/webm');
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const finalBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          setAudioBlob(finalBlob);
          const url = URL.createObjectURL(finalBlob);
          setAudioUrl(url);
        }
      };

      // Collect chunks every 1500ms so long recordings never lose buffer data
      recorder.start(1500);
      mediaRecorderRef.current = recorder;

      // Start continuous live transcript (never stops on silence!)
      const continuousRec = createContinuousSpeechRecognizer(
        (confirmed, interim) => {
          setConfirmedText(confirmed);
          setInterimText(interim);
        },
        (err) => {
          console.warn('Live transcript notice:', err);
        }
      );

      if (continuousRec) {
        speechRecognizerRef.current = continuousRec;
        continuousRec.start(confirmedTextRef.current);
      }

      setRecordingState('recording');
      startTimer();
    } catch (err: any) {
      console.error('Failed to open microphone:', err);
      setErrorMsg('Não foi possível acessar o microfone. Verifique a permissão do navegador ou digite o relato do seu dia abaixo.');
    }
  };

  const handlePauseRecording = () => {
    soundEffects.playTap();
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch {}
    }
    if (speechRecognizerRef.current) {
      const saved = speechRecognizerRef.current.stop();
      if (saved) setConfirmedText(saved);
      setInterimText('');
    }
    setRecordingState('paused');
  };

  const handleResumeRecording = () => {
    soundEffects.playTap();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch {}
    }
    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.start(confirmedTextRef.current);
    }
    setRecordingState('recording');
    startTimer();
  };

  const handleStopRecording = () => {
    soundEffects.playTap();
    stopTimer();

    if (speechRecognizerRef.current) {
      const finalStr = speechRecognizerRef.current.stop();
      const combined = (finalStr + ' ' + interimText).replace(/\s+/g, ' ').trim();
      if (combined) setConfirmedText(combined);
      setInterimText('');
      speechRecognizerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setRecordingState('stopped');
  };

  const handleResetRecording = () => {
    soundEffects.playTap();
    cleanupRecordingResources();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setConfirmedText('');
    setInterimText('');
    setElapsedSeconds(0);
    setAnalysisResult(null);
    setErrorMsg(null);
    setRecordingState('idle');
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyzeSpeech = async () => {
    soundEffects.playTap();
    setErrorMsg(null);

    let currentBlob = audioBlob;
    // If user is still in recording/paused state and clicks "Analisar Agora", finalize first
    if (recordingState === 'recording' || recordingState === 'paused') {
      handleStopRecording();
      if (audioChunksRef.current.length > 0) {
        currentBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(currentBlob);
      }
    }

    const fullDraft = (confirmedText + ' ' + interimText).replace(/\s+/g, ' ').trim();

    if (!currentBlob && !fullDraft) {
      setErrorMsg('Grave seu áudio ou escreva um pouco sobre o seu dia antes de pedir a correção do Leo!');
      return;
    }

    setIsAnalyzing(true);
    try {
      let audioBase64: string | undefined = undefined;
      if (currentBlob && currentBlob.size > 0) {
        audioBase64 = await blobToBase64(currentBlob);
      }

      const response = await fetch('/api/analyze-day-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: mimeType.split(';')[0] || 'audio/webm',
          liveTranscript: fullDraft,
          userLevel: user.level || 'B1',
          targetWords: targetWords.slice(0, 8),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar seu áudio no servidor. Seu áudio continua salvo aqui, tente novamente!');
      }

      const result: DaySpeechAnalysisResult = await response.json();
      setAnalysisResult(result);
      soundEffects.playFanfare();
      onAwardXp?.(30);

      // Save to local journal history
      const newEntry: SavedDayEntry = {
        id: `day_${Date.now()}`,
        dateFormatted: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        durationSec: elapsedSeconds,
        result,
      };
      const updatedHistory = [newEntry, ...history].slice(0, 15);
      setHistory(updatedHistory);
      try {
        localStorage.setItem('simpleeng_day_journal_history', JSON.stringify(updatedHistory));
      } catch {}
    } catch (err: any) {
      console.error('Error analyzing day speech:', err);
      setErrorMsg(
        err.message ||
          'Ocorreu um erro de conexão, mas sua gravação está protegida! Clique em "Analisar Minha Fala" para tentar de novo.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlayVersionAudio = (key: string, text: string) => {
    if (isPlayingModelAudio === key) {
      stopAllAudio();
      setIsPlayingModelAudio(null);
      return;
    }
    stopAllAudio();
    setIsPlayingModelAudio(key);
    soundEffects.playTap();
    playTextToSpeech(text, 1.0, () => {
      setIsPlayingModelAudio(null);
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    soundEffects.playTap();
    const filtered = history.filter((h) => h.id !== id);
    setHistory(filtered);
    try {
      localStorage.setItem('simpleeng_day_journal_history', JSON.stringify(filtered));
    } catch {}
  };

  const fullVisibleTranscript = (confirmedText + (interimText ? ' ' + interimText : '')).trim();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in">
      {/* Top Back Bar */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => {
            stopAllAudio();
            cleanupRecordingResources();
            soundEffects.playTap();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Voltar para o Início</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fala Ativa · Diário em Inglês</span>
        </div>
      </div>

      {/* Main Card: Leo Asking "How Was Your Day?" */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-shrink-0">
            <LearnerMascot
              mood={
                recordingState === 'recording'
                  ? 'happy'
                  : isAnalyzing
                  ? 'thinking'
                  : analysisResult
                  ? 'celebrate'
                  : 'speaking'
              }
              size="md"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-between gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Leo quer te ouvir
              </span>
              <button
                type="button"
                onClick={handlePlayLeoIntro}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingLeoIntro ? 'animate-bounce' : ''}`} />
                <span>Ouvir o Leo</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              "Hey! Tell me a little about how your day went!"
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              🇧🇷 <strong>Me conta um pouco como foi o seu dia em inglês!</strong> O microfone fica aberto de forma contínua: você pode pausar para pensar, procurar palavras na cabeça ou hesitar sem medo de o áudio cortar. O Leo vai ouvir sua gravação real e mostrar onde você mandou bem e como falar de um jeito ainda mais natural!
            </p>

            {/* Optional target words inspiration */}
            {targetWords.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                <span className="text-[11px] font-bold text-slate-400">
                  Desafio opcional (tente usar se encaixar):
                </span>
                {targetWords.slice(0, 5).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => speakWord(w)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 className="w-3 h-3 text-emerald-600" />
                    <span>{w}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Continuous Audio Recorder Studio */}
        <div className="pt-6 flex flex-col items-center">
          {/* Status & Timer Pill */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border ${
                recordingState === 'recording'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : recordingState === 'paused'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : recordingState === 'stopped'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {recordingState === 'recording' && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              )}
              <span>
                {recordingState === 'recording'
                  ? 'Gravando sem interrupções (Pode pensar com calma)...'
                  : recordingState === 'paused'
                  ? 'Gravação Pausada'
                  : recordingState === 'stopped'
                  ? 'Áudio Gravado & Protegido'
                  : 'Microfone Pronto'}
              </span>
              <span className="font-mono text-sm ml-1">{formatTime(elapsedSeconds)}</span>
            </div>
          </div>

          {/* Primary Microphone Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 flex-wrap">
            {recordingState === 'idle' && (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isAnalyzing}
                className="py-4 px-7 rounded-3xl btn-3d-green text-white font-black text-base flex items-center gap-3 cursor-pointer shadow-lg"
              >
                <Mic className="w-6 h-6" />
                <span>Abrir Microfone e Contar Meu Dia</span>
              </button>
            )}

            {recordingState === 'recording' && (
              <>
                <button
                  type="button"
                  onClick={handlePauseRecording}
                  className="py-3.5 px-5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 font-black text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Pause className="w-4 h-4 fill-amber-900" />
                  <span>Pausar para Pensar</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-[0_4px_0_#9f1239] font-black text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Terminei de Falar</span>
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={handleResumeRecording}
                  className="py-3.5 px-6 rounded-2xl btn-3d-green text-white font-black text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Continuar Falando</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-[0_4px_0_#9f1239] font-black text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Finalizar Gravação</span>
                </button>
              </>
            )}

            {recordingState === 'stopped' && (
              <button
                type="button"
                onClick={handleResetRecording}
                disabled={isAnalyzing}
                className="py-2.5 px-4 rounded-2xl btn-3d-slate text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Gravar de Novo do Zero</span>
              </button>
            )}
          </div>

          {/* Recorded Audio Player (Protected Backup so user can listen to themselves) */}
          {audioUrl && recordingState === 'stopped' && (
            <div className="w-full max-w-xl mb-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Headphones className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Sua gravação de voz ({formatTime(elapsedSeconds)}):</span>
              </div>
              <audio controls src={audioUrl} className="h-9 w-full sm:w-64" />
            </div>
          )}

          {/* Live Transcript / Editable Box */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rascunho ao Vivo da Sua Fala (O Leo também vai ouvir seu áudio real!):</span>
              </span>
              {fullVisibleTranscript && (
                <span className="text-[11px] font-semibold text-slate-400">
                  {fullVisibleTranscript.split(/\s+/).filter(Boolean).length} palavras
                </span>
              )}
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={fullVisibleTranscript}
                onChange={(e) => {
                  setConfirmedText(e.target.value);
                  setInterimText('');
                }}
                disabled={recordingState === 'recording' || isAnalyzing}
                placeholder="Conforme você fala no microfone, suas palavras vão aparecendo aqui em tempo real..."
                className={`w-full p-4 rounded-2xl border-2 text-sm sm:text-base font-medium leading-relaxed outline-none transition-all resize-y ${
                  recordingState === 'recording'
                    ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white'
                }`}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit for AI Coaching Button */}
          {(recordingState === 'stopped' || fullVisibleTranscript.length > 5 || audioBlob) && (
            <div className="w-full mt-5">
              <button
                type="button"
                onClick={handleAnalyzeSpeech}
                disabled={isAnalyzing}
                className="w-full py-4 px-6 rounded-2xl btn-3d-green text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-md disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Leo está ouvindo seu áudio e preparando as correções...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Corrigir Minha Fala & Mostrar Como Melhorar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Result Panel */}
      {analysisResult && (
        <div className="space-y-5 animate-in fade-in">
          {/* 1. Overall Coaching Summary & Score */}
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-lg border border-emerald-300 dark:border-emerald-800">
                  {analysisResult.score}%
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Feedback do Leo sobre a sua fala
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Análise Completa do Seu Dia (+30 XP)
                  </h2>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              🦁 {analysisResult.overallFeedbackPt}
            </p>

            {/* What Leo heard you say */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                O que o Leo ouviu no seu áudio:
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white italic">
                "{analysisResult.faithfulTranscript}"
              </p>
              {analysisResult.portugueseMeaning && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  🇧🇷 Sentido em português: "{analysisResult.portugueseMeaning}"
                </p>
              )}
            </div>
          </div>

          {/* 2. Grammar & Expression Corrections */}
          {analysisResult.grammarCorrections && analysisResult.grammarCorrections.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Onde Ajustar & O Que Você Pode Falar Melhor</span>
              </h3>

              <div className="space-y-3">
                {analysisResult.grammarCorrections.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 text-xs font-bold line-through">
                        {item.whatYouSaid}
                      </span>
                      <span className="text-slate-400 font-black hidden sm:inline">➔</span>
                      <button
                        type="button"
                        onClick={() => speakWord(item.betterWay)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-black hover:bg-emerald-200 transition-all cursor-pointer"
                        title="Ouvir pronúncia correta"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{item.betterWay}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      💡 {item.explanationPt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Pronunciation & Rhythm Tips from the Audio */}
          {analysisResult.pronunciationAndFluencyTips &&
            analysisResult.pronunciationAndFluencyTips.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-500" />
                  <span>Dicas de Pronúncia, Ritmo & Fluidez da Fala</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisResult.pronunciationAndFluencyTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between"
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => speakWord(tip.wordOrPhrase)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-black mb-2 hover:bg-amber-100 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>{tip.wordOrPhrase}</span>
                        </button>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {tip.tipPt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 4. Two Model Versions: Clean Corrected vs. Native Level-Up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Corrected Version */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    1. Sua Fala Corrigida
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayVersionAudio('corrected', analysisResult.correctedVersion)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    <Volume2
                      className={`w-3.5 h-3.5 ${
                        isPlayingModelAudio === 'corrected' ? 'animate-bounce' : ''
                      }`}
                    />
                    <span>Ouvir</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  "{analysisResult.correctedVersion}"
                </p>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                Mantém exatamente as suas palavras, apenas corrigindo a gramática.
              </p>
            </div>

            {/* Native Level-Up Version */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2. Como um Nativo Contaria</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayVersionAudio('native', analysisResult.nativeLevelUpVersion)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-300 dark:border-indigo-700 cursor-pointer"
                  >
                    <Volume2
                      className={`w-3.5 h-3.5 ${
                        isPlayingModelAudio === 'native' ? 'animate-bounce' : ''
                      }`}
                    />
                    <span>Ouvir</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  "{analysisResult.nativeLevelUpVersion}"
                </p>
              </div>

              {analysisResult.nativeExpressionsUsed &&
                analysisResult.nativeExpressionsUsed.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-indigo-200/70 dark:border-indigo-800/70 flex flex-wrap gap-1.5">
                    {analysisResult.nativeExpressionsUsed.map((exp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => speakWord(exp.expression)}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold cursor-pointer"
                        title="Toque para ouvir"
                      >
                        <strong>{exp.expression}</strong> = {exp.meaningPt}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Previous Journal Entries History */}
      {history.length > 0 && (
        <div className="mt-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Seus Dias Anteriores ({history.length})</span>
          </h3>
          <div className="space-y-2.5">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  soundEffects.playTap();
                  setAnalysisResult(item.result);
                  window.scrollTo({ top: 250, behavior: 'smooth' });
                }}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                      {item.dateFormatted}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Nota {item.result.score}%
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                    "{item.result.faithfulTranscript}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHistoryItem(item.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Apagar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

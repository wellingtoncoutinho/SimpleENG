import React, { useState, useMemo } from 'react';
import { LessonPayload, Exercise } from '../types/lesson';
import { LessonHeader } from './LessonHeader';
import { FeedbackBanner, FeedbackStatus } from './FeedbackBanner';
import { ListenTypeExercise } from './exercises/ListenTypeExercise';
import { SpeakVerifyExercise } from './exercises/SpeakVerifyExercise';
import { SentenceBuildExercise } from './exercises/SentenceBuildExercise';
import { RoleplayPromptExercise } from './exercises/RoleplayPromptExercise';
import { GrammarFixExercise } from './exercises/GrammarFixExercise';
import { LessonComplete } from './LessonComplete';
import { LearnerMascot, MascotMood } from './LearnerMascot';
import { soundEffects } from '../utils/audio';
import { containsRequiredWords, verifyAnswer } from '../utils/speechRecognition';
import { Heart, RefreshCw } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface LessonPlayerProps {
  lesson: LessonPayload;
  lang?: Language;
  onExit: () => void;
  onComplete?: (stats: { xpEarned: number; correctCount: number; incorrectCount: number }) => void;
}

// Pedagogical progression weights (sentence_build first, listen second, speaking/roleplay later)
const EXERCISE_ORDER_WEIGHT: Record<string, number> = {
  sentence_build: 1,
  listen_type: 2,
  grammar_fix: 3,
  speak_verify: 4,
  roleplay_prompt: 5,
};

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  lang = 'pt',
  onExit,
  onComplete,
}) => {
  // Always organize exercises so the learner starts with the friendly word bank (Duolingo style)
  const sortedExercises = useMemo(() => {
    return [...lesson.exercises].sort((a, b) => {
      const weightA = EXERCISE_ORDER_WEIGHT[a.type] ?? 99;
      const weightB = EXERCISE_ORDER_WEIGHT[b.type] ?? 99;
      return weightA - weightB;
    });
  }, [lesson.exercises]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle');
  const [hearts, setHearts] = useState<number>(5);
  const [xp, setXp] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [showHeartRefillModal, setShowHeartRefillModal] = useState<boolean>(false);

  const t = translations[lang];
  const currentExercise: Exercise | undefined = sortedExercises[currentIndex];

  const handleCheckAnswer = () => {
    if (!currentExercise || feedbackStatus !== 'idle') return;

    let isCorrect = false;

    switch (currentExercise.type) {
      case 'listen_type': {
        const result = verifyAnswer(
          userAnswer,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.85
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'speak_verify': {
        const result = verifyAnswer(
          userAnswer,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.78
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'sentence_build': {
        const result = verifyAnswer(
          userAnswer,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.95
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'roleplay_prompt': {
        const reqCheck = containsRequiredWords(
          userAnswer,
          currentExercise.requiredWords || [currentExercise.targetWord]
        );
        isCorrect = reqCheck.allPresent && userAnswer.trim().length >= 8;
        break;
      }
      case 'grammar_fix': {
        const result = verifyAnswer(
          userAnswer,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.9
        );
        isCorrect = result.isCorrect;
        break;
      }
      default: {
        const result = verifyAnswer(
          userAnswer,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.85
        );
        isCorrect = result.isCorrect;
      }
    }

    if (isCorrect) {
      soundEffects.playCorrect();
      setFeedbackStatus('correct');
      setMascotMood('celebrate');
      setXp(prev => prev + 15);
      setCorrectCount(prev => prev + 1);
    } else {
      soundEffects.playIncorrect();
      setFeedbackStatus('incorrect');
      setMascotMood('supportive');
      setIncorrectCount(prev => prev + 1);
      setHearts(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setShowHeartRefillModal(true);
        }
        return next;
      });
    }
  };

  const handleSkip = () => {
    soundEffects.playTap();
    setFeedbackStatus('skipped');
    setMascotMood('supportive');
    setIncorrectCount(prev => prev + 1);
  };

  const handleContinue = () => {
    soundEffects.playTap();
    setFeedbackStatus('idle');
    setMascotMood('idle');
    setUserAnswer('');

    if (currentIndex + 1 < sortedExercises.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      onComplete?.({ xpEarned: xp, correctCount, incorrectCount });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedbackStatus('idle');
    setHearts(5);
    setXp(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsCompleted(false);
    setMascotMood('idle');
    setShowHeartRefillModal(false);
  };

  const handleRefillHearts = () => {
    setHearts(5);
    setShowHeartRefillModal(false);
    soundEffects.playCorrect();
  };

  if (isCompleted) {
    return (
      <LessonComplete
        lesson={lesson}
        stats={{
          totalExercises: sortedExercises.length,
          correctCount,
          incorrectCount,
          xpEarned: xp,
        }}
        lang={lang}
        onRestart={handleRestart}
        onCreateNew={onExit}
      />
    );
  }

  if (!currentExercise) {
    return null;
  }

  const canCheck = userAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col justify-between pb-32">
      {/* Header */}
      <LessonHeader
        currentIndex={currentIndex}
        totalExercises={sortedExercises.length}
        hearts={hearts}
        xp={xp}
        onExit={onExit}
      />

      {/* Main Exercise Content Area */}
      <main className="w-full max-w-2xl mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        {/* Companion Mascot Leo */}
        <div className="flex justify-center mb-2">
          <LearnerMascot mood={mascotMood} size="sm" />
        </div>

        {currentExercise.type === 'listen_type' && (
          <ListenTypeExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

        {currentExercise.type === 'speak_verify' && (
          <SpeakVerifyExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

        {currentExercise.type === 'sentence_build' && (
          <SentenceBuildExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

        {currentExercise.type === 'roleplay_prompt' && (
          <RoleplayPromptExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

        {currentExercise.type === 'grammar_fix' && (
          <GrammarFixExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}
      </main>

      {/* Sticky Feedback Banner */}
      <FeedbackBanner
        status={feedbackStatus}
        userAnswer={userAnswer}
        expectedAnswer={currentExercise.expectedAnswer}
        explanation={currentExercise.explanation}
        explanationPt={currentExercise.explanationPt}
        hint={currentExercise.hint}
        hintPt={currentExercise.hintPt}
        lang={lang}
        onCheck={handleCheckAnswer}
        onSkip={handleSkip}
        onContinue={handleContinue}
        canCheck={canCheck}
      />

      {/* Out of Hearts Modal */}
      {showHeartRefillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-2 border-rose-300 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-9 h-9 fill-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">{t.outOfHeartsTitle}</h3>
            <p className="text-slate-600 text-sm font-medium mb-6">
              {t.outOfHeartsDesc}
            </p>
            <button
              type="button"
              onClick={handleRefillHearts}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:translate-y-1 text-white font-black rounded-2xl shadow-[0_4px_0_#059669] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.refillHeartsBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [xp, setXp] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [sessionErrors, setSessionErrors] = useState<
    Array<{ targetWord: string; mistake?: string; tip?: string }>
  >([]);

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
      setSessionErrors(prev => [
        ...prev,
        {
          targetWord: currentExercise.targetWord,
          mistake: userAnswer,
          tip: currentExercise.explanationPt || currentExercise.hintPt,
        },
      ]);
    }
  };

  const handleRetry = () => {
    soundEffects.playTap();
    setUserAnswer('');
    setFeedbackStatus('idle');
    setMascotMood('idle');
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
    setXp(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsCompleted(false);
    setMascotMood('idle');
    setSessionErrors([]);
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
        sessionErrors={sessionErrors}
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
        sentenceTranslation={currentExercise.expectedAnswerPt || currentExercise.promptTextPt}
        explanation={currentExercise.explanation}
        explanationPt={currentExercise.explanationPt}
        hint={currentExercise.hint}
        hintPt={currentExercise.hintPt}
        lang={lang}
        onCheck={handleCheckAnswer}
        onSkip={handleSkip}
        onRetry={handleRetry}
        onContinue={handleContinue}
        canCheck={canCheck}
      />
    </div>
  );
};

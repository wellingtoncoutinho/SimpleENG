import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LessonPayload, Exercise } from '../types/lesson';
import { LessonHeader } from './LessonHeader';
import { FeedbackBanner, FeedbackStatus } from './FeedbackBanner';
import { ListenTypeExercise } from './exercises/ListenTypeExercise';
import { SpeakVerifyExercise } from './exercises/SpeakVerifyExercise';
import { SentenceBuildExercise } from './exercises/SentenceBuildExercise';
import { RoleplayPromptExercise } from './exercises/RoleplayPromptExercise';
import { GrammarFixExercise } from './exercises/GrammarFixExercise';
import { MultipleChoiceExercise } from './exercises/MultipleChoiceExercise';
import { FillBlankExercise } from './exercises/FillBlankExercise';
import { MatchPairsExercise } from './exercises/MatchPairsExercise';
import { LessonComplete } from './LessonComplete';
import { LearnerMascot, MascotMood } from './LearnerMascot';
import { soundEffects, prefetchAudio, stopAllAudio } from '../utils/audio';
import { containsRequiredWords, verifyAnswer } from '../utils/speechRecognition';
import { evaluateRoleplayAnswer, RoleplayEvaluation } from '../utils/roleplayEvaluator';
import { Language, translations } from '../utils/i18n';

interface LessonPlayerProps {
  lesson: LessonPayload;
  lang?: Language;
  onExit: () => void;
  onComplete?: (stats: { xpEarned: number; correctCount: number; incorrectCount: number }) => void;
}

// Pedagogical progression weights (fast recognition -> dopamine match -> cloze -> voice -> roleplay)
const EXERCISE_ORDER_WEIGHT: Record<string, number> = {
  multiple_choice: 1,
  match_pairs: 2,
  fill_blank: 3,
  sentence_build: 4,
  listen_type: 5,
  grammar_fix: 6,
  speak_verify: 7,
  roleplay_prompt: 8,
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

  // Pre-load neural studio audio for all exercises in the lesson in background
  React.useEffect(() => {
    sortedExercises.forEach((ex) => {
      if (ex.audioSentence) prefetchAudio(ex.audioSentence);
      if (ex.expectedAnswer) prefetchAudio(ex.expectedAnswer);
      if (ex.promptText) prefetchAudio(ex.promptText);
    });
  }, [sortedExercises]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const userAnswerRef = useRef(userAnswer);
  userAnswerRef.current = userAnswer;

  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle');
  const [roleplayEvaluation, setRoleplayEvaluation] = useState<RoleplayEvaluation | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [sessionErrors, setSessionErrors] = useState<
    Array<{ targetWord: string; mistake?: string; tip?: string }>
  >([]);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const t = translations[lang];
  const currentExercise: Exercise | undefined = sortedExercises[currentIndex];

  const handleCheckAnswer = (explicitAnswer?: unknown) => {
    if (!currentExercise || feedbackStatus !== 'idle') return;

    const cleanExplicit = typeof explicitAnswer === 'string' ? explicitAnswer.trim() : undefined;
    const answerToVerify = cleanExplicit !== undefined ? cleanExplicit : userAnswerRef.current.trim();

    if (cleanExplicit !== undefined && cleanExplicit !== userAnswer) {
      setUserAnswer(cleanExplicit);
    }

    let isCorrect = false;
    let localRoleplayEval: RoleplayEvaluation | null = null;

    switch (currentExercise.type) {
      case 'multiple_choice': {
        const result = verifyAnswer(
          answerToVerify,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.95
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'match_pairs': {
        isCorrect = answerToVerify === 'completed' || explicitAnswer === 'completed';
        break;
      }
      case 'fill_blank': {
        const target = currentExercise.targetWord?.trim().toLowerCase();
        const user = answerToVerify.toLowerCase();
        if (target && user === target) {
          isCorrect = true;
        } else {
          const result = verifyAnswer(
            answerToVerify,
            currentExercise.expectedAnswer,
            currentExercise.acceptableVariations,
            0.95
          );
          isCorrect = result.isCorrect;
        }
        break;
      }
      case 'listen_type': {
        const result = verifyAnswer(
          answerToVerify,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.85
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'speak_verify': {
        const result = verifyAnswer(
          answerToVerify,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.78
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'sentence_build': {
        const result = verifyAnswer(
          answerToVerify,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.95
        );
        isCorrect = result.isCorrect;
        break;
      }
      case 'roleplay_prompt': {
        const evaluation = evaluateRoleplayAnswer(
          answerToVerify,
          currentExercise.requiredWords || [currentExercise.targetWord]
        );
        localRoleplayEval = evaluation;
        setRoleplayEvaluation(evaluation);

        if (evaluation.missingRequiredWords.length > 0) {
          isCorrect = false;
        } else if (evaluation.corrections.length > 0) {
          // Flag grammar interference blunders (went go, to gym, I cooking)
          isCorrect = false;
        } else {
          isCorrect = true;
        }
        break;
      }
      case 'grammar_fix': {
        const result = verifyAnswer(
          answerToVerify,
          currentExercise.expectedAnswer,
          currentExercise.acceptableVariations,
          0.9
        );
        isCorrect = result.isCorrect;
        break;
      }
      default: {
        const result = verifyAnswer(
          answerToVerify,
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

      // Construct a precise, helpful, actionable tip for the student's mistake
      let errorTip = '';
      if (currentExercise.type === 'roleplay_prompt') {
        if (localRoleplayEval && localRoleplayEval.missingRequiredWords.length > 0) {
          errorTip = `No diálogo com "${currentExercise.targetWord}": faltou usar a palavra obrigatória "${localRoleplayEval.missingRequiredWords.join('", "')}".`;
        } else if (localRoleplayEval && localRoleplayEval.corrections.length > 0) {
          const detail = localRoleplayEval.corrections
            .map(c => `'${c.mistake}' ➔ use '${c.fix}' (${c.tip})`)
            .join('; ');
          errorTip = `No diálogo com "${currentExercise.targetWord}": ${detail}`;
        } else {
          errorTip = `No diálogo com "${currentExercise.targetWord}": lembre-se de responder em frase completa com o vocabulário obrigatório.`;
        }
      } else if (currentExercise.type === 'multiple_choice' || currentExercise.type === 'fill_blank') {
        errorTip = `Na atividade com "${currentExercise.targetWord}": a opção correta é "${currentExercise.expectedAnswer}". ${currentExercise.explanationPt || ''}`;
      } else if (currentExercise.type === 'match_pairs') {
        errorTip = `Nos pares de palavras: conecte todos os termos em inglês com suas respectivas traduções em português.`;
      } else if (currentExercise.type === 'grammar_fix') {
        errorTip = `Cuidado com "${currentExercise.targetWord}": a forma correta é "${currentExercise.expectedAnswer}". ${currentExercise.hintPt || ''}`;
      } else if (currentExercise.type === 'sentence_build' || currentExercise.type === 'listen_type') {
        errorTip = `Na atividade com "${currentExercise.targetWord}": a frase correta é "${currentExercise.expectedAnswer}" (${currentExercise.expectedAnswerPt || ''}).`;
      } else if (currentExercise.type === 'speak_verify') {
        errorTip = `Pronúncia de "${currentExercise.targetWord}": leia com clareza "${currentExercise.expectedAnswer}".`;
      } else {
        errorTip = `Atenção com "${currentExercise.targetWord}": a estrutura recomendada é "${currentExercise.expectedAnswer}".`;
      }

      setSessionErrors(prev => [
        ...prev,
        {
          targetWord: currentExercise.targetWord,
          mistake: answerToVerify,
          tip: errorTip,
        },
      ]);
    }
  };

  const handleRetry = () => {
    soundEffects.playTap();
    setUserAnswer('');
    setFeedbackStatus('idle');
    setRoleplayEvaluation(null);
    setMascotMood('idle');
  };

  const handleSkip = () => {
    if (!currentExercise) return;
    stopAllAudio();
    soundEffects.playTap();
    setFeedbackStatus('skipped');
    setMascotMood('supportive');
    setIncorrectCount(prev => prev + 1);

    const skipTip = currentExercise.type === 'roleplay_prompt'
      ? `Diálogo com "${currentExercise.targetWord}": você pulou. Resposta modelo: "${currentExercise.expectedAnswer}" (${currentExercise.expectedAnswerPt || ''}).`
      : `Atividade com "${currentExercise.targetWord}": você pulou. Resposta esperada: "${currentExercise.expectedAnswer}" (${currentExercise.expectedAnswerPt || ''}).`;

    setSessionErrors(prev => [
      ...prev,
      {
        targetWord: currentExercise.targetWord,
        mistake: userAnswer || 'Exercício pulado',
        tip: skipTip,
      },
    ]);
  };

  const handleContinue = () => {
    stopAllAudio();
    soundEffects.playTap();
    setFeedbackStatus('idle');
    setMascotMood('idle');
    setUserAnswer('');
    setRoleplayEvaluation(null);

    if (currentIndex + 1 < sortedExercises.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      onComplete?.({ xpEarned: xp, correctCount, incorrectCount });
    }
  };

  const handleRestart = () => {
    stopAllAudio();
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedbackStatus('idle');
    setRoleplayEvaluation(null);
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

  const canCheck = currentExercise.type === 'match_pairs'
    ? userAnswer === 'completed'
    : userAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col justify-between pb-48 sm:pb-36">
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

        {currentExercise.type === 'multiple_choice' && (
          <MultipleChoiceExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

        {currentExercise.type === 'match_pairs' && (
          <MatchPairsExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

        {currentExercise.type === 'fill_blank' && (
          <FillBlankExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onChangeAnswer={setUserAnswer}
            onSubmit={handleCheckAnswer}
            lang={lang}
            disabled={feedbackStatus !== 'idle'}
          />
        )}

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
        exerciseType={currentExercise.type}
        roleplayEvaluation={roleplayEvaluation}
        onCheck={handleCheckAnswer}
        onSkip={handleSkip}
        onRetry={handleRetry}
        onContinue={handleContinue}
        canCheck={canCheck}
      />
    </div>
  );
};

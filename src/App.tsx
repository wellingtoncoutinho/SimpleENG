import React, { useState, useEffect } from 'react';
import { Play, Globe, User, Award, Calendar, PlusCircle, Zap, Flame, Clock } from 'lucide-react';
import { LessonPayload } from './types/lesson';
import { UserProfile, DEFAULT_USER } from './types/user';
import { WeeklyPlan, LessonBlock } from './types/weeklyPlan';
import { BENCHMARK_DATING_LESSON } from './data/presetLessons';
import { INITIAL_WEEKLY_PLAN } from './data/defaultWeeklyPlan';
import { buildWeeklyPlan } from './utils/curriculumBuilder';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { WeeklyPlanCreator } from './components/WeeklyPlanCreator';
import { LessonGenerator } from './components/LessonGenerator';
import { LessonPlayer } from './components/LessonPlayer';
import { LearnerMascot } from './components/LearnerMascot';
import { BrandLogo } from './components/BrandLogo';
import { UserProfileModal } from './components/UserProfileModal';
import { soundEffects } from './utils/audio';
import { Language, translations } from './utils/i18n';

type AppView = 'weekly_planner' | 'weekly_creator' | 'generator' | 'player';

export default function App() {
  const [lang, setLang] = useState<Language>('pt');
  const [currentView, setCurrentView] = useState<AppView>('weekly_planner');
  const [activeLesson, setActiveLesson] = useState<LessonPayload>(BENCHMARK_DATING_LESSON);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [activeBlockContext, setActiveBlockContext] = useState<{
    dayIndex: number;
    blockId: string;
  } | null>(null);

  // User Profile State (persisted in localStorage)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('talktune_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  // Weekly Plan State (persisted in localStorage with auto-upgrade to rolling calendar)
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() => {
    try {
      const saved = localStorage.getItem('talktune_weekly_plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.days && parsed.days[0] && parsed.days[0].shortDayName) {
          return parsed;
        }
        if (parsed && parsed.topic) {
          return buildWeeklyPlan(
            parsed.topic,
            parsed.cefrLevel || 'B2',
            parsed.parsedItems || [],
            parsed.classDay || 'Quarta-feira',
            parsed.dailyMinutesGoal || 20,
            parsed.rawNotes || ''
          );
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_WEEKLY_PLAN;
  });

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    try {
      localStorage.setItem('talktune_user', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleUpdateWeeklyPlan = (updatedPlan: WeeklyPlan) => {
    setWeeklyPlan(updatedPlan);
    try {
      localStorage.setItem('talktune_weekly_plan', JSON.stringify(updatedPlan));
    } catch {
      // ignore
    }
  };

  const t = translations[lang];

  const toggleLanguage = () => {
    soundEffects.playTap();
    setLang((prev) => (prev === 'pt' ? 'en' : 'pt'));
  };

  // Start single lesson from quick generator or demo
  const handleStartLesson = (lesson: LessonPayload) => {
    setActiveLesson(lesson);
    setActiveBlockContext(null);
    setWelcomeDismissed(false);
    setCurrentView('player');
    soundEffects.playTap();
  };

  // Start a specific 5-minute block from the Weekly Planner
  const handleStartWeeklyBlock = (block: LessonBlock, dayIndex: number) => {
    setActiveLesson(block.lesson);
    setActiveBlockContext({ dayIndex, blockId: block.id });
    setWelcomeDismissed(false);
    setCurrentView('player');
    soundEffects.playTap();
  };

  // Called when user completes the lesson / block
  const handleLessonComplete = (stats: { xpEarned: number; correctCount: number }) => {
    // Award XP
    const newXp = (user.totalXp || 0) + stats.xpEarned;
    const newLessonsCount = (user.lessonsCompleted || 0) + 1;

    let updatedUser = {
      ...user,
      totalXp: newXp,
      lessonsCompleted: newLessonsCount,
    };

    // If it was a block in the weekly plan, mark it complete!
    if (activeBlockContext) {
      const { dayIndex, blockId } = activeBlockContext;
      const updatedDays = weeklyPlan.days.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;

        const updatedBlocks = day.blocks.map((b) => {
          if (b.id !== blockId) return b;
          return {
            ...b,
            isCompleted: true,
            completedAt: new Date().toISOString(),
            xpEarned: stats.xpEarned,
          };
        });

        const isDayNowComplete = updatedBlocks.every((b) => b.isCompleted);
        return {
          ...day,
          blocks: updatedBlocks,
          isCompleted: isDayNowComplete,
        };
      });

      const updatedPlan: WeeklyPlan = {
        ...weeklyPlan,
        days: updatedDays,
      };

      handleUpdateWeeklyPlan(updatedPlan);

      // Check if day completed and increment streak
      const currentDay = updatedDays[dayIndex];
      if (currentDay && currentDay.isCompleted) {
        updatedUser = {
          ...updatedUser,
          streakDays: (updatedUser.streakDays || 1) + 1,
        };
      }
    }

    handleUpdateUser(updatedUser);
  };

  const handleExitLesson = () => {
    if (activeBlockContext) {
      setCurrentView('weekly_planner');
    } else {
      setCurrentView('weekly_planner');
    }
    soundEffects.playTap();
  };

  const handlePlanCreated = (newPlan: WeeklyPlan) => {
    handleUpdateWeeklyPlan(newPlan);
    setCurrentView('weekly_planner');
    soundEffects.playCorrect();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Global Navigation Bar - Modern, Aesthetic & Clean */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div onClick={() => setCurrentView('weekly_planner')} className="cursor-pointer">
            <BrandLogo size="sm" />
          </div>

          {/* Desktop Central Navigation Tabs (hidden in lesson player and on mobile) */}
          {currentView !== 'player' && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setCurrentView('weekly_planner');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'weekly_planner'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Plano Semanal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setCurrentView('weekly_creator');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'weekly_creator'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nova Aula</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setCurrentView('generator');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'generator'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Treino Rápido</span>
              </button>
            </nav>
          )}

          {/* Right Header Navigation: Streak, Language & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Streak Counter Pill */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-700 text-xs font-bold"
              title="Sequência de dias"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>{user.streakDays || 1}</span>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 transition-all cursor-pointer"
              title="Alternar idioma"
            >
              <Globe className="w-3 h-3 text-slate-500" />
              <span>{lang === 'pt' ? 'PT' : 'EN'}</span>
            </button>

            {/* User Profile Pill */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setShowProfileModal(true);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl transition-all cursor-pointer group"
              title="Ver perfil e nível"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-800 leading-none block">
                  {user.name}
                </span>
                <span className="text-2xs font-semibold text-emerald-700 leading-none">
                  Nível {user.level}
                </span>
              </div>

              <span className="sm:hidden text-2xs font-bold text-emerald-700">
                {user.level}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar: Standardized, Non-wrapping Tabs */}
      {currentView !== 'player' && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2 sticky top-14 z-20">
          <nav className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setCurrentView('weekly_planner');
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentView === 'weekly_planner'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <Calendar className="w-3 h-3 text-emerald-600" />
              <span>Plano</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setCurrentView('weekly_creator');
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentView === 'weekly_creator'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <PlusCircle className="w-3 h-3 text-emerald-600" />
              <span>Nova Aula</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setCurrentView('generator');
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentView === 'generator'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Rápido</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        {/* VIEW 1: Weekly Planner Calendar & 4 Daily Blocks */}
        {currentView === 'weekly_planner' && (
          <WeeklyPlannerView
            plan={weeklyPlan}
            user={user}
            lang={lang}
            onStartBlock={handleStartWeeklyBlock}
            onOpenNewPlanCreator={() => setCurrentView('weekly_creator')}
          />
        )}

        {/* VIEW 2: Creator for New Class Notes */}
        {currentView === 'weekly_creator' && (
          <WeeklyPlanCreator
            user={user}
            lang={lang}
            onPlanCreated={handlePlanCreated}
            onCancel={() => setCurrentView('weekly_planner')}
          />
        )}

        {/* VIEW 3: Fast Single Workout Generator */}
        {currentView === 'generator' && (
          <LessonGenerator
            user={user}
            onStartLesson={handleStartLesson}
            onOpenProfile={() => setShowProfileModal(true)}
            onSwitchToWeeklyPlanner={() => setCurrentView('weekly_planner')}
            lang={lang}
          />
        )}

        {/* VIEW 4: Interactive Exercise Player */}
        {currentView === 'player' && (
          <>
            {/* Mascot Welcome Overlay on Lesson Start */}
            {!welcomeDismissed && activeLesson.mascotWelcome && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border-2 border-emerald-300 animate-in zoom-in-95">
                  <div className="mb-4">
                    <LearnerMascot mood="speaking" size="sm" />
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3">
                    <Award className="w-3.5 h-3.5" />
                    <span>
                      Nível {activeLesson.moduleMeta.targetLevel} · {activeLesson.moduleMeta.topic}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                    {activeLesson.mascotWelcome.greeting}
                  </h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                    {activeLesson.mascotWelcome.topicIntro}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setWelcomeDismissed(true);
                    }}
                    autoFocus
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 active:translate-y-1 text-white font-black text-base rounded-2xl shadow-[0_5px_0_#047857] transition-all cursor-pointer uppercase tracking-wider"
                  >
                    {t.letsPractice}
                  </button>
                </div>
              </div>
            )}

            <LessonPlayer
              lesson={activeLesson}
              lang={lang}
              onExit={handleExitLesson}
              onComplete={handleLessonComplete}
            />
          </>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        user={user}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdateUser={handleUpdateUser}
        lang={lang}
      />
    </div>
  );
}

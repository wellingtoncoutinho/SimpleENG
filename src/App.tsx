import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PlusCircle,
  Zap,
  Sun,
  Moon,
  Award,
  User as UserIcon,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { LessonPayload } from './types/lesson';
import { UserProfile, DEFAULT_USER } from './types/user';
import { WeeklyPlan, LessonBlock } from './types/weeklyPlan';
import { BENCHMARK_DATING_LESSON } from './data/presetLessons';
import { buildWeeklyPlan } from './utils/curriculumBuilder';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { WeeklyPlanCreator } from './components/WeeklyPlanCreator';
import { LessonGenerator } from './components/LessonGenerator';
import { LessonPlayer } from './components/LessonPlayer';
import { LearnerMascot } from './components/LearnerMascot';
import { BrandLogo } from './components/BrandLogo';
import { StreakBadge } from './components/StreakBadge';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingTour } from './components/OnboardingTour';
import { soundEffects } from './utils/audio';
import { Language, translations } from './utils/i18n';
import {
  logoutUser,
  subscribeToAuthChanges,
  saveUserProfileToCloud,
  saveWeeklyPlanToCloud,
  loadWeeklyPlanFromCloud,
} from './services/authService';

type AppView = 'weekly_planner' | 'weekly_creator' | 'generator' | 'player';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('talktune_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appLanguage) return parsed.appLanguage;
      }
    } catch {
      // ignore
    }
    return 'pt';
  });
  const [currentView, setCurrentView] = useState<AppView>('weekly_planner');
  const [activeLesson, setActiveLesson] = useState<LessonPayload | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTour, setShowTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('simpleeng_tour_seen') !== 'true';
    } catch {
      return false;
    }
  });
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [activeBlockContext, setActiveBlockContext] = useState<{
    dayIndex: number;
    blockId: string;
  } | null>(null);

  // Dark Mode State
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('simpleeng_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('simpleeng_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('simpleeng_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    soundEffects.playTap();
    setIsDark((prev) => !prev);
  };

  // User Profile State (persisted in localStorage)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('talktune_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          if ((parsed.lessonsCompleted || 0) === 0) {
            parsed.streakDays = 0;
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  // Weekly Plan State (Clean default: starts null if user never created one!)
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(() => {
    try {
      const saved = localStorage.getItem('talktune_weekly_plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.days && parsed.days.length > 0 && parsed.days[0].shortDayName) {
          return parsed;
        }
        if (parsed && parsed.topic && parsed.parsedItems && parsed.parsedItems.length > 0) {
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
    return null;
  });

  // Sync authentication state from Firebase (or localStorage fallback)
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (loggedUser) => {
      if (loggedUser) {
        setUser(loggedUser);
        if (loggedUser.appLanguage) {
          setLang(loggedUser.appLanguage);
        }
        // Load user's saved weekly plan from Firestore cloud
        if (loggedUser.id) {
          try {
            const cloudPlan = await loadWeeklyPlanFromCloud(loggedUser.id);
            if (cloudPlan) {
              setWeeklyPlan(cloudPlan);
              localStorage.setItem('talktune_weekly_plan', JSON.stringify(cloudPlan));
            }
          } catch (err) {
            console.warn('Error fetching plan from cloud:', err);
          }
        }
      } else {
        // If logged out
        setUser((prev) => (prev.isAuthenticated ? DEFAULT_USER : prev));
      }
    });

    return () => unsubscribe();
  }, []);

  const openLoginModal = () => {
    soundEffects.playTap();
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const openRegisterModal = () => {
    soundEffects.playTap();
    setAuthModalMode('register');
    setShowAuthModal(true);
  };

  const handleUpdateUser = (updated: UserProfile) => {
    const sanitized: UserProfile = {
      ...updated,
      streakDays: (updated.lessonsCompleted || 0) === 0 ? 0 : (updated.streakDays || 0),
    };
    setUser(sanitized);
    if (sanitized.appLanguage && sanitized.appLanguage !== lang) {
      setLang(sanitized.appLanguage);
    }
    try {
      localStorage.setItem('talktune_user', JSON.stringify(sanitized));
      if (sanitized.id && sanitized.isAuthenticated) {
        saveUserProfileToCloud(sanitized.id, sanitized);
      }
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    soundEffects.playTap();
    const nextLang: Language = lang === 'pt' ? 'en' : 'pt';
    setLang(nextLang);
    handleUpdateUser({
      ...user,
      appLanguage: nextLang,
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(DEFAULT_USER);
    setWeeklyPlan(null);
    localStorage.removeItem('talktune_weekly_plan');
    setShowProfileModal(false);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    handleUpdateUser(authenticatedUser);
    if (authenticatedUser.appLanguage) {
      setLang(authenticatedUser.appLanguage);
    }
    setShowAuthModal(false);
    try {
      if (localStorage.getItem('simpleeng_tour_seen') !== 'true') {
        setShowTour(true);
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateWeeklyPlan = (updatedPlan: WeeklyPlan | null) => {
    setWeeklyPlan(updatedPlan);
    try {
      if (updatedPlan) {
        localStorage.setItem('talktune_weekly_plan', JSON.stringify(updatedPlan));
      } else {
        localStorage.removeItem('talktune_weekly_plan');
      }
      if (user.id && user.isAuthenticated) {
        saveWeeklyPlanToCloud(user.id, updatedPlan);
      }
    } catch {
      // ignore
    }
  };

  const t = translations[lang];

  // Start single lesson from quick generator
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
    const newXp = (user.totalXp || 0) + stats.xpEarned;
    const newLessonsCount = (user.lessonsCompleted || 0) + 1;

    let updatedUser = {
      ...user,
      totalXp: newXp,
      lessonsCompleted: newLessonsCount,
    };

    if (activeBlockContext && weeklyPlan) {
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

      const currentDay = updatedDays[dayIndex];
      if (currentDay && currentDay.isCompleted) {
        updatedUser = {
          ...updatedUser,
          streakDays: Math.max(1, (user.streakDays || 0) + 1),
        };
      }
    }

    // If user completes their first activity, ignite streak to 1
    if ((updatedUser.streakDays || 0) === 0) {
      updatedUser = {
        ...updatedUser,
        streakDays: 1,
      };
    }

    handleUpdateUser(updatedUser);
  };

  const handleExitLesson = () => {
    setCurrentView('weekly_planner');
    soundEffects.playTap();
  };

  const handlePlanCreated = (newPlan: WeeklyPlan) => {
    handleUpdateWeeklyPlan(newPlan);
    setCurrentView('weekly_planner');
    soundEffects.playCorrect();
  };

  // Mandatory Authentication: User can only access the app after logging in
  if (!user.isAuthenticated) {
    return <LoginScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden max-w-full w-full">
      {/* Top Global Navigation Bar - Modern, Duolingo aesthetic */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 w-full">
          {/* Brand Logo */}
          <div onClick={() => setCurrentView('weekly_planner')} className="cursor-pointer">
            <BrandLogo size="sm" />
          </div>

          {/* Desktop Central Navigation Tabs (hidden in lesson player) */}
          {currentView !== 'player' && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setCurrentView('weekly_planner');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'weekly_planner'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.navWeeklyPlan}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setCurrentView('weekly_creator');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'weekly_creator'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.navNewLesson}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setCurrentView('generator');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'generator'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.navQuickPractice}</span>
              </button>

              {!user.isAuthenticated && (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.navLoginTab}</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Header Navigation: Streak, Dark Mode & User Profile */}
          <div className="flex items-center gap-2">
            {/* Interactive Motivational Streak Badge */}
            <StreakBadge
              streakDays={(user.lessonsCompleted || 0) === 0 ? 0 : (user.streakDays || 0)}
              lessonsCompleted={user.lessonsCompleted || 0}
              onStartLesson={() => {
                soundEffects.playTap();
                setCurrentView('generator');
              }}
            />

            {/* Dark Mode Switcher Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* User Profile / Auth Pill */}
            {user.isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  setShowProfileModal(true);
                }}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-2xl transition-all cursor-pointer group"
                title="Editar meu perfil"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="text-left hidden sm:block">
                  <span className="text-xs font-black text-slate-900 dark:text-white leading-none block truncate max-w-[90px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                    {t.levelLabel} {user.level}
                  </span>
                </div>

                <span className="sm:hidden text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {user.level}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Acessar minha conta"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.navLogin}</span>
                </button>

                <button
                  type="button"
                  onClick={openRegisterModal}
                  className="px-3 sm:px-3.5 py-1.5 btn-3d-green text-white font-black text-xs rounded-2xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Criar nova conta"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.navRegister}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      {currentView !== 'player' && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-slate-200/80 dark:border-slate-800 px-4 py-2 sticky top-14 z-20">
          <nav className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setCurrentView('weekly_planner');
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentView === 'weekly_planner'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.navWeeklyPlanShort}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setCurrentView('weekly_creator');
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentView === 'weekly_creator'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.navNewLesson}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setCurrentView('generator');
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentView === 'generator'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.navQuickPracticeShort}</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: Weekly Planner Calendar & 4 Daily Blocks */}
        {currentView === 'weekly_planner' && (
          <WeeklyPlannerView
            plan={weeklyPlan}
            user={user}
            lang={lang}
            onStartBlock={handleStartWeeklyBlock}
            onOpenNewPlanCreator={() => setCurrentView('weekly_creator')}
            onOpenAuth={(mode) => {
              if (mode === 'login') openLoginModal();
              else openRegisterModal();
            }}
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
        {currentView === 'player' && activeLesson && (
          <>
            {/* Mascot Welcome Overlay on Lesson Start */}
            {!welcomeDismissed && activeLesson.mascotWelcome && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border-2 border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  <div className="mb-4">
                    <LearnerMascot mood="speaking" size="sm" />
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full mb-3 border border-emerald-200 dark:border-emerald-800">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Nível {activeLesson.moduleMeta.targetLevel} · {activeLesson.moduleMeta.topic}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {activeLesson.mascotWelcome.greeting}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                    {activeLesson.mascotWelcome.topicIntro}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setWelcomeDismissed(true);
                    }}
                    autoFocus
                    className="w-full py-4 px-6 btn-3d-green text-white font-black text-sm rounded-2xl tracking-wider cursor-pointer"
                  >
                    Bora Praticar!
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
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        user={user}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onOpenTour={() => {
          setShowProfileModal(false);
          setShowTour(true);
        }}
      />

      {/* Auth Modal (Register / Login) */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Interactive Onboarding Tour (Shows on first access & re-openable from profile) */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}

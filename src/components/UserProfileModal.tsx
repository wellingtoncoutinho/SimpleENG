import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Check,
  Flame,
  Award,
  BookOpen,
  LogOut,
  Clock,
  Calendar,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { CEFRLevel } from '../types/lesson';
import { soundEffects } from '../utils/audio';
import { translations, Language } from '../utils/i18n';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout?: () => void;
  onOpenTour?: () => void;
}

const ALL_LEVELS: { level: CEFRLevel; title: string; desc: string }[] = [
  { level: 'A1', title: 'A1 - Iniciante', desc: 'Frases simples do dia a dia' },
  { level: 'A2', title: 'A2 - Básico', desc: 'Compreensão de frases simples e rotinas' },
  { level: 'B1', title: 'B1 - Intermediário', desc: 'Viagens, conversas e trabalho básico' },
  { level: 'B2', title: 'B2 - Intermediário Alto', desc: 'Fluência espontânea e reuniões' },
  { level: 'C1', title: 'C1 - Avançado', desc: 'Inglês natural, profissional e nuances' },
  { level: 'C2', title: 'C2 - Proficiente', desc: 'Domínio natural equivalente a nativo' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
  onOpenTour,
}) => {
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [phone, setPhone] = useState<string>(user.phone || '');
  const [level, setLevel] = useState<CEFRLevel>(user.level);
  const [dailyMinutesGoal, setDailyMinutesGoal] = useState<number>(user.dailyMinutesGoal || 20);
  const [classDay, setClassDay] = useState<string>(user.classDay || 'Quarta-feira');
  const [appLanguage, setAppLanguage] = useState<'pt' | 'en'>(user.appLanguage || 'pt');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync state when user or modal visibility changes
  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setLevel(user.level);
      setDailyMinutesGoal(user.dailyMinutesGoal || 20);
      setClassDay(user.classDay || 'Quarta-feira');
      setAppLanguage(user.appLanguage || 'pt');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const t = translations[appLanguage || 'pt'];

  const handleLanguageChange = (newLang: 'pt' | 'en') => {
    soundEffects.playTap();
    setAppLanguage(newLang);
    // Immediately apply language across the whole app
    onUpdateUser({
      ...user,
      appLanguage: newLang,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playTap();
    const updated: UserProfile = {
      ...user,
      name: name.trim() || 'Estudante',
      email: email.trim() || 'user@example.com',
      phone: phone.trim(),
      level,
      dailyMinutesGoal,
      classDay,
      appLanguage,
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-sm border border-emerald-300/40">
              {level}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {t.myProfile}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.profileSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-center">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <div className={`flex items-center justify-center gap-1 font-black text-sm ${
              (user.streakDays || 0) > 0 ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'
            }`}>
              <Flame className={`w-4 h-4 ${
                (user.streakDays || 0) > 0 ? 'fill-orange-500 text-orange-500' : 'text-slate-400'
              }`} />
              <span>{user.streakDays || 0} {(user.streakDays || 0) === 1 ? t.streakDay : t.streakDays}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{t.streakBadge}</div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-sm">
              <Award className="w-4 h-4" />
              <span>{user.totalXp || 0} XP</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{t.points}</div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-center gap-1 text-blue-500 font-black text-sm">
              <BookOpen className="w-4 h-4" />
              <span>{user.lessonsCompleted || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{t.lessons}</div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.name}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.phone}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* English Level Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t.levelSelectLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_LEVELS.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setLevel(item.level);
                  }}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    level === item.level
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{item.level}</span>
                    {level === item.level && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Minutes Goal & Class Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.dailyGoal}</span>
              </label>
              <select
                value={dailyMinutesGoal}
                onChange={(e) => setDailyMinutesGoal(Number(e.target.value))}
                className="w-full text-xs font-bold p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value={10}>10 {t.minutesPerDay}</option>
                <option value={15}>15 {t.minutesPerDay}</option>
                <option value={20}>20 {t.minutesPerDay}</option>
                <option value={30}>30 {t.minutesPerDay}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.classDay}</span>
              </label>
              <select
                value={classDay}
                onChange={(e) => setClassDay(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="Segunda-feira">Segunda-feira (Monday)</option>
                <option value="Terça-feira">Terça-feira (Tuesday)</option>
                <option value="Quarta-feira">Quarta-feira (Wednesday)</option>
                <option value="Quinta-feira">Quinta-feira (Thursday)</option>
                <option value="Sexta-feira">Sexta-feira (Friday)</option>
                <option value="Sábado">Sábado (Saturday)</option>
                <option value="Domingo">Domingo (Sunday)</option>
              </select>
            </div>
          </div>

          {/* App Language Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.appLanguage}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('pt')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-center ${
                  appLanguage === 'pt'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                🇧🇷 Português
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-center ${
                  appLanguage === 'en'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl text-white font-black text-xs tracking-wide flex items-center justify-center gap-2 btn-3d-green shadow-xs cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.savedSuccess}</span>
                </>
              ) : (
                <span>{t.saveChanges}</span>
              )}
            </button>

            {onOpenTour && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onOpenTour();
                }}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.viewTourAgain}</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

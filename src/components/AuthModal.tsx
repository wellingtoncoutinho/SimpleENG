import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { CEFRLevel } from '../types/lesson';
import { soundEffects } from '../utils/audio';
import { BrandLogo } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'register' | 'login';
}

const CEFR_LEVELS: { level: CEFRLevel; title: string; desc: string }[] = [
  { level: 'A1', title: 'Iniciante', desc: 'Frases simples do dia a dia' },
  { level: 'A2', title: 'Básico', desc: 'Rotinas e conversas diretas' },
  { level: 'B1', title: 'Intermediário', desc: 'Independência em conversas' },
  { level: 'B2', title: 'Intermediário Alto', desc: 'Fluência espontânea e reuniões' },
  { level: 'C1', title: 'Avançado', desc: 'Nuances e vocabulário amplo' },
  { level: 'C2', title: 'Proficiente', desc: 'Domínio natural equivalente a nativo' },
];

const DAILY_TIME_OPTIONS = [
  { minutes: 10, label: '10 min/dia', desc: 'Treino rápido' },
  { minutes: 15, label: '15 min/dia', desc: 'Foco constante' },
  { minutes: 20, label: '20 min/dia', desc: 'Recomendado ⭐' },
  { minutes: 30, label: '30 min/dia', desc: 'Imersão intensa' },
];

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('B2');
  const [dailyMinutes, setDailyMinutes] = useState<number>(20);
  const [classDay, setClassDay] = useState<string>('Quarta-feira');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('A senha precisa ter pelo menos 4 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Por favor, digite seu nome.');
        return;
      }

      const newUser: UserProfile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        level,
        dailyMinutesGoal: dailyMinutes,
        classDay,
        totalXp: 0,
        lessonsCompleted: 0,
        streakDays: 1,
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
      };

      soundEffects.playCorrect();
      onSuccess(newUser);
    } else {
      // Login mode
      // Retrieve or authenticate
      let existingUser: UserProfile | null = null;
      try {
        const saved = localStorage.getItem('talktune_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email === email.trim().toLowerCase()) {
            existingUser = parsed;
          }
        }
      } catch {
        // ignore
      }

      const loggedUser: UserProfile = existingUser || {
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        password,
        phone: '',
        level: 'B2',
        dailyMinutesGoal: 20,
        classDay: 'Quarta-feira',
        totalXp: 0,
        lessonsCompleted: 0,
        streakDays: 1,
        isAuthenticated: true,
      };

      loggedUser.isAuthenticated = true;
      soundEffects.playCorrect();
      onSuccess(loggedUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <BrandLogo size="sm" />
          {onClose && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                onClose();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab switch */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Criar Conta Gratuita
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Já Tenho Conta
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {mode === 'register' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Wellington Coutinho"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie sua senha"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telefone / WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* CEFR Level Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Qual o seu nível de inglês atual?
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CEFR_LEVELS.map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => {
                        soundEffects.playTap();
                        setLevel(item.level);
                      }}
                      className={`py-2 px-1 rounded-xl text-center border-2 transition-all cursor-pointer ${
                        level === item.level
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black shadow-xs scale-102'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black">{item.level}</div>
                      <div className="text-[10px] truncate opacity-80">{item.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily study goal & class day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Meta diária</span>
                  </label>
                  <select
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
                  >
                    {DAILY_TIME_OPTIONS.map((opt) => (
                      <option key={opt.minutes} value={opt.minutes}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dia da sua aula</span>
                  </label>
                  <select
                    value={classDay}
                    onChange={(e) => setClassDay(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 btn-3d-green shadow-sm cursor-pointer"
            >
              <span>{mode === 'register' ? 'Começar a Estudar Agora' : 'Entrar no SimpleENG'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

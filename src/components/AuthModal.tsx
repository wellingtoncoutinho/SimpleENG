import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Clock,
  Calendar,
  X,
  ArrowRight,
  Globe,
  LogIn,
  UserPlus,
  Loader2,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { CEFRLevel } from '../types/lesson';
import { soundEffects } from '../utils/audio';
import { BrandLogo } from './BrandLogo';
import { LearnerMascot } from './LearnerMascot';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  formatAuthError,
} from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';

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
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('B2');
  const [dailyMinutes, setDailyMinutes] = useState<number>(20);
  const [classDay, setClassDay] = useState<string>('Quarta-feira');
  const [appLanguage, setAppLanguage] = useState<'pt' | 'en'>('pt');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    soundEffects.playTap();

    try {
      const user = await loginWithGoogle();
      soundEffects.playCorrect();
      onSuccess(user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(formatAuthError(err));
      soundEffects.playIncorrect();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setErrorMsg(null);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Por favor, digite seu nome.');
          setIsLoading(false);
          return;
        }

        const newUser = await registerUser({
          name: name.trim(),
          email: cleanEmail,
          password,
          phone: phone.trim(),
          level,
          dailyMinutesGoal: dailyMinutes,
          classDay,
          appLanguage,
        });

        soundEffects.playCorrect();
        onSuccess(newUser);
      } else {
        // Login mode
        const loggedUser = await loginUser(cleanEmail, password);
        soundEffects.playCorrect();
        onSuccess(loggedUser);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(formatAuthError(err));
      soundEffects.playIncorrect();
    } finally {
      setIsLoading(false);
    }
  };

  const firebaseReady = isFirebaseConfigured();

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
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mascot & Welcome Banner */}
        <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40">
          <div className="shrink-0 scale-75 -my-3">
            <LearnerMascot mood={mode === 'login' ? 'speaking' : 'happy'} size="xs" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {mode === 'login' ? 'Bem-vindo(a) de volta!' : 'Crie sua conta no SimpleENG'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {mode === 'login'
                ? 'Acesse seu plano semanal e continue praticando.'
                : 'Configure seu nível e gere seu cronograma de 7 dias.'}
            </p>
          </div>
        </div>

        {/* Tab Switch: Login vs Register */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Criar Conta</span>
            </button>
          </div>
        </div>

        {/* Google 1-Click Login Button */}
        <div className="px-5 sm:px-6 pt-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-2.5 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Conectando com o Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{mode === 'login' ? 'Entrar com o Google' : 'Cadastrar com o Google'}</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center my-2.5">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              ou com e-mail
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 pt-1 space-y-4 max-h-[60vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
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
                    Senha <span className="text-slate-400 font-normal">(mínimo 6)</span>
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
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs'
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

              {/* Language Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Idioma do aplicativo / App Language</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playTap();
                      setAppLanguage('pt');
                    }}
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
                    onClick={() => {
                      soundEffects.playTap();
                      setAppLanguage('en');
                    }}
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
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 btn-3d-green shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'register' ? 'Criando sua conta...' : 'Entrando...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Começar a Estudar Agora' : 'Entrar no SimpleENG'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Mode Switch Helper */}
          <div className="text-center pt-2">
            {mode === 'register' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Faça login aqui
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className="font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Cadastre-se gratuitamente
                </button>
              </p>
            )}
          </div>

          {/* Database connection indicator */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {firebaseReady ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Conexão ativa com o banco Google Firebase</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Armazenamento local ativo • Pronto para chaves Firebase</span>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

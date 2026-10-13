import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Clock,
  Calendar,
  ArrowRight,
  Globe,
  LogIn,
  UserPlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
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

interface LoginScreenProps {
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
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

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Container - Responsive split layout on desktop, clean single-column on mobile */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto">
        {/* LEFT COLUMN: Hero & Sea Lion Mascot */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-sky-950 to-emerald-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 mb-4 sm:mb-6">
            <BrandLogo size="md" />
          </div>

          {/* Sea Lion Mascot & Friendly Speech */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
            <LearnerMascot mood={mode === 'login' ? 'speaking' : 'happy'} size="md" />

            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-3 mb-1.5 leading-snug">
              {mode === 'login' ? 'Bem-vindo de volta!' : 'Simplifique seu Inglês!'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
              {mode === 'login'
                ? 'Entre para continuar seu roteiro semanal e praticar suas anotações.'
                : 'Cadastre suas aulas de conversação e estude 20 min/dia com o Toby.'}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 pt-4 border-t border-slate-800 space-y-2 hidden sm:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Roteiro de 7 dias com base nas suas anotações</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sincronização na nuvem com Google Firebase</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Treino auditivo e fala para acelerar sua fluência</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Auth Form & Tabs */}
        <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-center">
          {/* Header Switch Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 mb-5">
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

          {/* Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Conectando com o Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              ou com e-mail
            </span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed mb-3">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-0.5">
            {mode === 'register' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Seu Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Wellington Coutinho"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* CEFR Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Seu nível de inglês atual
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
                        <div className="text-xs font-black">{item.level}</div>
                        <div className="text-[9px] truncate opacity-80">{item.title}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily study goal & class day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Idioma do aplicativo</span>
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Action button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 btn-3d-green shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'register' ? 'Criando conta...' : 'Entrando...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'register' ? 'Começar a Estudar Agora' : 'Entrar no SimpleENG'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer DB status */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Banco de dados Google Firebase conectado • Dados seguros</span>
          </div>
        </div>
      </div>
    </div>
  );
};

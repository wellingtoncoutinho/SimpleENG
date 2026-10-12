import React, { useState } from 'react';
import { X, User, Mail, Award, Check, Sparkles, LogOut } from 'lucide-react';
import { UserProfile } from '../types/user';
import { CEFRLevel } from '../types/lesson';
import { soundEffects } from '../utils/audio';
import { Language, translations } from '../utils/i18n';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  lang?: Language;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  lang = 'pt',
}) => {
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [level, setLevel] = useState<CEFRLevel>(user.level);
  const [dailyMinutesGoal, setDailyMinutesGoal] = useState<number>(user.dailyMinutesGoal || 20);
  const [classDay, setClassDay] = useState<string>(user.classDay || 'Quarta-feira');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const levels: { level: CEFRLevel; title: string; desc: string }[] = [
    { level: 'A2', title: 'A2 - Básico', desc: 'Compreensão de frases simples e rotineiras' },
    { level: 'B1', title: 'B1 - Intermediário', desc: 'Viagens, conversas e trabalho básico' },
    { level: 'B2', title: 'B2 - Intermediário Avançado', desc: 'Conversa fluida, expressões e debates' },
    { level: 'C1', title: 'C1 - Avançado', desc: 'Inglês natural, profissional e nuances' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playTap();
    const updated: UserProfile = {
      ...user,
      name: name.trim() || 'Estudante',
      email: email.trim() || 'user@example.com',
      level,
      dailyMinutesGoal,
      classDay,
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {lang === 'pt' ? 'Meu Perfil & Nível de Inglês' : 'My Profile & English Level'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {lang === 'pt' ? 'Nome do Aluno' : 'Your Name'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Well"
                className="w-full text-xs sm:text-sm font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {lang === 'pt' ? 'E-mail de Cadastro' : 'Account Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full text-xs sm:text-sm font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-800"
              />
            </div>
          </div>

          {/* English Level Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {lang === 'pt' ? 'Seu Nível Atual de Inglês (CEFR)' : 'Current English Level (CEFR)'}
            </label>
            <div className="space-y-1.5">
              {levels.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setLevel(item.level);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    level === item.level
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</div>
                    <div className="text-2xs text-slate-500 font-medium">{item.desc}</div>
                  </div>
                  {level === item.level && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Minutes Goal & Class Day */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Meta Diária
              </label>
              <select
                value={dailyMinutesGoal}
                onChange={(e) => setDailyMinutesGoal(Number(e.target.value))}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white text-slate-800"
              >
                <option value={10}>10 min / dia</option>
                <option value={15}>15 min / dia</option>
                <option value={20}>20 min / dia (Recomendado)</option>
                <option value={30}>30 min / dia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Dia da Aula
              </label>
              <select
                value={classDay}
                onChange={(e) => setClassDay(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white text-slate-800"
              >
                <option value="Segunda-feira">Segunda-feira</option>
                <option value="Terça-feira">Terça-feira</option>
                <option value="Quarta-feira">Quarta-feira</option>
                <option value="Quinta-feira">Quinta-feira</option>
                <option value="Sexta-feira">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide text-xs shadow-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>{lang === 'pt' ? 'Perfil Atualizado!' : 'Profile Saved!'}</span>
              </>
            ) : (
              <span>{lang === 'pt' ? 'Salvar Alterações' : 'Save Changes'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Zap,
  Flame,
  User,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Sparkles,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { LearnerMascot } from './LearnerMascot';
import { soundEffects } from '../utils/audio';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [phoneOsTab, setPhoneOsTab] = useState<'ios' | 'android'>('ios');

  if (!isOpen) return null;

  const handleNext = () => {
    soundEffects.playTap();
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    soundEffects.playTap();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    soundEffects.playCorrect();
    try {
      localStorage.setItem('simpleeng_tour_seen', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  const handleSkip = () => {
    soundEffects.playTap();
    try {
      localStorage.setItem('simpleeng_tour_seen', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden relative my-auto animate-in zoom-in-95">
        {/* Top Header / Progress Strip */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
              Passo {currentStep + 1} de 6
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Guia Rápido
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Pular Tour
          </button>
        </div>

        {/* Step Content */}
        <div className="p-5 sm:p-6 min-h-[380px] flex flex-col justify-between">
          {/* STEP 0: Boas-vindas do Toby */}
          {currentStep === 0 && (
            <div className="text-center animate-in fade-in">
              <div className="flex justify-center mb-4">
                <LearnerMascot mood="celebrate" size="sm" speechText="Bem-vindo ao SimpleENG!" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
                Simplificando seu Inglês! 🦭
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 max-w-md mx-auto">
                Aqui você aprende de um jeito leve, moderno e sem sobrecarga. Chega de acumular apostilas: dividimos seus estudos em <strong>blocos práticos de 5 minutos</strong> com Inteligência Artificial!
              </p>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-left text-xs space-y-1.5 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-black">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>O que você vai encontrar no app:</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pl-6">
                  • Plano semanal automático gerado pelas suas anotações de aula.<br />
                  • Treinos rápidos de 5 minutos sobre qualquer assunto.<br />
                  • Pronúncia, desafios auditivos e acompanhamento diário.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: + Nova Aula e Anotações Inteligentes */}
          {currentStep === 1 && (
            <div className="animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
                <Calendar className="w-6 h-6" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
                Cadastre suas Anotações de Aula (+ Nova Aula)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Teve uma aula de inglês ou estudou termos novos? Na aba <strong>+ Nova Aula</strong> você cola suas anotações ou digita o tema que aprendeu.
              </p>

              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <span><strong>Distribuição em 4 blocos de 5 minutos:</strong> A IA distribui o vocabulário em pequenas pílulas para cada dia da semana.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <span><strong>Sem perder aulas:</strong> Tudo fica salvo no seu perfil para você continuar de onde parou.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Treino Rápido (⚡ Rápido) */}
          {currentStep === 2 && (
            <div className="animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
                <Zap className="w-6 h-6" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
                Treino Rápido de 5 Minutos (⚡ Rápido)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Quer praticar agora mesmo sem montar uma semana inteira? A aba <strong>⚡ Rápido</strong> foi feita sob medida para momentos ágeis.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Ideal para quando você tiver 5 minutos livres no metrô, intervalo ou antes de dormir:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li>Basta digitar qualquer assunto (ex: <em>"Pedir café em Londres"</em> ou <em>"Reunião de negócios"</em>).</li>
                  <li>Ou clicar nas sugestões prontas recomendadas pelo Toby.</li>
                  <li>Lição interativa com áudio nativo na hora!</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 3: Perfil, Nível CEFR e Ofensiva */}
          {currentStep === 3 && (
            <div className="animate-in fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800">
                  <Flame className="w-6 h-6 fill-orange-500" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <User className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
                Seu Nível & O Foguinho de Ofensiva 🔥
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                No topo, clique no seu ícone de perfil para ajustar seu <strong>Nível de Inglês (A1 ao C2)</strong>, meta diária de minutos e idioma do aplicativo.
              </p>

              <div className="p-3.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 text-xs text-orange-950 dark:text-orange-200 space-y-1.5">
                <div className="flex items-center gap-2 font-black">
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                  <span>Como funciona o foguinho:</span>
                </div>
                <p className="text-[11px] text-orange-900 dark:text-orange-300">
                  Ele começa em <strong>0</strong> e se <strong>acende</strong> assim que você completa sua primeira lição. Pratique todos os dias para manter sua sequência viva!
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Instale no Celular (Adicionar à Tela Inicial) */}
          {currentStep === 4 && (
            <div className="animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Coloque o App na sua Tela Inicial! 📲
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Instale como aplicativo nativo em 10 segundos
                    </p>
                  </div>
                </div>
              </div>

              {/* OS Tabs: iPhone vs Android */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPhoneOsTab('ios')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    phoneOsTab === 'ios'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>🍎 iPhone (Safari)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPhoneOsTab('android')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    phoneOsTab === 'android'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>🤖 Android (Chrome)</span>
                </button>
              </div>

              {/* iOS Instructions */}
              {phoneOsTab === 'ios' ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <span>No <strong>Safari</strong> do iPhone, toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima <Share className="w-3.5 h-3.5 inline text-blue-500" /> na barra inferior).</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <span>Role um pouco a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" />.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <span>No canto superior direito, toque em <strong>Adicionar</strong>. Pronto! O SimpleENG vira um app direto na tela do celular!</span>
                  </div>
                </div>
              ) : (
                /* Android Instructions */
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <span>No <strong>Chrome</strong> do Android, toque nos <strong>3 pontinhos</strong> <MoreVertical className="w-3.5 h-3.5 inline text-slate-600 dark:text-slate-300" /> no canto superior direito.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <span>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong> <Download className="w-3.5 h-3.5 inline text-emerald-600" />.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <span>Toque em <strong>Instalar</strong>. O ícone oficial vai aparecer na sua tela inicial para você abrir com 1 toque!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Conclusão / Bora Treinar */}
          {currentStep === 5 && (
            <div className="text-center animate-in fade-in">
              <div className="flex justify-center mb-3">
                <LearnerMascot mood="celebrate" size="sm" speechText="Tudo pronto! You got this! 🚀" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
                Tudo Pronto para Começar! 🎉
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 max-w-sm mx-auto">
                Você já sabe tudo o que precisa. Cadastre sua primeira aula ou faça um treino rápido de 5 minutos agora mesmo.
              </p>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bons estudos e lembre-se: a consistência é a chave!</span>
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-3">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundEffects.playTap();
                    setCurrentStep(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-6 bg-emerald-500'
                      : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                  }`}
                  title={`Ir para passo ${idx + 1}`}
                />
              ))}
            </div>

            {/* Back / Next Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2.5 rounded-2xl btn-3d-green text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2.5 rounded-2xl btn-3d-green text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-sm tracking-wide"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Bora Começar!</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

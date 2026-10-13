import React, { useState } from 'react';
import { soundEffects } from '../utils/audio';

export type MascotMood = 'idle' | 'happy' | 'celebrate' | 'thinking' | 'speaking' | 'supportive';

interface LearnerMascotProps {
  mood?: MascotMood;
  speechText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  onClick?: () => void;
}

const FUN_QUOTES = [
  'Arf arf! Simplificando seu inglês! 🦭',
  'Bora praticar mais um pouco! 🌊',
  'Listening to English! 🎧',
  'Você tá mandando muito bem! ⭐',
  'Passo a passo rumo à fluência! 🚀',
  'Great job! Cada dia conta! 🔥',
];

export const LearnerMascot: React.FC<LearnerMascotProps> = ({
  mood = 'idle',
  speechText,
  size = 'md',
  className = '',
  onClick,
}) => {
  const [clickBounce, setClickBounce] = useState<boolean>(false);
  const [randomQuote, setRandomQuote] = useState<string | null>(null);

  const sizeMap = {
    xs: 'w-16 h-18',
    sm: 'w-24 h-26',
    md: 'w-32 h-36 sm:w-36 sm:h-40',
    lg: 'w-44 h-48 sm:w-52 sm:h-56',
    hero: 'w-56 h-64 sm:w-64 sm:h-72',
  };

  const handleClick = () => {
    soundEffects.playTap();
    setClickBounce(true);
    setTimeout(() => setClickBounce(false), 500);

    if (!speechText) {
      const quote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)];
      setRandomQuote(quote);
      setTimeout(() => setRandomQuote(null), 3200);
    }

    if (onClick) onClick();
  };

  const displayText = speechText || randomQuote;
  const isCelebrating = mood === 'celebrate';
  const isThinking = mood === 'thinking';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      {displayText && (
        <div className="relative mb-2.5 max-w-xs sm:max-w-sm px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-lg text-slate-800 dark:text-white text-xs sm:text-sm font-black animate-in fade-in zoom-in-95 duration-200 text-center z-20">
          <p className="leading-snug">{displayText}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-slate-900 border-r-2 border-b-2 border-emerald-500 rotate-45" />
        </div>
      )}

      {/* Animated Sea Lion Mascot */}
      <div
        onClick={handleClick}
        className={`relative ${sizeMap[size]} cursor-pointer transition-transform duration-200 ${
          clickBounce ? 'scale-110 -translate-y-2' : 'hover:scale-105 active:scale-95'
        }`}
        title="Oi! Eu sou o Toby, o leão marinho do SimpleENG! Clique em mim!"
      >
        <svg
          viewBox="0 0 200 220"
          className="w-full h-full drop-shadow-md overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes seaLionBob {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-7px) rotate(1.2deg); }
            }
            @keyframes seaLionJump {
              0%, 100% { transform: translateY(0px) scale(1); }
              40% { transform: translateY(-20px) scale(1.08); }
              70% { transform: translateY(-6px) scale(1.02); }
            }
            @keyframes flipperClapLeft {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(35deg); }
            }
            @keyframes flipperClapRight {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-35deg); }
            }
            @keyframes flipperSwimLeft {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-12deg); }
            }
            @keyframes flipperSwimRight {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(12deg); }
            }
            @keyframes seaLionBlink {
              0%, 93%, 100% { transform: scaleY(1); }
              96% { transform: scaleY(0.1); }
            }
            @keyframes bubbleFloat {
              0% { opacity: 0; transform: translateY(0) scale(0.6); }
              50% { opacity: 0.8; transform: translateY(-14px) scale(1.1); }
              100% { opacity: 0; transform: translateY(-28px) scale(0.7); }
            }
            @keyframes starTwinkle {
              0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.2; }
              50% { transform: scale(1.25) rotate(180deg); opacity: 1; }
            }

            .anim-sealion-idle {
              animation: seaLionBob 3.2s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .anim-sealion-jump {
              animation: seaLionJump 0.65s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .anim-flipper-clap-l {
              animation: flipperClapLeft 0.35s ease-in-out infinite;
              transform-origin: 50px 140px;
            }
            .anim-flipper-clap-r {
              animation: flipperClapRight 0.35s ease-in-out infinite;
              transform-origin: 150px 140px;
            }
            .anim-flipper-swim-l {
              animation: flipperSwimLeft 2.4s ease-in-out infinite;
              transform-origin: 50px 140px;
            }
            .anim-flipper-swim-r {
              animation: flipperSwimRight 2.4s ease-in-out infinite;
              transform-origin: 150px 140px;
            }
            .anim-eyes {
              animation: seaLionBlink 4s ease-in-out infinite;
              transform-origin: 100px 88px;
            }
          `}</style>

          <defs>
            {/* Sea Lion Body Gradient - Marine Blue */}
            <linearGradient id="sealBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="35%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Belly Gradient - Soft Cream Yellow */}
            <linearGradient id="sealBelly" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            {/* Snout Cream */}
            <linearGradient id="sealSnout" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            {/* Scarf / Tie Gradient - Emerald Green */}
            <linearGradient id="sealScarf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Celebration Stars / Water Bubbles */}
          {isCelebrating && (
            <g className="animate-in fade-in">
              {/* Stars */}
              <path
                d="M 30 40 L 33 48 L 42 49 L 35 55 L 37 63 L 30 58 L 23 63 L 25 55 L 18 49 L 27 48 Z"
                fill="#FBBF24"
                style={{ animation: 'starTwinkle 1.2s ease-in-out infinite' }}
              />
              <path
                d="M 170 35 L 173 43 L 182 44 L 175 50 L 177 58 L 170 53 L 163 58 L 165 50 L 158 44 L 167 43 Z"
                fill="#FBBF24"
                style={{ animation: 'starTwinkle 1.4s ease-in-out infinite 0.3s' }}
              />
              {/* Bubbles */}
              <circle cx="25" cy="90" r="5" fill="#38BDF8" opacity="0.7" style={{ animation: 'bubbleFloat 2s infinite' }} />
              <circle cx="175" cy="85" r="6" fill="#38BDF8" opacity="0.7" style={{ animation: 'bubbleFloat 2.2s infinite 0.5s' }} />
              <circle cx="160" cy="115" r="4" fill="#38BDF8" opacity="0.6" style={{ animation: 'bubbleFloat 1.8s infinite 0.8s' }} />
            </g>
          )}

          {/* Base Shadow */}
          <ellipse cx="100" cy="208" rx="55" ry="10" fill="#0F172A" opacity="0.18" />

          {/* MAIN CHARACTER GROUP */}
          <g className={isCelebrating ? 'anim-sealion-jump' : 'anim-sealion-idle'}>
            {/* Tail Flippers (Back) */}
            <path
              d="M 75 195 C 65 208 45 208 50 196 C 60 190 75 188 78 190 Z"
              fill="#0284C7"
            />
            <path
              d="M 125 195 C 135 208 155 208 150 196 C 140 190 125 188 122 190 Z"
              fill="#0284C7"
            />

            {/* Plump Sea Lion Body & Head (One cuddly pear-shaped silhouette) */}
            <path
              d="M 100 30 C 135 30 156 55 156 95 C 156 125 165 170 148 195 C 132 208 68 208 52 195 C 35 170 44 125 44 95 C 44 55 65 30 100 30 Z"
              fill="url(#sealBody)"
            />

            {/* Cute Little Sea Lion Ears (Side flaps) */}
            <path d="M 46 72 C 38 72 36 82 44 86 Z" fill="#0369A1" />
            <path d="M 154 72 C 162 72 164 82 156 86 Z" fill="#0369A1" />

            {/* Cream Belly Patch */}
            <path
              d="M 100 115 C 125 115 138 140 134 185 C 130 198 70 198 66 185 C 62 140 75 115 100 115 Z"
              fill="url(#sealBelly)"
            />

            {/* Left Front Flipper (Nadadeira Esquerda) */}
            <g className={isCelebrating ? 'anim-flipper-clap-l' : 'anim-flipper-swim-l'}>
              <path
                d="M 52 135 C 30 140 18 160 26 172 C 34 180 56 166 60 150 Z"
                fill="#0284C7"
                stroke="#0369A1"
                strokeWidth="1.5"
              />
              {/* Flipper details */}
              <path d="M 28 168 Q 38 162 48 154" stroke="#0369A1" strokeWidth="1.2" fill="none" opacity="0.6" />
            </g>

            {/* Right Front Flipper (Nadadeira Direita) */}
            <g className={isCelebrating ? 'anim-flipper-clap-r' : 'anim-flipper-swim-r'}>
              <path
                d="M 148 135 C 170 140 182 160 174 172 C 166 180 144 166 140 150 Z"
                fill="#0284C7"
                stroke="#0369A1"
                strokeWidth="1.5"
              />
              {/* Flipper details */}
              <path d="M 172 168 Q 162 162 152 154" stroke="#0369A1" strokeWidth="1.2" fill="none" opacity="0.6" />
            </g>

            {/* Cute Emerald Scarf / Bandana around neck */}
            <g>
              <path
                d="M 68 116 Q 100 128 132 116 Q 100 134 68 116 Z"
                fill="url(#sealScarf)"
              />
              {/* Knot / Badge */}
              <circle cx="100" cy="125" r="5" fill="#10B981" stroke="#047857" strokeWidth="1" />
              <path d="M 97 127 L 94 140 L 102 136 L 106 140 L 103 127 Z" fill="#059669" />
            </g>

            {/* Snout (Focinho fofinho arredondado de leão marinho) */}
            <ellipse cx="100" cy="100" rx="24" ry="16" fill="url(#sealSnout)" />

            {/* Whiskers (Bigodes fofos) */}
            {/* Left whiskers */}
            <path d="M 82 98 Q 62 95 50 96" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 82 102 Q 62 104 52 109" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Right whiskers */}
            <path d="M 118 98 Q 138 95 150 96" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 118 102 Q 138 104 148 109" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* Whiskers root dots */}
            <circle cx="86" cy="99" r="1.2" fill="#64748B" />
            <circle cx="89" cy="103" r="1.2" fill="#64748B" />
            <circle cx="114" cy="99" r="1.2" fill="#64748B" />
            <circle cx="111" cy="103" r="1.2" fill="#64748B" />

            {/* Shiny Black Nose */}
            <path
              d="M 94 92 C 94 89 106 89 106 92 C 106 96 102 99 100 99 C 98 99 94 96 94 92 Z"
              fill="#0F172A"
            />
            {/* Nose highlight */}
            <circle cx="98" cy="92" r="1.5" fill="#FFFFFF" />

            {/* Mouth */}
            {isCelebrating || mood === 'speaking' ? (
              // Open joyful mouth with pink tongue
              <g>
                <path
                  d="M 92 103 Q 100 114 108 103 Z"
                  fill="#881337"
                />
                <path
                  d="M 95 107 Q 100 114 105 107 Z"
                  fill="#FB7185"
                />
                <path d="M 92 103 Q 100 106 108 103" stroke="#0F172A" strokeWidth="1.8" fill="none" />
              </g>
            ) : isThinking ? (
              // Thoughtful quizzical mouth
              <path
                d="M 94 103 Q 98 105 105 101"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              // Cute sweet W smile
              <path
                d="M 92 102 Q 96 107 100 102 Q 104 107 108 102"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Rosy Cheeks */}
            <circle cx="72" cy="97" r="7.5" fill="#FB7185" opacity="0.45" />
            <circle cx="128" cy="97" r="7.5" fill="#FB7185" opacity="0.45" />

            {/* Big Sparkling Cartoon Eyes (Duolingo Style!) */}
            <g className="anim-eyes">
              {/* Left Eye */}
              <ellipse cx="78" cy="74" rx="10" ry="12" fill="#0F172A" />
              {/* Primary catchlight */}
              <circle cx="75" cy="70" r="4.2" fill="#FFFFFF" />
              {/* Secondary catchlight */}
              <circle cx="82" cy="77" r="2.2" fill="#FFFFFF" />

              {/* Right Eye */}
              <ellipse cx="122" cy="74" rx="10" ry="12" fill="#0F172A" />
              {/* Primary catchlight */}
              <circle cx="119" cy="70" r="4.2" fill="#FFFFFF" />
              {/* Secondary catchlight */}
              <circle cx="126" cy="77" r="2.2" fill="#FFFFFF" />

              {/* Cute Eyebrows */}
              <path d="M 70 58 Q 78 54 86 58" stroke="#0369A1" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M 114 58 Q 122 54 130 58" stroke="#0369A1" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            </g>

            {/* Wireless White Headphones (Study Theme) */}
            <g>
              {/* Headband */}
              <path
                d="M 52 70 C 52 35 148 35 148 70"
                stroke="#E2E8F0"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 60 52 C 75 42 125 42 140 52"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Left Ear Cushion */}
              <rect x="42" y="64" width="10" height="20" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="47" cy="74" r="2" fill="#10B981" />
              {/* Right Ear Cushion */}
              <rect x="148" y="64" width="10" height="20" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="153" cy="74" r="2" fill="#10B981" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

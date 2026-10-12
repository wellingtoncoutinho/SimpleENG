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
  'Simplificando seu inglês!',
  'Bora praticar!',
  'Listening to English! 🎧',
  'Passo a passo rumo à fluência!',
  'Great job!',
  'Cada dia conta! 🔥',
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
    xs: 'w-16 h-20',
    sm: 'w-24 h-28',
    md: 'w-32 h-40 sm:w-36 sm:h-44',
    lg: 'w-44 h-56 sm:w-52 sm:h-64',
    hero: 'w-56 h-72 sm:w-64 sm:h-80',
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

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      {displayText && (
        <div className="relative mb-3 max-w-xs sm:max-w-sm px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-lg text-slate-800 dark:text-white text-xs sm:text-sm font-black animate-in fade-in zoom-in-95 duration-200 text-center z-20">
          <p className="leading-snug">{displayText}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-slate-900 border-r-2 border-b-2 border-emerald-500 rotate-45" />
        </div>
      )}

      {/* Animated Character */}
      <div
        onClick={handleClick}
        className={`relative ${sizeMap[size]} cursor-pointer transition-transform duration-200 ${
          clickBounce ? 'scale-110 -translate-y-2' : 'hover:scale-105 active:scale-95'
        }`}
        title="Clique em mim para dar um toque!"
      >
        <svg
          viewBox="0 0 200 250"
          className="w-full h-full drop-shadow-md overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes mascotSway {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-6px) rotate(0.8deg); }
            }
            @keyframes mascotJump {
              0%, 100% { transform: translateY(0px) scale(1); }
              40% { transform: translateY(-18px) scale(1.06); }
              70% { transform: translateY(-6px) scale(1.02); }
            }
            @keyframes mascotHeadBob {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-3px) rotate(-1.5deg); }
            }
            @keyframes eyeBlinkAnim {
              0%, 94%, 100% { transform: scaleY(1); }
              97% { transform: scaleY(0.1); }
            }
            @keyframes wavePulse {
              0% { opacity: 0.1; transform: scale(0.9); }
              50% { opacity: 0.8; transform: scale(1.2); }
              100% { opacity: 0.1; transform: scale(0.9); }
            }
            @keyframes starSpin {
              0% { transform: rotate(0deg) scale(0.8); opacity: 0.4; }
              50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
              100% { transform: rotate(360deg) scale(0.8); opacity: 0.4; }
            }

            .anim-idle {
              animation: mascotSway 3s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .anim-celebrate {
              animation: mascotJump 0.65s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .anim-head {
              animation: mascotHeadBob 2s ease-in-out infinite;
              transform-origin: 100px 105px;
            }
            .anim-eyes {
              animation: eyeBlinkAnim 3.6s infinite;
              transform-origin: 100px 92px;
            }
            .anim-pulse {
              animation: wavePulse 1.2s ease-out infinite;
              transform-origin: center;
            }
            .anim-star {
              animation: starSpin 2s linear infinite;
              transform-origin: center;
            }
          `}</style>

          <defs>
            {/* Skin Gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE0C8" />
              <stop offset="100%" stopColor="#F5C4A6" />
            </linearGradient>

            {/* Hair Gradient - Light Brown / Dirty Blonde (Loirinho) */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E5B580" />
              <stop offset="40%" stopColor="#C89255" />
              <stop offset="100%" stopColor="#986332" />
            </linearGradient>

            {/* Hair Shadow */}
            <linearGradient id="hairShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A8713D" />
              <stop offset="100%" stopColor="#7E4C24" />
            </linearGradient>

            {/* T-Shirt Gradient (Dark Slate / Charcoal) */}
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#333844" />
              <stop offset="100%" stopColor="#1E222A" />
            </linearGradient>

            {/* Blue Jeans Gradient */}
            <linearGradient id="jeansGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3E6895" />
              <stop offset="100%" stopColor="#254366" />
            </linearGradient>

            {/* Shoes */}
            <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A2E36" />
              <stop offset="100%" stopColor="#13161C" />
            </linearGradient>
          </defs>

          {/* Root Group */}
          <g className={mood === 'celebrate' ? 'anim-celebrate' : 'anim-idle'}>
            {/* Ground Shadow */}
            <ellipse cx="100" cy="242" rx="48" ry="7" fill="#000000" opacity="0.16" />

            {/* Celebrate Star Bursts */}
            {mood === 'celebrate' && (
              <g className="anim-star">
                <path d="M 35 45 L 38 52 L 45 55 L 38 58 L 35 65 L 32 58 L 25 55 L 32 52 Z" fill="#F59E0B" />
                <path d="M 165 45 L 168 52 L 175 55 L 168 58 L 165 65 L 162 58 L 155 55 L 162 52 Z" fill="#10B981" />
                <circle cx="50" cy="30" r="3" fill="#10B981" />
                <circle cx="150" cy="30" r="3" fill="#F59E0B" />
              </g>
            )}

            {/* LEGS & SHOES */}
            {/* Left Leg */}
            <g>
              <rect x="74" y="184" width="22" height="40" rx="6" fill="url(#jeansGrad)" stroke="#111827" strokeWidth="2.5" />
              <rect x="73" y="218" width="24" height="6" rx="2" fill="#94A3B8" stroke="#111827" strokeWidth="1.5" />
              {/* Left Shoe */}
              <path d="M 64 236 C 64 226 78 226 90 226 C 98 226 98 236 98 240 L 64 240 Z" fill="url(#shoeGrad)" stroke="#111827" strokeWidth="2" />
              <rect x="63" y="238" width="37" height="4.5" rx="2" fill="#FFFFFF" stroke="#111827" strokeWidth="1.5" />
            </g>

            {/* Right Leg */}
            <g>
              <rect x="104" y="184" width="22" height="40" rx="6" fill="url(#jeansGrad)" stroke="#111827" strokeWidth="2.5" />
              <rect x="103" y="218" width="24" height="6" rx="2" fill="#94A3B8" stroke="#111827" strokeWidth="1.5" />
              {/* Right Shoe */}
              <path d="M 102 240 C 102 236 102 226 110 226 C 122 226 136 226 136 236 L 136 240 Z" fill="url(#shoeGrad)" stroke="#111827" strokeWidth="2" />
              <rect x="100" y="238" width="38" height="4.5" rx="2" fill="#FFFFFF" stroke="#111827" strokeWidth="1.5" />
            </g>

            {/* TORSO / T-SHIRT */}
            <g>
              <path
                d="M 68 142 C 64 150 62 182 66 192 C 72 196 128 196 134 192 C 138 182 136 150 132 142 C 122 139 100 139 100 139 C 100 139 78 139 68 142 Z"
                fill="url(#shirtGrad)"
                stroke="#111827"
                strokeWidth="2.8"
              />
              {/* Collar */}
              <path d="M 86 141 Q 100 152 114 141" stroke="#475569" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              {/* Emerald soundwave logo on chest */}
              <path d="M 94 164 L 94 168 M 98 161 L 98 171 M 102 159 L 102 173 M 106 163 L 106 169" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* ARMS */}
            {mood === 'celebrate' ? (
              /* Arms Raised Celebrating Victory! */
              <g>
                <path d="M 68 150 Q 42 120 46 98 Q 54 94 62 102 Q 62 124 74 152" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="50" cy="94" r="8" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
                {/* Peace / Victory Fingers */}
                <path d="M 47 90 L 44 80 M 53 90 L 56 80" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />

                <path d="M 132 150 Q 158 120 154 98 Q 146 94 138 102 Q 138 124 126 152" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="150" cy="94" r="8" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
                <path d="M 147 90 L 144 80 M 153 90 L 156 80" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
              </g>
            ) : mood === 'thinking' ? (
              /* Touching Earphone in Thought */
              <g>
                {/* Left hand on hip */}
                <path d="M 68 148 Q 50 162 55 182 Q 62 186 70 178" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="59" cy="180" r="7" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
                {/* Right hand touching earbud */}
                <path d="M 132 148 Q 152 138 148 106 Q 142 96 136 102" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="144" cy="102" r="7.5" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
              </g>
            ) : mood === 'supportive' || mood === 'happy' ? (
              /* Thumbs Up! */
              <g>
                <path d="M 68 148 Q 50 162 55 182 Q 62 186 70 178" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="59" cy="180" r="7" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
                {/* Right arm forward with thumbs up */}
                <path d="M 132 148 Q 154 158 146 174" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="146" cy="174" r="7.5" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
                <path d="M 146 170 L 146 160" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            ) : (
              /* Idle - Hand on hip, other relaxed (like the photo) */
              <g>
                {/* Left arm on hip */}
                <path d="M 68 148 Q 50 162 54 182 Q 62 186 70 178" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="58" cy="181" r="7" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
                {/* Right arm relaxed */}
                <path d="M 132 148 Q 148 162 144 184 Q 138 186 130 178" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
                <circle cx="142" cy="184" r="7" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />
              </g>
            )}

            {/* WHITE EARPHONE WIRES */}
            <g>
              <path d="M 50 102 Q 68 148 100 160" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M 150 102 Q 132 148 100 160" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <circle cx="100" cy="160" r="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
              <path d="M 100 162 Q 108 178 116 190" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>

            {/* HEAD GROUP (with Head Bobbing Animation) */}
            <g className="anim-head">
              {/* Neck */}
              <rect x="90" y="130" width="20" height="18" rx="5" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2" />

              {/* Ears */}
              <ellipse cx="44" cy="98" rx="9" ry="12" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />
              <ellipse cx="156" cy="98" rx="9" ry="12" fill="url(#skinGrad)" stroke="#111827" strokeWidth="2.5" />

              {/* White In-Ear Earbuds */}
              <ellipse cx="46" cy="98" rx="5" ry="6.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <rect x="45" y="101" width="3" height="7" rx="1.5" fill="#FFFFFF" />

              <ellipse cx="154" cy="98" rx="5" ry="6.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <rect x="152" y="101" width="3" height="7" rx="1.5" fill="#FFFFFF" />

              {/* Sound ripples when speaking or music */}
              {(mood === 'speaking' || mood === 'celebrate') && (
                <>
                  <path d="M 32 90 Q 26 98 32 106" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" className="anim-pulse" />
                  <path d="M 168 90 Q 174 98 168 106" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" className="anim-pulse" />
                </>
              )}

              {/* Face Shape (Cute Chubby Cheeks Caricature) */}
              <path
                d="M 48 86 C 44 126 68 142 100 142 C 132 142 156 126 152 86 C 152 50 128 38 100 38 C 72 38 48 50 48 86 Z"
                fill="url(#skinGrad)"
                stroke="#111827"
                strokeWidth="3.2"
              />

              {/* Soft Rosy Cheeks */}
              <circle cx="62" cy="110" r="7" fill="#F43F5E" opacity="0.32" />
              <circle cx="138" cy="110" r="7" fill="#F43F5E" opacity="0.32" />

              {/* Cute Stylized Goatee & Mustache (Bigodinho Loirinho/Castanho) */}
              {/* Mustache */}
              <path d="M 85 116 Q 100 112 115 116" stroke="#986332" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Soul patch under lip */}
              <ellipse cx="100" cy="126" rx="3.5" ry="2" fill="#986332" opacity="0.85" />
              {/* Jawline stubble / Goatee */}
              <path
                d="M 86 132 Q 100 138 114 132"
                stroke="#986332"
                strokeWidth="2.4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="2,2"
              />

              {/* Smile / Mouth */}
              {mood === 'celebrate' || mood === 'happy' ? (
                /* Big Open Joyful Smile */
                <path d="M 88 118 Q 100 132 112 118 Z" fill="#991B1B" stroke="#111827" strokeWidth="2.4" strokeLinejoin="round" />
              ) : mood === 'speaking' ? (
                /* Talking Mouth */
                <ellipse cx="100" cy="122" rx="7" ry="5.5" fill="#991B1B" stroke="#111827" strokeWidth="2" />
              ) : mood === 'thinking' ? (
                /* Wry curious smile */
                <path d="M 92 121 Q 102 121 110 118" stroke="#111827" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              ) : (
                /* Warm friendly grin */
                <path d="M 88 118 Q 100 126 112 118" stroke="#111827" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              )}

              {/* Nose */}
              <path d="M 100 102 L 97 108 L 102 108" stroke="#D99B78" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Big Expressive Cartoon Eyes (with Blinking Animation) */}
              <g className="anim-eyes">
                {/* Left Eye */}
                <ellipse cx="76" cy="94" rx="8" ry="11" fill="#FFFFFF" stroke="#111827" strokeWidth="2.2" />
                <ellipse cx="77" cy="94" rx="5.5" ry="8" fill="#452715" />
                <circle cx="79" cy="91" r="2.8" fill="#FFFFFF" />
                <circle cx="75" cy="97" r="1.4" fill="#FFFFFF" />

                {/* Right Eye */}
                <ellipse cx="124" cy="94" rx="8" ry="11" fill="#FFFFFF" stroke="#111827" strokeWidth="2.2" />
                <ellipse cx="123" cy="94" rx="5.5" ry="8" fill="#452715" />
                <circle cx="125" cy="91" r="2.8" fill="#FFFFFF" />
                <circle cx="121" cy="97" r="1.4" fill="#FFFFFF" />
              </g>

              {/* Eyebrows */}
              {mood === 'thinking' ? (
                <g>
                  <path d="M 68 80 Q 77 74 86 81" stroke="#875628" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 114 84 Q 123 78 132 80" stroke="#875628" strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <path d="M 68 81 Q 78 75 86 81" stroke="#875628" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 114 81 Q 122 75 132 81" stroke="#875628" strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
              )}

              {/* HAIR (Loirinho / Castanho Claro Estilizado com mechas) */}
              {/* Back Hair Volume */}
              <path
                d="M 44 80 C 40 40 60 22 100 22 C 140 22 160 40 156 80 C 158 72 164 56 156 46 C 146 30 126 18 100 18 C 74 18 54 30 44 46 C 36 56 42 72 44 80 Z"
                fill="url(#hairShadow)"
              />
              {/* Main Hair Shell & Bangs */}
              <path
                d="M 42 78 C 40 50 56 26 100 26 C 144 26 160 50 158 78 C 156 70 150 50 140 46 C 130 42 120 54 110 44 C 100 34 94 48 84 42 C 72 36 60 46 54 58 C 48 68 44 76 42 78 Z"
                fill="url(#hairGrad)"
                stroke="#111827"
                strokeWidth="2.8"
              />
              {/* Textured Spikes and Highlights on top */}
              <path d="M 52 56 Q 66 64 74 74 Q 86 52 98 66 Q 110 54 122 66 Q 134 56 146 68" fill="url(#hairGrad)" stroke="#111827" strokeWidth="2.2" />
              {/* Blonde highlight streaks */}
              <path d="M 76 34 Q 96 30 118 36" stroke="#FDE68A" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
              <path d="M 64 44 Q 82 40 94 48" stroke="#FDE68A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

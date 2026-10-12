import React from 'react';

export type MascotMood = 'idle' | 'happy' | 'celebrate' | 'thinking' | 'speaking' | 'supportive';

interface LearnerMascotProps {
  mood?: MascotMood;
  speechText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  onClick?: () => void;
}

export const LearnerMascot: React.FC<LearnerMascotProps> = ({
  mood = 'idle',
  speechText,
  size = 'md',
  className = '',
  onClick,
}) => {
  // Proportional sizing
  const sizeMap = {
    xs: 'w-14 h-16',
    sm: 'w-20 h-24',
    md: 'w-28 h-32 sm:w-32 sm:h-36',
    lg: 'w-40 h-44 sm:w-44 sm:h-48',
    hero: 'w-48 h-56 sm:w-56 sm:h-64',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Friendly Speech Bubble */}
      {speechText && (
        <div className="relative mb-2.5 max-w-xs sm:max-w-sm px-4 py-2.5 bg-white border-2 border-emerald-500 rounded-2xl shadow-md text-slate-800 text-xs sm:text-sm font-bold animate-in fade-in zoom-in-95 duration-200 text-center">
          <p className="leading-snug">{speechText}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-emerald-500 rotate-45" />
        </div>
      )}

      {/* Animated Chibi Character */}
      <div
        onClick={onClick}
        className={`relative ${sizeMap[size]} cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95`}
      >
        <svg
          viewBox="0 0 200 230"
          className="w-full h-full drop-shadow-md overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes chibiFloat {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
            }
            @keyframes chibiJump {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-12px) scale(1.04); }
            }
            @keyframes eyeBlink {
              0%, 92%, 100% { transform: scaleY(1); }
              96% { transform: scaleY(0.1); }
            }
            @keyframes earphonePulse {
              0% { opacity: 0.2; transform: scale(0.9); }
              50% { opacity: 0.9; transform: scale(1.15); }
              100% { opacity: 0.2; transform: scale(0.9); }
            }
            .animate-chibi-idle {
              animation: chibiFloat 2.6s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .animate-chibi-celebrate {
              animation: chibiJump 0.65s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .mascot-eye {
              animation: eyeBlink 3.8s infinite;
              transform-origin: center 85px;
            }
            .pulse-sound {
              animation: earphonePulse 1.4s ease-out infinite;
              transform-origin: center;
            }
          `}</style>

          <defs>
            {/* Skin Tone - Soft warm peach */}
            <linearGradient id="chibiSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE0C8" />
              <stop offset="100%" stopColor="#F9CBB0" />
            </linearGradient>

            {/* Hair - Warm modern chestnut brown with soft highlight */}
            <linearGradient id="chibiHair" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7E4A28" />
              <stop offset="50%" stopColor="#633519" />
              <stop offset="100%" stopColor="#4A230E" />
            </linearGradient>

            {/* Black T-shirt */}
            <linearGradient id="chibiShirt" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#333842" />
              <stop offset="100%" stopColor="#1C1F26" />
            </linearGradient>

            {/* Blue Denim Jeans */}
            <linearGradient id="chibiJeans" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B6790" />
              <stop offset="100%" stopColor="#244566" />
            </linearGradient>

            {/* Sneaker Sole */}
            <linearGradient id="chibiShoes" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D3139" />
              <stop offset="100%" stopColor="#1A1C22" />
            </linearGradient>
          </defs>

          {/* Root Group with Idle/Celebrate Animations */}
          <g className={mood === 'celebrate' ? 'animate-chibi-celebrate' : 'animate-chibi-idle'}>
            
            {/* Soft Shadow on ground */}
            <ellipse cx="100" cy="222" rx="46" ry="6" fill="#000000" opacity="0.12" />

            {/* BODY / LEGS & SNEAKERS */}
            {/* Left Leg & Shoe */}
            <g>
              <rect x="76" y="174" width="18" height="32" rx="5" fill="url(#chibiJeans)" stroke="#1E293B" strokeWidth="2.5" />
              {/* Rolled Cuff */}
              <rect x="75" y="200" width="20" height="5" rx="2" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />
              {/* Left Shoe */}
              <path d="M 68 214 C 68 206 82 206 92 206 C 98 206 98 214 98 217 L 68 217 Z" fill="url(#chibiShoes)" stroke="#0F172A" strokeWidth="2" />
              {/* White Shoe Sole */}
              <rect x="67" y="215" width="32" height="4" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            </g>

            {/* Right Leg & Shoe */}
            <g>
              <rect x="106" y="174" width="18" height="32" rx="5" fill="url(#chibiJeans)" stroke="#1E293B" strokeWidth="2.5" />
              {/* Rolled Cuff */}
              <rect x="105" y="200" width="20" height="5" rx="2" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />
              {/* Right Shoe */}
              <path d="M 102 217 C 102 214 102 206 108 206 C 118 206 132 206 132 214 L 132 217 Z" fill="url(#chibiShoes)" stroke="#0F172A" strokeWidth="2" />
              {/* White Shoe Sole */}
              <rect x="101" y="215" width="32" height="4" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            </g>

            {/* TORSO / BLACK T-SHIRT */}
            <g>
              {/* Main rounded shirt */}
              <path
                d="M 72 136 C 68 142 66 172 68 180 C 72 184 128 184 132 180 C 134 172 132 142 128 136 C 118 134 100 134 100 134 C 100 134 82 134 72 136 Z"
                fill="url(#chibiShirt)"
                stroke="#0F172A"
                strokeWidth="2.8"
              />
              {/* Clean crew neck collar */}
              <path d="M 88 135 Q 100 144 112 135" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>

            {/* ARMS & HANDS */}
            {mood === 'celebrate' ? (
              /* Arms Raised High Celebrating! */
              <g>
                {/* Left Arm Up */}
                <path d="M 70 144 Q 50 115 52 98 Q 58 92 65 98 Q 66 116 75 142" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="56" cy="95" r="7" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
                {/* Right Arm Up */}
                <path d="M 130 144 Q 150 115 148 98 Q 142 92 135 98 Q 134 116 125 142" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="144" cy="95" r="7" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
              </g>
            ) : mood === 'thinking' ? (
              /* Hand Touching Earphone Thinking */
              <g>
                {/* Left Arm relaxed on hip */}
                <path d="M 72 142 Q 55 155 60 174 Q 66 178 72 172" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="64" cy="174" r="6" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
                {/* Right Arm touching earbud */}
                <path d="M 128 142 Q 146 136 142 108 Q 138 98 132 102" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="138" cy="102" r="6.5" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
              </g>
            ) : mood === 'supportive' ? (
              /* Thumbs up! */
              <g>
                {/* Left Arm on hip */}
                <path d="M 72 142 Q 55 155 60 174 Q 66 178 72 172" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="64" cy="174" r="6" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
                {/* Right Arm forward with thumbs up */}
                <path d="M 128 142 Q 148 152 142 165" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="142" cy="165" r="6.5" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
                {/* Thumb sticking up */}
                <path d="M 142 162 L 142 154" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              /* Natural friendly posture (one hand on waist, one relaxed) like in the photo */
              <g>
                {/* Left Arm on hip */}
                <path d="M 72 142 Q 55 155 58 174 Q 64 178 72 172" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="62" cy="173" r="6.5" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
                {/* Right Arm relaxed beside body */}
                <path d="M 128 142 Q 142 156 138 176 Q 132 178 126 170" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="136" cy="176" r="6.5" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />
              </g>
            )}

            {/* WHITE EARPHONE WIRES (Draping on black shirt) */}
            <g>
              {/* Left wire from ear to chest */}
              <path d="M 52 98 Q 66 138 100 152" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              {/* Right wire from ear to chest */}
              <path d="M 148 98 Q 134 138 100 152" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              {/* Wire splitter and cord down */}
              <circle cx="100" cy="152" r="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
              <path d="M 100 154 Q 106 168 112 178" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>

            {/* CHIBI HEAD & CUTE ROUND FACE */}
            <g>
              {/* Neck */}
              <rect x="91" y="125" width="18" height="15" rx="4" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2" />

              {/* Ears */}
              {/* Left Ear */}
              <ellipse cx="48" cy="94" rx="8" ry="11" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />
              {/* Right Ear */}
              <ellipse cx="152" cy="94" rx="8" ry="11" fill="url(#chibiSkin)" stroke="#0F172A" strokeWidth="2.5" />

              {/* White In-Ear Earbuds inside ears */}
              <ellipse cx="50" cy="94" rx="4" ry="5.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <rect x="49" y="97" width="3" height="6" rx="1.5" fill="#FFFFFF" />
              
              <ellipse cx="150" cy="94" rx="4" ry="5.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <rect x="148" y="97" width="3" height="6" rx="1.5" fill="#FFFFFF" />

              {/* Sound waves from earphones when speaking */}
              {mood === 'speaking' && (
                <>
                  <path d="M 36 86 Q 32 94 36 102" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" className="pulse-sound" />
                  <path d="M 164 86 Q 168 94 164 102" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" className="pulse-sound" />
                </>
              )}

              {/* Cute Chibi Head Shape (Chubby, friendly cheeks) */}
              <path
                d="M 52 82 C 48 118 70 134 100 134 C 130 134 152 118 148 82 C 148 50 126 40 100 40 C 74 40 52 50 52 82 Z"
                fill="url(#chibiSkin)"
                stroke="#0F172A"
                strokeWidth="3.2"
              />

              {/* Soft Rosy Cheeks (Gives that adorable friendly anime/chibi look!) */}
              <ellipse cx="64" cy="102" rx="7" ry="4" fill="#F472B6" opacity="0.45" />
              <ellipse cx="136" cy="102" rx="7" ry="4" fill="#F472B6" opacity="0.45" />

              {/* Cute trimmed stubble/beard shadow (Soft & clean, not creepy) */}
              <path
                d="M 85 116 Q 100 122 115 116"
                stroke="#8C532B"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.45"
              />
              <path
                d="M 92 124 Q 100 129 108 124"
                stroke="#8C532B"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.45"
              />

              {/* Cute small button nose */}
              <circle cx="100" cy="94" r="2.2" fill="#D97706" opacity="0.6" />

              {/* MOUTH */}
              {mood === 'speaking' ? (
                /* Talking animated mouth */
                <path d="M 91 104 Q 100 116 109 104 Q 100 109 91 104 Z" fill="#E11D48" stroke="#0F172A" strokeWidth="2" />
              ) : mood === 'celebrate' || mood === 'happy' ? (
                /* Wide happy open smile */
                <path d="M 88 103 Q 100 118 112 103 Q 100 108 88 103 Z" fill="#E11D48" stroke="#0F172A" strokeWidth="2" />
              ) : (
                /* Warm friendly smile */
                <path d="M 89 103 Q 100 112 111 103" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
              )}

              {/* EYES */}
              {mood === 'celebrate' || mood === 'happy' ? (
                /* Joyful Crescent Anime Eyes */
                <g>
                  <path d="M 70 86 Q 81 74 92 86" stroke="#0F172A" strokeWidth="4.2" fill="none" strokeLinecap="round" />
                  <path d="M 108 86 Q 119 74 130 86" stroke="#0F172A" strokeWidth="4.2" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                /* Large, Bright Cartoon Anime Eyes with Specular Highlights */
                <g className="mascot-eye">
                  {/* Left Eye */}
                  <ellipse cx="80" cy="85" rx="10" ry="12" fill="#1E1610" />
                  {/* Big white catchlight */}
                  <circle cx="83" cy="81" r="4.2" fill="#FFFFFF" />
                  {/* Small secondary reflection */}
                  <circle cx="77" cy="88" r="1.8" fill="#FFFFFF" />

                  {/* Right Eye */}
                  <ellipse cx="120" cy="85" rx="10" ry="12" fill="#1E1610" />
                  {/* Big white catchlight */}
                  <circle cx="123" cy="81" r="4.2" fill="#FFFFFF" />
                  {/* Small secondary reflection */}
                  <circle cx="117" cy="88" r="1.8" fill="#FFFFFF" />
                </g>
              )}

              {/* EYEBROWS */}
              <path d="M 70 69 Q 81 64 91 70" stroke="#5C3317" strokeWidth="3.6" strokeLinecap="round" fill="none" />
              <path d="M 109 70 Q 119 64 130 69" stroke="#5C3317" strokeWidth="3.6" strokeLinecap="round" fill="none" />

              {/* HAIR - Stylish Spiky Anime Haircut (Warm Brown) */}
              {/* Back & Base Hair */}
              <path
                d="M 46 75 C 40 48 56 26 80 18 C 96 14 115 16 130 22 C 150 30 162 48 154 75 C 160 62 152 48 144 42 C 140 28 122 18 100 18 C 76 18 58 28 52 48 C 48 58 46 68 46 75 Z"
                fill="url(#chibiHair)"
                stroke="#2A1409"
                strokeWidth="3.2"
              />

              {/* Cute bangs framing face */}
              <path
                d="M 48 68 Q 66 54 82 66 Q 88 50 102 48 Q 116 46 128 62 Q 138 52 152 68 Q 148 48 132 38 Q 100 28 68 38 Q 50 48 48 68 Z"
                fill="url(#chibiHair)"
                stroke="#2A1409"
                strokeWidth="3"
              />

              {/* Top Hair Spikes */}
              <path d="M 72 26 Q 84 12 100 16 Q 88 24 82 32" fill="url(#chibiHair)" stroke="#2A1409" strokeWidth="2.5" />
              <path d="M 106 14 Q 124 10 134 24 Q 122 28 116 34" fill="url(#chibiHair)" stroke="#2A1409" strokeWidth="2.5" />

              {/* Hair Gloss Highlight */}
              <path d="M 68 34 Q 85 24 110 24" stroke="#9A6540" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>

            {/* Sparkles when celebrating */}
            {mood === 'celebrate' && (
              <g>
                <path d="M 28 50 L 31 58 L 39 60 L 31 62 L 28 70 L 25 62 L 17 60 L 25 58 Z" fill="#FBBF24" />
                <path d="M 172 50 L 175 58 L 183 60 L 175 62 L 172 70 L 169 62 L 161 60 L 169 58 Z" fill="#FBBF24" />
                <circle cx="36" cy="30" r="3.5" fill="#34D399" />
                <circle cx="164" cy="32" r="3.5" fill="#38BDF8" />
              </g>
            )}

            {/* Thinking lightbulb/question when thinking */}
            {mood === 'thinking' && (
              <g transform="translate(148, 20) scale(0.85)">
                <circle cx="15" cy="15" r="11" fill="#FDE047" stroke="#EAB308" strokeWidth="2" />
                <rect x="12" y="26" width="6" height="5" rx="1.5" fill="#94A3B8" />
                <path d="M 15 5 L 15 2 M 5 15 L 2 15 M 25 15 L 28 15" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

          </g>
        </svg>
      </div>
    </div>
  );
};

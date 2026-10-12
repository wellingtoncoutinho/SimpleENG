import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none cursor-pointer group ${className}`}>
      {/* Illustrated Mascot Face Emblem */}
      <div
        className={`${iconSizes[size]} shrink-0 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 p-0.5 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform duration-200`}
      >
        <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden relative flex items-center justify-center">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-radial from-emerald-500/30 to-transparent" />

          {/* Stylized Vector Mascot Face with Earphones */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full relative z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Hair gradient - blonde / light warm brown */}
              <linearGradient id="logoHair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DFAD78" />
                <stop offset="50%" stopColor="#C68F55" />
                <stop offset="100%" stopColor="#9B6634" />
              </linearGradient>

              {/* Skin tone */}
              <linearGradient id="logoSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE0C8" />
                <stop offset="100%" stopColor="#F7C5A8" />
              </linearGradient>
            </defs>

            {/* Neck & black collar */}
            <rect x="42" y="74" width="16" height="14" rx="4" fill="url(#logoSkin)" />
            <path d="M 28 84 Q 50 96 72 84 L 74 100 L 26 100 Z" fill="#1E293B" />
            <path d="M 40 84 Q 50 90 60 84" stroke="#10B981" strokeWidth="2" fill="none" />

            {/* Ears with white in-ear buds */}
            <circle cx="27" cy="54" r="7" fill="url(#logoSkin)" stroke="#B48265" strokeWidth="1" />
            <circle cx="73" cy="54" r="7" fill="url(#logoSkin)" stroke="#B48265" strokeWidth="1" />
            
            {/* White earbuds */}
            <rect x="26" y="52" width="4" height="6" rx="2" fill="#FFFFFF" />
            <rect x="70" y="52" width="4" height="6" rx="2" fill="#FFFFFF" />
            {/* White earphone wires */}
            <path d="M 28 58 Q 36 78 48 84" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 72 58 Q 64 78 52 84" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Cute Rounded Face */}
            <path
              d="M 30 46 C 28 66 38 78 50 78 C 62 78 72 66 70 46 C 70 28 58 24 50 24 C 42 24 30 28 30 46 Z"
              fill="url(#logoSkin)"
            />

            {/* Eyes - big friendly anime style */}
            <ellipse cx="41" cy="50" rx="3.5" ry="4.5" fill="#3B2212" />
            <circle cx="42" cy="48" r="1.3" fill="#FFFFFF" />
            
            <ellipse cx="59" cy="50" rx="3.5" ry="4.5" fill="#3B2212" />
            <circle cx="60" cy="48" r="1.3" fill="#FFFFFF" />

            {/* Eyebrows */}
            <path d="M 37 42 Q 42 40 46 43" stroke="#875628" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 63 42 Q 58 40 54 43" stroke="#875628" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Cute nose */}
            <path d="M 50 52 L 48.5 56 L 51.5 56" stroke="#D79E7C" strokeWidth="1.4" fill="none" strokeLinecap="round" />

            {/* Neat Goatee & Mustache (Bigodinho do Leo) */}
            <path d="M 44 60 Q 50 58 56 60" stroke="#875628" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="69" rx="2.5" ry="1.2" fill="#875628" opacity="0.8" />
            <path d="M 42 72 Q 50 76 58 72" stroke="#875628" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeDasharray="1.5,1.5" />

            {/* Warm smile */}
            <path d="M 45 62 Q 50 66 55 62" stroke="#9A3412" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Rosy cheeks */}
            <circle cx="34" cy="56" r="3" fill="#F43F5E" opacity="0.3" />
            <circle cx="66" cy="56" r="3" fill="#F43F5E" opacity="0.3" />

            {/* Styled Hair - Blonde/light brown spikes and textured bangs */}
            <path
              d="M 28 42 C 26 30 36 18 50 18 C 64 18 74 30 72 42 C 72 38 68 28 62 26 C 56 24 54 30 48 26 C 42 22 36 28 32 34 C 30 36 28 40 28 42 Z"
              fill="url(#logoHair)"
            />
            {/* Fringe bangs */}
            <path d="M 32 34 Q 40 38 42 44 Q 48 34 54 42 Q 60 36 66 42 Q 72 32 64 26" fill="url(#logoHair)" />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center">
          <span className={`font-black ${titleSizes[size]} text-slate-900 dark:text-white tracking-tight leading-none`}>
            Simple<span className="text-emerald-500">ENG</span>
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight mt-1 whitespace-nowrap">
          Simplificando seu Inglês
        </p>
      </div>
    </div>
  );
};

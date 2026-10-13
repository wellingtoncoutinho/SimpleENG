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
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer group ${className}`}>
      {/* Illustrated Sea Lion Mascot Emblem */}
      <div
        className={`${iconSizes[size]} shrink-0 rounded-2xl bg-gradient-to-br from-sky-400 via-teal-500 to-emerald-600 p-0.5 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform duration-200`}
      >
        <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden relative flex items-center justify-center">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-radial from-sky-500/30 to-transparent" />

          {/* Stylized Sea Lion Mascot Face */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full relative z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="60%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>
            </defs>

            {/* Sea Lion Head & Body */}
            <path
              d="M 50 16 C 72 16 84 32 84 56 C 84 76 74 92 50 92 C 26 92 16 76 16 56 C 16 32 28 16 50 16 Z"
              fill="url(#logoSeal)"
            />

            {/* Side Ear Flaps */}
            <path d="M 18 45 C 13 45 12 52 17 55 Z" fill="#0369A1" />
            <path d="M 82 45 C 87 45 88 52 83 55 Z" fill="#0369A1" />

            {/* Cream Snout */}
            <ellipse cx="50" cy="62" rx="16" ry="11" fill="#FEF08A" />

            {/* Whiskers */}
            <path d="M 38 60 Q 24 58 16 60" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 38 64 Q 24 66 18 70" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 62 60 Q 76 58 84 60" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 62 64 Q 76 66 82 70" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Shiny Nose */}
            <path
              d="M 46 56 C 46 54 54 54 54 56 C 54 59 52 61 50 61 C 48 61 46 59 46 56 Z"
              fill="#0F172A"
            />
            <circle cx="49" cy="56" r="1" fill="#FFFFFF" />

            {/* Cute Smile */}
            <path
              d="M 45 64 Q 48 67 50 64 Q 52 67 55 64"
              stroke="#0F172A"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Rosy Cheeks */}
            <circle cx="32" cy="60" r="4.5" fill="#FB7185" opacity="0.45" />
            <circle cx="68" cy="60" r="4.5" fill="#FB7185" opacity="0.45" />

            {/* Big Expressive Cartoon Eyes */}
            <ellipse cx="36" cy="44" rx="6.5" ry="8" fill="#0F172A" />
            <circle cx="34.5" cy="41.5" r="2.8" fill="#FFFFFF" />
            <circle cx="39" cy="46" r="1.3" fill="#FFFFFF" />

            <ellipse cx="64" cy="44" rx="6.5" ry="8" fill="#0F172A" />
            <circle cx="62.5" cy="41.5" r="2.8" fill="#FFFFFF" />
            <circle cx="67" cy="46" r="1.3" fill="#FFFFFF" />

            {/* Cute Eyebrows */}
            <path d="M 31 33 Q 36 30 41 33" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 59 33 Q 64 30 69 33" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Wireless White & Emerald Headphones */}
            <path
              d="M 22 44 C 22 18 78 18 78 44"
              stroke="#F8FAFC"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="15" y="40" width="7" height="13" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <rect x="78" y="40" width="7" height="13" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
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
        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-tight mt-0.5 sm:mt-1 whitespace-nowrap">
          Simplificando seu Inglês
        </p>
      </div>
    </div>
  );
};

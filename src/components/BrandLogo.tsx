import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Minimalist Audio / Headphones Icon */}
      <div
        className={`${iconSizes[size]} bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 shrink-0`}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-5 h-5 fill-none stroke-current"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Headphone Band */}
          <path d="M 10 21 C 10 14 14.5 9 20 9 C 25.5 9 30 14 30 21" stroke="#FFFFFF" strokeWidth="2.8" />
          {/* Left Ear Cushion */}
          <rect x="7" y="19" width="6" height="10" rx="3" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1" />
          {/* Right Ear Cushion */}
          <rect x="27" y="19" width="6" height="10" rx="3" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1" />
          {/* Sound wave spark in center */}
          <path d="M 16 24 L 16 24.5" stroke="#A7F3D0" strokeWidth="3" />
          <path d="M 20 21 L 20 27" stroke="#A7F3D0" strokeWidth="3" />
          <path d="M 24 23 L 24 25" stroke="#A7F3D0" strokeWidth="3" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center">
          <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-none">
            Simple<span className="text-emerald-600">ENG</span>
          </span>
        </div>
        <p className="text-3xs sm:text-2xs text-slate-400 font-medium tracking-tight mt-0.5 hidden sm:block">
          Inglês das suas aulas particulares
        </p>
      </div>
    </div>
  );
};

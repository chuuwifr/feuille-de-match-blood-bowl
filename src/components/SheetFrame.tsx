import React from 'react';

export const HelmetIllustration: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    aria-hidden="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Spikes */}
    <polygon points="36,24 24,4 46,16" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    <polygon points="56,16 56,0 68,14" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    <polygon points="75,20 88,6 84,26" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    {/* Helmet shell */}
    <path
      d="M24 58 C24 30, 46 16, 70 18 C92 20, 102 38, 100 62 L84 64 L80 48 L56 48 L48 76 L26 72 Z"
      fill="#16356B"
      stroke="#1E1915"
      strokeWidth="3"
    />
    {/* Crimson racing stripe */}
    <path d="M55 18 C64 17, 74 20, 81 26 L75 36 C68 31, 61 29, 53 30 Z" fill="#9D1717" />
    {/* Gold trim & rivets */}
    <path
      d="M25 65 Q48 74 84 61"
      stroke="#EAB308"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="34" cy="48" r="3" fill="#E2E8F0" stroke="#1E1915" strokeWidth="1.5" />
    <circle cx="44" cy="36" r="3" fill="#E2E8F0" stroke="#1E1915" strokeWidth="1.5" />
    {/* Faceguard */}
    <path
      d="M48 64 L96 64 M50 74 L94 74 M54 84 L88 84 M66 56 L62 90 M82 58 L78 88"
      stroke="#D97706"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M48 64 L96 64 M50 74 L94 74 M54 84 L88 84 M66 56 L62 90 M82 58 L78 88"
      stroke="#FDE047"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SpikedBallIllustration: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    aria-hidden="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Spikes */}
    <polygon points="34,36 16,22 40,26" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    <polygon points="62,22 64,4 74,22" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    <polygon points="90,34 110,20 98,44" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    <polygon points="24,78 6,90 30,88" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    <polygon points="94,82 112,96 86,92" fill="#CBD5E1" stroke="#1E1915" strokeWidth="2.5" />
    {/* Leather Ball */}
    <g transform="rotate(-24 60 60)">
      <ellipse cx="60" cy="60" rx="44" ry="27" fill="#7C3F1D" stroke="#1E1915" strokeWidth="3.5" />
      <ellipse cx="56" cy="54" rx="34" ry="18" fill="#9A5328" opacity="0.7" />
      {/* Metal bands */}
      <path d="M29 39 L29 81" stroke="#94A3B8" strokeWidth="5" />
      <path d="M91 39 L91 81" stroke="#94A3B8" strokeWidth="5" />
      {/* Laces */}
      <path d="M40 53 L80 53" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 47 L46 59 M53 46 L53 60 M60 46 L60 60 M67 46 L67 60 M74 47 L74 59" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
      {/* BB emblem */}
      <text
        x="63"
        y="78"
        fill="#FDE047"
        stroke="#1E1915"
        strokeWidth="0.8"
        fontFamily="Cinzel, serif"
        fontWeight="900"
        fontSize="16"
        textAnchor="middle"
      >
        BB
      </text>
    </g>
  </svg>
);

export const CrimsonBanner: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
}> = ({ title, subtitle, className = '' }) => (
  <div className={`relative flex items-center justify-center my-1.5 ${className}`}>
    <div className="crimson-banner relative w-full py-1 px-6 border-y-2 border-[#EAB308] text-center shadow-md">
      <div className="flex items-center justify-center gap-2.5">
        <span className="text-[#FDE047] text-xs" aria-hidden="true">★</span>
        <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wider text-white uppercase drop-shadow">
          {title}
        </h2>
        <span className="text-[#FDE047] text-xs" aria-hidden="true">★</span>
      </div>
      {subtitle && (
        <p className="text-[11px] font-medium text-amber-200/95 tracking-wide -mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

interface SheetFrameProps {
  children: React.ReactNode;
  testId?: string;
}

export const SheetFrame: React.FC<SheetFrameProps> = ({ children, testId }) => {
  return (
    <div
      data-testid={testId}
      className="print-sheet relative mx-auto w-full max-w-[1060px] steel-frame rounded-xl p-2 sm:p-3 border-2 border-[#1f242c]"
    >
      {/* Decorative corner rivets */}
      <div className="pointer-events-none absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-700 shadow-inner" />
      <div className="pointer-events-none absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-700 shadow-inner" />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-700 shadow-inner" />
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-700 shadow-inner" />

      {/* Crimson & Gold inner frame */}
      <div className="border-[3px] border-[#8B1111] rounded-lg p-1 bg-[#D49B2A] shadow-inner">
        <div className="parchment-bg border-2 border-[#1E1915] rounded-sm overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

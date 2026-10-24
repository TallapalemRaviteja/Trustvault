import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const TrustVaultLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Custom Cybersecurity Shield + Keyhole Icon */}
      <div className={`relative ${iconSizes} rounded-xl bg-gradient-to-tr from-[#1E2C48] via-[#121A2B] to-[#182845] p-[1px] shadow-cyber-md flex items-center justify-center group`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#42D9E8] opacity-30 blur-[6px] group-hover:opacity-60 transition-opacity" />
        
        {/* Shield container */}
        <div className="relative w-full h-full rounded-[11px] bg-[#0B1020] flex items-center justify-center overflow-hidden border border-[#4F8CFF]/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/5 h-3/5 text-[#42D9E8] transition-transform duration-300 group-hover:scale-110"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Shield Outline */}
            <path
              d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z"
              stroke="url(#shield-grad)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Lock Shackle */}
            <path
              d="M9.5 11V8.5C9.5 7.12 10.62 6 12 6C13.38 6 14.5 7.12 14.5 8.5V11"
              stroke="#F4F7FC"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Lock Body */}
            <rect
              x="8.5"
              y="11"
              width="7"
              height="5.5"
              rx="1.5"
              fill="url(#shield-grad)"
            />
            {/* Keyhole dot */}
            <circle cx="12" cy="13.2" r="0.8" fill="#0B1020" />
            <path d="M12 14V15" stroke="#0B1020" strokeWidth="0.8" strokeLinecap="round" />
            
            <defs>
              <linearGradient id="shield-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4F8CFF" />
                <stop offset="1" stopColor="#42D9E8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight text-white dark:text-[#F4F7FC] ${textSizes} leading-none flex items-center gap-1`}>
            TRUST<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8]">VAULT</span>
          </span>
          <span className="text-[9px] font-mono tracking-widest text-[#9BA8BD] uppercase mt-1 leading-none">
            Zero-Trust Matrix
          </span>
        </div>
      )}
    </div>
  );
};

import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'arrival' | 'departure' | 'glass' | 'ghost';

export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  
  const baseStyles = 'relative flex items-center justify-center gap-2 font-semibold tracking-wide rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const paddingStyles = 'px-6 py-3.5';

  const variants = {
    primary: `
      bg-gradient-to-r from-[#110195] to-[#1c02eb] text-white 
      shadow-[0_4px_15px_rgba(17,1,149,0.4)]
      hover:shadow-[0_8px_25px_rgba(17,1,149,0.6)] hover:-translate-y-0.5
      border border-[#110195]/50
    `,
    secondary: `
      bg-gradient-to-r from-[#FC9905] to-[#ffaa2b] text-white
      shadow-[0_4px_15px_rgba(252,153,5,0.4)]
      hover:shadow-[0_8px_25px_rgba(252,153,5,0.6)] hover:-translate-y-0.5
      border border-[#FC9905]/50
    `,
    arrival: `
      bg-green-50 text-green-800 backdrop-blur-md
      border border-green-200 shadow-[0_4px_15px_rgba(34,197,94,0.1)]
      hover:bg-green-100 hover:border-green-300 hover:shadow-[0_8px_25px_rgba(34,197,94,0.2)] hover:scale-[1.02]
    `,
    departure: `
      bg-red-50 text-red-800 backdrop-blur-md
      border border-red-200 shadow-[0_4px_15px_rgba(239,68,68,0.1)]
      hover:bg-red-100 hover:border-red-300 hover:shadow-[0_8px_25px_rgba(239,68,68,0.2)] hover:scale-[1.02]
    `,
    glass: `
      bg-white/70 text-gray-900 backdrop-blur-md
      border border-[#110195]/10 shadow-[0_4px_16px_rgba(17,1,149,0.05)]
      hover:bg-white hover:border-[#110195]/20 hover:-translate-y-0.5
    `,
    ghost: `
      bg-transparent text-gray-600 hover:text-gray-900
      hover:bg-[#110195]/5
    `
  };

  return (
    <button
      className={`${baseStyles} ${paddingStyles} ${widthStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* Glossy reflection effect for buttons */}
      {(variant === 'primary' || variant === 'secondary') && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none rounded-xl" />
      )}
      
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

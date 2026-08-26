import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export function Logo({
  size = 'md',
  className = '',
  showText = true,
  textClassName = '',
  variant = 'auto',
}: LogoProps) {
  // Normalize sizes to support both sets of naming conventions
  const normalizedSize = size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : size === 'xlarge' ? 'xl' : size;

  const imageSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const overseaColor = variant === 'dark' ? 'text-white' : 'text-[#110195]';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src="/LOGO.png"
        alt="Oversea ClockIn Logo"
        className={`${imageSizes[normalizedSize]} object-contain drop-shadow-sm transition-transform hover:scale-105 duration-200`}
        loading="eager"
      />
      {showText && (
        <span className={`font-serif font-bold tracking-tight ${textSizes[normalizedSize]} ${textClassName}`}>
          <span className={overseaColor}>Oversea </span>
          <span className="text-[#FC9905]">ClockIn</span>
        </span>
      )}
    </div>
  );
}

export default Logo;

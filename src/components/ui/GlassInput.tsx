import React, { InputHTMLAttributes, forwardRef } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={inputId}
          className="text-gray-700 text-xs font-semibold uppercase tracking-wider block"
        >
          {label}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#110195] transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-white/80 hover:bg-white border border-gray-200/90 rounded-2xl px-4 py-3.5
              text-gray-900 text-base placeholder:text-gray-400
              shadow-sm
              focus:outline-none focus:border-[#FC9905] focus:bg-white
              focus:ring-4 focus:ring-[#FC9905]/15
              transition-all duration-200
              ${icon ? 'pl-11' : ''}
              ${rightElement ? 'pr-11' : ''}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <span className="text-red-500 text-xs font-medium animate-fadeIn mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';


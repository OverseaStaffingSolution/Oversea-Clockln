import React from 'react';

interface PageTransitionLoaderProps {
  message?: string;
}

export function PageTransitionLoader({ message = 'Chargement...' }: PageTransitionLoaderProps) {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 animate-fade-in">
      {/* Mini-horloge 64px élégante */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Cercle extérieur bleu */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="rgba(17, 1, 149, 0.04)"
            stroke="#110195"
            strokeWidth="3.5"
            className="opacity-90"
          />
          {/* Anneau intérieur orange pointillé */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#FC9905"
            strokeWidth="1"
            strokeDasharray="2 4"
            className="opacity-60"
          />
          {/* Aiguille Heures */}
          <g className="hours-hand" style={{ transformOrigin: '50px 50px' }}>
            <line x1="50" y1="50" x2="50" y2="28" stroke="#FC9905" strokeWidth="3" strokeLinecap="round" />
          </g>
          {/* Aiguille Minutes */}
          <g className="minutes-hand" style={{ transformOrigin: '50px 50px' }}>
            <line x1="50" y1="50" x2="50" y2="18" stroke="#110195" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Aiguille Secondes */}
          <g className="seconds-hand" style={{ transformOrigin: '50px 50px' }}>
            <line x1="50" y1="50" x2="50" y2="14" stroke="#FC9905" strokeWidth="1" strokeLinecap="round" />
          </g>
          {/* Centre */}
          <circle cx="50" cy="50" r="3.5" fill="#FC9905" />
          <circle cx="50" cy="50" r="1.5" fill="#110195" />
        </svg>
      </div>

      <p className="mt-4 text-xs sm:text-sm font-medium text-gray-500 tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default PageTransitionLoader;

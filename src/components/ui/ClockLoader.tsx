import React from 'react';

interface ClockLoaderProps {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
}

export function ClockLoader({
  title = 'Oversea ClockIn',
  subtitle = 'Chargement...',
  fullScreen = true
}: ClockLoaderProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center 
        ${fullScreen ? 'min-h-screen fixed inset-0 z-50 bg-white' : 'py-12 w-full'} 
        p-6 select-none animate-fade-in
      `}
    >
      {/* Horloge SVG Minimaliste */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Cercle extérieur - Bleu #110195 */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#110195"
            strokeWidth="5"
          />

          {/* Cercle intérieur (cadran) */}
          <circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
          />

          {/* Repères des 12 heures (simples points) */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const radius = 78;
            const x = 100 + radius * Math.cos(angle);
            const y = 100 + radius * Math.sin(angle);
            const isMajor = i % 3 === 0;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isMajor ? 3 : 1.5}
                fill={isMajor ? '#FC9905' : '#D1D5DB'}
              />
            );
          })}

          {/* Aiguille des HEURES - Orange #FC9905 */}
          <g className="hours-hand" style={{ transformOrigin: '100px 100px' }}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="60"
              stroke="#FC9905"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Aiguille des MINUTES - Orange #FC9905 */}
          <g className="minutes-hand" style={{ transformOrigin: '100px 100px' }}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="45"
              stroke="#FC9905"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Aiguille des SECONDES - Fine */}
          <g className="seconds-hand" style={{ transformOrigin: '100px 100px' }}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke="#FC9905"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          {/* Centre de l'horloge */}
          <circle
            cx="100"
            cy="100"
            r="5"
            fill="#FC9905"
          />
          <circle
            cx="100"
            cy="100"
            r="2.5"
            fill="#110195"
          />
        </svg>
      </div>

      {/* Titre */}
      <h1 className="mt-6 text-xl sm:text-2xl font-serif font-bold text-[#110195] tracking-tight">
        {title}
      </h1>

      {/* Sous-titre */}
      <p className="mt-1 text-xs sm:text-sm text-gray-400 font-light tracking-wide">
        {subtitle}
      </p>

      {/* Points de chargement */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <span className="w-2 h-2 rounded-full bg-[#FC9905] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-[#110195] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#FC9905] animate-bounce" />
      </div>
    </div>
  );
}

export default ClockLoader;
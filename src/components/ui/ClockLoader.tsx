import React from 'react';

interface ClockLoaderProps {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ClockLoader({
  title = 'Oversea ClockIn',
  subtitle = 'Chargement...',
  fullScreen = true,
  size = 'medium'
}: ClockLoaderProps) {
  const sizeMap = {
    small: 'w-10 h-10',   // 40px
    medium: 'w-32 h-32',  // 128px
    large: 'w-40 h-40'    // 160px
  };

  const titleSizeMap = {
    small: 'hidden',      // pas de titre en small
    medium: 'text-xl sm:text-2xl',
    large: 'text-2xl sm:text-3xl'
  };

  const subtitleSizeMap = {
    small: 'text-[10px]',
    medium: 'text-xs sm:text-sm',
    large: 'text-xs sm:text-sm'
  };

  const dotSizeMap = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2 h-2',
    large: 'w-2.5 h-2.5'
  };

  // Épaisseurs de traits adaptées à la taille
  const strokeWidths = {
    small: { outer: 8, inner: 1, hour: 6, minute: 4, second: 2.5 },
    medium: { outer: 5, inner: 1, hour: 4, minute: 2.5, second: 1.5 },
    large: { outer: 5, inner: 1, hour: 4, minute: 2.5, second: 1.5 }
  };

  const repèreSizes = {
    small: { major: 4, minor: 2 },
    medium: { major: 3, minor: 1.5 },
    large: { major: 3, minor: 1.5 }
  };

  const centerSizes = {
    small: { outer: 7, inner: 3.5 },
    medium: { outer: 5, inner: 2.5 },
    large: { outer: 5, inner: 2.5 }
  };

  const stroke = strokeWidths[size];
  const repère = repèreSizes[size];
  const center = centerSizes[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center 
        ${fullScreen ? 'min-h-screen fixed inset-0 z-50 bg-white' : 'py-12 w-full'} 
        p-6 select-none animate-fade-in
      `}
    >
      {/* Horloge SVG Minimaliste */}
      <div className={`relative ${sizeMap[size]}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Cercle extérieur - Bleu #110195 */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#110195"
            strokeWidth={stroke.outer}
          />

          {/* Cercle intérieur (cadran) */}
          <circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={stroke.inner}
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
                r={isMajor ? repère.major : repère.minor}
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
              strokeWidth={stroke.hour}
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
              strokeWidth={stroke.minute}
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
              strokeWidth={stroke.second}
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          {/* Centre de l'horloge */}
          <circle
            cx="100"
            cy="100"
            r={center.outer}
            fill="#FC9905"
          />
          <circle
            cx="100"
            cy="100"
            r={center.inner}
            fill="#110195"
          />
        </svg>
      </div>

      {/* Titre - caché en small */}
      <h1 className={`mt-6 font-serif font-bold text-[#110195] tracking-tight ${titleSizeMap[size]}`}>
        {title}
      </h1>

      {/* Sous-titre */}
      <p className={`mt-1 text-gray-400 font-light tracking-wide ${subtitleSizeMap[size]}`}>
        {subtitle}
      </p>

      {/* Points de chargement */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <span className={`${dotSizeMap[size]} rounded-full bg-[#FC9905] animate-bounce [animation-delay:-0.3s]`} />
        <span className={`${dotSizeMap[size]} rounded-full bg-[#110195] animate-bounce [animation-delay:-0.15s]`} />
        <span className={`${dotSizeMap[size]} rounded-full bg-[#FC9905] animate-bounce`} />
      </div>
    </div>
  );
}

export default ClockLoader;
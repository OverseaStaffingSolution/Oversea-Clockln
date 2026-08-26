import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  return (
    <div 
      className={`glass-panel p-6 ${hover ? 'glass-panel-interactive' : ''} ${className}`}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

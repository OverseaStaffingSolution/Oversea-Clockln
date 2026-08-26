import React from 'react';
import { PageSkeleton } from './PageSkeleton';

interface LazyLoaderProps {
  type?: 'default' | 'dashboard' | 'table' | 'form';
}

export function LazyLoader({ type = 'default' }: LazyLoaderProps) {
  return (
    <div className="w-full relative min-h-[60vh]">
      {/* Top Slim Loading Line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#110195] via-[#FC9905] to-[#110195] z-[100] animate-[shimmer_1.5s_infinite_linear] bg-[length:200%_100%]" />
      
      {/* Page-matched minimalist skeleton */}
      <PageSkeleton type={type} />
    </div>
  );
}

export default LazyLoader;

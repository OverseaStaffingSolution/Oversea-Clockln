import React from 'react';

export function PageSkeleton({ type = 'default' }: { type?: 'default' | 'dashboard' | 'table' | 'form' }) {
  if (type === 'dashboard') {
    return (
      <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="h-10 w-48 sm:w-64 bg-gray-200/80 rounded-2xl" />
            <div className="h-5 w-40 sm:w-56 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-20 w-48 bg-gray-100/90 rounded-2xl border border-gray-200/50" />
        </div>

        {/* GPS Card Skeleton */}
        <div className="h-24 w-full bg-white/70 rounded-2xl border border-gray-200/60 p-4" />

        {/* 2 Big Action Buttons Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="h-20 w-full bg-gray-200/70 rounded-2xl" />
          <div className="h-20 w-full bg-gray-200/70 rounded-2xl" />
        </div>

        {/* Summary Skeleton */}
        <div className="h-44 w-full bg-white/70 rounded-2xl border border-gray-200/60 p-6" />
      </div>
    );
  }

  if (type === 'table' || type === 'form') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-gray-200/80 rounded-2xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-12 w-full bg-gray-100 rounded-2xl" />
        <div className="h-80 w-full bg-white/70 rounded-2xl border border-gray-200/60 p-6 space-y-4">
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
          <div className="h-10 w-full bg-gray-50 rounded-xl" />
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
          <div className="h-10 w-full bg-gray-50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse py-4">
      {/* Top Slim bar */}
      <div className="h-8 w-1/3 bg-gray-200/80 rounded-2xl mb-4" />
      <div className="h-4 w-1/2 bg-gray-100 rounded-xl mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-32 bg-white/80 rounded-2xl border border-gray-200/50" />
        <div className="h-32 bg-white/80 rounded-2xl border border-gray-200/50" />
      </div>
      <div className="h-64 bg-white/80 rounded-2xl border border-gray-200/50" />
    </div>
  );
}

export default PageSkeleton;

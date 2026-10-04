import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded'
}) => {
  const variantClass = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-xl'
  }[variant];

  return (
    <div
      className={`animate-pulse bg-white/[0.04] border border-white/[0.05] relative overflow-hidden ${variantClass} ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-shimmer" />
    </div>
  );
};

import React from 'react';
import { ConditionGrade } from '../types';

interface GradeBadgeProps {
  grade: ConditionGrade;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  size = 'md',
  showLabel = true
}) => {
  const gradeConfig = {
    A: {
      label: 'Grade A • Mint',
      sub: 'Near new condition, fully functional',
      bg: 'bg-[#3FA17C]/10 border-[#3FA17C]/30 text-[#67C7A2]',
      color: '#3FA17C'
    },
    B: {
      label: 'Grade B • Good',
      sub: 'Light cosmetic wear, 100% operational',
      bg: 'bg-[#4FA3A5]/10 border-[#4FA3A5]/30 text-[#71C5C7]',
      color: '#4FA3A5'
    },
    C: {
      label: 'Grade C • Fair',
      sub: 'Cracked glass or worn battery, logic board intact',
      bg: 'bg-[#E0A94F]/10 border-[#E0A94F]/30 text-[#F2C274]',
      color: '#E0A94F'
    },
    D: {
      label: 'Grade D • Salvage',
      sub: 'Non-booting hardware, metallurgical scrap yield',
      bg: 'bg-[#D9776B]/10 border-[#D9776B]/30 text-[#EAA198]',
      color: '#D9776B'
    }
  }[grade];

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-sans font-medium tracking-normal ${gradeConfig.bg} ${sizeClasses}`}
      title={gradeConfig.sub}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: gradeConfig.color }} />
      <span>{showLabel ? gradeConfig.label : `Grade ${grade}`}</span>
    </span>
  );
};

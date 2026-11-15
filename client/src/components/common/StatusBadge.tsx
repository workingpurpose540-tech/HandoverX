import React from 'react';
import type { StatusVariant } from '../../types/dashboard';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles: Record<StatusVariant, string> = {
    verified: 'bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32]',
    pending: 'bg-[#D6A64F]/15 border border-[#D6A64F]/30 text-[#91621E]',
    neutral: 'bg-[#E7E1D7] border border-[#E5E0D7] text-[#77766F]',
  };

  return (
    <span
      className={`font-barlow text-[9.5px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap leading-none ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

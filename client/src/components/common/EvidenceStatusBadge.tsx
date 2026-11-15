import React from 'react';
import { CheckCircle2, HelpCircle, AlertTriangle, HelpCircle as UnavailableIcon } from 'lucide-react';
import type { EvidenceStatus } from '../../services/api';

export interface EvidenceStatusBadgeProps {
  status?: EvidenceStatus | string;
  className?: string;
}

export const EvidenceStatusBadge: React.FC<EvidenceStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'source-supported':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#263B32]/10 text-[#263B32] text-[10px] font-medium border border-[#263B32]/25 whitespace-nowrap leading-none ${className}`}
          title="Direct quote verified in the uploaded document source"
        >
          <CheckCircle2 className="w-3 h-3 text-[#263B32] shrink-0" />
          <span>Source-supported</span>
        </span>
      );

    case 'inferred-needs-confirmation':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D6A64F]/15 text-[#8F6A17] text-[10px] font-medium border border-[#D6A64F]/35 whitespace-nowrap leading-none ${className}`}
          title="Synthesized by AI from document context; requires human confirmation"
        >
          <HelpCircle className="w-3 h-3 text-[#D6A64F] shrink-0" />
          <span>Inferred — Needs confirmation</span>
        </span>
      );

    case 'evidence-missing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#B94A48]/10 text-[#B94A48] text-[10px] font-medium border border-[#B94A48]/25 whitespace-nowrap leading-none ${className}`}
          title="No evidence quotation was found or supplied for this finding"
        >
          <AlertTriangle className="w-3 h-3 text-[#B94A48] shrink-0" />
          <span>Evidence missing</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E7E1D7]/60 text-[#77766F] text-[10px] font-medium border border-[#E5E0D7] whitespace-nowrap leading-none ${className}`}
          title="Evidence verification status is unavailable"
        >
          <UnavailableIcon className="w-3 h-3 text-[#77766F] shrink-0" />
          <span>Status unavailable</span>
        </span>
      );
  }
};

export default EvidenceStatusBadge;

import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toUpperCase();

  let bgClass = 'bg-[#EAF1EB] text-[#397754] border-[#397754]/20'; // success
  if (['PENDING', 'DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'RETEST', 'PARTIALLY_RECEIVED'].includes(norm)) {
    bgClass = 'bg-[#F9F4EB] text-[#B78337] border-[#B78337]/25'; // pending
  } else if (['REJECTED', 'FAILED', 'CRITICAL', 'CANCELLED', 'DENY', 'INVALID'].includes(norm)) {
    bgClass = 'bg-[#F9ECEB] text-[#B64C43] border-[#B64C43]/25'; // error
  } else if (['PURCHASE_ORDER_CREATED', 'EXPANDED', 'SELECTIVE', 'HIGH'].includes(norm)) {
    bgClass = 'bg-[#EDF2F6] text-[#506E86] border-[#506E86]/25'; // info
  } else if (['PAID', 'APPROVED', 'ACCEPTED', 'RECEIVED', 'INVOICE_VERIFIED', 'PASSED', 'FULFILLED', 'ALLOW', 'VALID', 'COMPLETED', 'FIXED', 'CLOSED'].includes(norm)) {
    bgClass = 'bg-[#EAF1EB] text-[#397754] border-[#397754]/25'; // success
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border ${paddingClass} ${bgClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, actions }) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E0E5DF]">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-[#252D28] tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-xs md:text-sm text-[#727D75] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

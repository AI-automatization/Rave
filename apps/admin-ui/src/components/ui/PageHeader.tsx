import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: string;
}

export function PageHeader({ title, description, actions, badge, meta }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-semibold text-white tracking-tight leading-tight">
            {title}
          </h1>
          {badge && (
            <span className="shrink-0">{badge}</span>
          )}
          {meta && (
            <span className="text-[11px] text-text-dim font-normal">{meta}</span>
          )}
        </div>
        {description && (
          <p className="text-text-muted text-[13px] mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

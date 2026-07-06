import React from 'react';

export const Pill: React.FC<{ label: string; color?: string }> = ({
  label,
  color = '#7C3AED',
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 20px',
      borderRadius: 100,
      border: `1px solid ${color}55`,
      background: `${color}18`,
      color: '#A78BFA',
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontFamily: 'sans-serif',
    }}
  >
    {label}
  </div>
);

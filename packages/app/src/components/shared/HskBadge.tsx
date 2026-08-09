import React from 'react';

interface HskBadgeProps {
  level: string;
  className?: string;
  size?: 'sm' | 'md';
}

const HSK_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  '1': { bg: 'rgba(24, 231, 236, 0.15)', color: '#18e7ec', border: 'rgba(24, 231, 236, 0.35)' },
  '2': { bg: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', border: 'rgba(76, 175, 80, 0.35)' },
  '3': { bg: 'rgba(255, 193, 7, 0.15)', color: '#FFC107', border: 'rgba(255, 193, 7, 0.35)' },
  '4': { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', border: 'rgba(255, 152, 0, 0.35)' },
  '5': { bg: 'rgba(244, 67, 54, 0.15)', color: '#F44336', border: 'rgba(244, 67, 54, 0.35)' },
  '6': { bg: 'rgba(156, 39, 176, 0.15)', color: '#E040FB', border: 'rgba(156, 39, 176, 0.35)' },
  '7-9': { bg: 'rgba(233, 30, 99, 0.15)', color: '#FF4081', border: 'rgba(233, 30, 99, 0.35)' },
};

export const HskBadge: React.FC<HskBadgeProps> = ({ level, className = '', size = 'md' }) => {
  const theme = HSK_COLORS[level] || HSK_COLORS['7-9'];

  return (
    <span
      className={`hsk-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '1px 5px' : '2px 7px',
        borderRadius: size === 'sm' ? 4 : 6,
        fontSize: size === 'sm' ? 9 : 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        backgroundColor: theme.bg,
        color: theme.color,
        border: `1px solid ${theme.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      HSK {level}
    </span>
  );
};

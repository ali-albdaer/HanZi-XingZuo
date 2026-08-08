import React from 'react';
import { APP_CONFIG, type MasteryLevel } from '../../config/app.config';

interface MasteryBadgeProps {
  level: MasteryLevel;
  showLabel?: boolean;
  className?: string;
}

export const MasteryBadge: React.FC<MasteryBadgeProps> = ({ level, showLabel = true, className = '' }) => {
  return (
    <span className={`mastery-badge ${level} ${className}`}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: APP_CONFIG.mastery.colors[level],
          display: 'inline-block',
        }}
      />
      {showLabel && <span>{APP_CONFIG.mastery.labels[level]}</span>}
    </span>
  );
};

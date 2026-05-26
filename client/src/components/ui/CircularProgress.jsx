import { useEffect, useState } from 'react';

export default function CircularProgress({ value = 0, size = 60, strokeWidth = 5, color }) {
  const [offset, setOffset] = useState(283);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => {
      const newOffset = circumference - (value / 100) * circumference;
      setOffset(newOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  const strokeColor = color || (value >= 80 ? 'var(--success)' : value >= 50 ? 'var(--warning)' : 'var(--danger)');

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--surface-3)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span className="progress-text" style={{ fontSize: size * 0.22, color: 'var(--text)' }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

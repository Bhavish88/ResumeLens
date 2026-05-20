/**
 * ScoreGauge.jsx
 *
 * Animated circular ATS score display.
 * - SVG circle that fills based on score (0-100)
 * - Color changes: red (<50), amber (50-70), green (>70)
 * - Number counts up from 0 on mount
 */

import { useEffect, useState } from 'react';

function ScoreGauge({ score = 0, size = 180 }) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate number counting up
  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const step = duration / score;
    const timer = setInterval(() => {
      start += 1;
      setDisplayScore(start);
      if (start >= score) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Color based on score
  const getColor = (s) => {
    if (s >= 75) return '#00e5a0';   // green — strong resume
    if (s >= 50) return '#ffb347';   // amber — needs work
    return '#ff4f6b';                // red — major issues
  };

  const color = getColor(score);

  const getLabel = (s) => {
    if (s >= 75) return 'Strong';
    if (s >= 50) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="score-gauge-wrapper">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={10}
        />
        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>

      {/* Center text */}
      <div className="score-gauge-center">
        <span className="score-number" style={{ color }}>{displayScore}</span>
        <span className="score-label" style={{ color }}>
          {getLabel(score)}
        </span>
        <span className="score-sublabel">ATS Score</span>
      </div>
    </div>
  );
}

export default ScoreGauge;

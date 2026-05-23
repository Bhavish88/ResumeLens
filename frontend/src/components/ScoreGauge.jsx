/**
 * ScoreGauge.jsx
 *
 * Animated circular ATS score display.
 * - SVG circle that fills based on score (0-100)
 * - Color changes: red (<50), amber (50-70), green (>70)
 * - Number counts up from 0 on mount (supports disable option for printing)
 */

import { useEffect, useState } from 'react';

function ScoreGauge({ score = 0, size = 180, animate = true }) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate number counting up
  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    if (score <= 0) {
      setDisplayScore(0);
      return;
    }

    let start = 0;
    const duration = 1000; // ms
    const increment = Math.ceil(score / (duration / 16)); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        start = score;
        clearInterval(timer);
      }
      setDisplayScore(start);
    }, 16);
    return () => clearInterval(timer);
  }, [score, animate]);

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Color gradient definitions based on score
  const getGradientColors = (s) => {
    if (s >= 75) return { main: '#00e5a0', light: '#00b4d8' };   // green — strong
    if (s >= 50) return { main: '#ffb347', light: '#ff7b00' };   // amber — needs work
    return { main: '#ff4f6b', light: '#ff1a40' };                // red — major issues
  };

  const { main: color, light: colorLight } = getGradientColors(score);

  const getLabel = (s) => {
    if (s >= 75) return 'Strong';
    if (s >= 50) return 'Fair';
    return 'Weak';
  };

  // Safe ID for SVG gradients
  const gradientId = `gauge-grad-${score}-${animate ? 'anim' : 'static'}`;

  return (
    <div 
      className="score-gauge-wrapper" 
      style={{ 
        '--gauge-size': `${size}px`,
        '--glow-color': `${color}45`
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${size} ${size}`} 
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={colorLight} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={12}
        />
        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ 
            transition: animate ? 'stroke-dashoffset 0.05s linear' : 'none', 
            animation: animate ? 'gauge-glow-pulse 3s ease-in-out infinite' : 'none'
          }}
        />
      </svg>

      {/* Center text */}
      <div className="score-gauge-center" style={{ gap: '4px' }}>
        <span className="score-number animate-fade-in" style={{ color, fontSize: size > 160 ? '2.8rem' : '2.3rem' }}>
          {displayScore}
        </span>
        <span className="score-label" style={{ color, fontSize: size > 160 ? '0.8rem' : '0.72rem', letterSpacing: '0.12em' }}>
          {getLabel(score)}
        </span>
        <span className="score-sublabel" style={{ fontSize: size > 160 ? '0.72rem' : '0.66rem' }}>
          ATS Score
        </span>
      </div>
    </div>
  );
}

export default ScoreGauge;

/**
 * SkillBadge.jsx
 * Colored pill/tag component for displaying skills, strengths, weaknesses.
 * variant: 'danger' | 'success' | 'warning' | 'info'
 */

function SkillBadge({ text, variant = 'info' }) {
  const colors = {
    danger:  { bg: 'rgba(255,79,107,0.15)',  border: 'rgba(255,79,107,0.4)',  text: '#ff4f6b' },
    success: { bg: 'rgba(0,229,160,0.12)',   border: 'rgba(0,229,160,0.35)',  text: '#00e5a0' },
    warning: { bg: 'rgba(255,179,71,0.12)',  border: 'rgba(255,179,71,0.35)', text: '#ffb347' },
    info:    { bg: 'rgba(108,99,255,0.12)',  border: 'rgba(108,99,255,0.35)', text: '#a78bfa' },
  };

  const style = colors[variant] || colors.info;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 500,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        margin: '3px',
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </span>
  );
}

export default SkillBadge;

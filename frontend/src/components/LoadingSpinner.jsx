/**
 * LoadingSpinner.jsx
 * Animated circular spinner used during API loading states.
 */

function LoadingSpinner({ size = 32, color = '#6c63ff' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(108,99,255,0.15)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}

export default LoadingSpinner;

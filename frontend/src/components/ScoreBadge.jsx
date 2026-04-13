import { useEffect, useRef, useState } from 'react';

export default function ScoreBadge({ score = 0 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const frameRef = useRef(0);
  const grade = getGrade(score);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 700;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameRef.current);
  }, [score]);

  return (
    <div
      style={{
        ...styles.badge,
        background: grade.bg,
        borderColor: grade.border,
        boxShadow: `0 18px 40px ${grade.shadow}`,
      }}
    >
      <div style={{ ...styles.scoreOrb, background: `radial-gradient(circle at 30% 30%, ${grade.color}, ${grade.dim})` }}>
        <span style={styles.scoreValue}>{displayScore}</span>
      </div>
      <div style={styles.copy}>
        <div style={{ ...styles.label, color: grade.color }}>{grade.label}</div>
        <div style={styles.subtext}>review score</div>
      </div>
    </div>
  );
}

function getGrade(score) {
  if (score >= 90) {
    return { label: 'Elite', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.08)', border: 'rgba(74, 222, 128, 0.18)', dim: 'rgba(74, 222, 128, 0.18)', shadow: 'rgba(74, 222, 128, 0.12)' };
  }

  if (score >= 75) {
    return { label: 'Strong', color: '#a3e635', bg: 'rgba(163, 230, 53, 0.08)', border: 'rgba(163, 230, 53, 0.18)', dim: 'rgba(163, 230, 53, 0.18)', shadow: 'rgba(163, 230, 53, 0.12)' };
  }

  if (score >= 60) {
    return { label: 'Fair', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.18)', dim: 'rgba(251, 191, 36, 0.18)', shadow: 'rgba(251, 191, 36, 0.12)' };
  }

  if (score >= 40) {
    return { label: 'Weak', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.08)', border: 'rgba(251, 113, 133, 0.18)', dim: 'rgba(251, 113, 133, 0.18)', shadow: 'rgba(251, 113, 133, 0.12)' };
  }

  return { label: 'Critical', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.18)', dim: 'rgba(239, 68, 68, 0.18)', shadow: 'rgba(239, 68, 68, 0.12)' };
}

const styles = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.85rem 0.65rem 0.65rem',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(18px)',
    transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
  },
  scoreOrb: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 0 24px rgba(0, 0, 0, 0.24)',
  },
  scoreValue: {
    fontSize: '1rem',
    fontWeight: 900,
    color: '#080808',
  },
  copy: {
    display: 'grid',
    gap: '0.12rem',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: 800,
    letterSpacing: '0.02em',
  },
  subtext: {
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#96a0b1',
  },
};

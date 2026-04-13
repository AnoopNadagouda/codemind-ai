import { useEffect, useRef, useState } from 'react';

const AGENTS = [
  { key: 'bugs', label: 'Bug Hunter', color: '#ef4444' },
  { key: 'security', label: 'Security Guard', color: '#f59e0b' },
  { key: 'optimization', label: 'Optimizer', color: '#60a5fa' },
  { key: 'complexity', label: 'Complexity Lens', color: '#a78bfa' },
];

export default function ReviewReport({ report, loading, loadingStage = 0, loadingAgent, loadingProgress = 0, error }) {
  const scoreTarget = report?.overall_score ?? 0;
  const [displayScore, setDisplayScore] = useState(0);
  const frameRef = useRef(0);
  const visibleScore = report ? displayScore : 0;

  useEffect(() => {
    if (!report) {
      return undefined;
    }

    const startTime = performance.now();
    const duration = 900;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(scoreTarget * eased));

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameRef.current);
  }, [scoreTarget, report]);

  if (loading) {
    return (
      <div style={styles.stateWrap}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingTopRow}>
            <div>
              <p style={styles.kicker}>Agent pipeline</p>
              <h3 style={styles.stateTitle}>Activating review agents</h3>
            </div>
            <div style={styles.loadingBadge}>
              {loadingProgress.toFixed(0)}%
            </div>
          </div>

          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${loadingProgress}%` }} />
          </div>

          <div style={styles.agentList}>
            {AGENTS.map((agent, index) => {
              const active = index === loadingStage;
              const done = index < loadingStage;
              return (
                <div
                  key={agent.key}
                  style={{
                    ...styles.agentRow,
                    borderColor: active ? agent.color : 'rgba(255, 255, 255, 0.08)',
                    background: active ? `${agent.color}14` : 'rgba(255, 255, 255, 0.03)',
                    boxShadow: active ? `0 0 0 1px ${agent.color}22, 0 18px 28px rgba(0, 0, 0, 0.28)` : 'none',
                  }}
                >
                  <span
                    style={{
                      ...styles.agentOrb,
                      background: agent.color,
                      boxShadow: active ? `0 0 18px ${agent.color}` : 'none',
                      opacity: done ? 0.92 : 1,
                    }}
                  />
                  <div style={styles.agentCopy}>
                    <div style={styles.agentName}>{agent.label}</div>
                    <div style={styles.agentStatus}>{active ? 'Running now' : done ? 'Complete' : 'Queued'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.loadingFooter}>
            <span style={styles.loadingNow}>Now: {loadingAgent?.label || 'Bug Hunter'}</span>
            <span style={styles.loadingNote}>Building the final report in real time</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateWrap}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>!</div>
          <div>
            <div style={styles.errorTitle}>Backend not connected</div>
            <div style={styles.errorText}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={styles.stateWrap}>
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>{'<>_'}</div>
          <div style={styles.emptyTitle}>Ready for a review</div>
          <div style={styles.emptyText}>Run the analyzer to populate bugs, security findings, optimization tips, and complexity notes.</div>
          <div style={styles.emptyHint}>The report panel will animate score and severity when results arrive.</div>
        </div>
      </div>
    );
  }

  const bugs = Array.isArray(report.bugs) ? report.bugs : [];
  const security = Array.isArray(report.security) ? report.security : [];
  const optimizations = Array.isArray(report.optimizations) ? report.optimizations : [];
  const complexity = report.complexity || {};
  const totalIssues = Math.max(bugs.length + security.length + optimizations.length, 1);

  return (
    <div style={styles.report}>
      <div style={styles.summaryGrid}>
        <div style={styles.scoreCard}>
          <div style={styles.kicker}>Overall score</div>
          <div style={styles.scoreValue}>{visibleScore}</div>
          <div style={{ ...styles.scoreRing, boxShadow: `inset 0 0 0 1px ${scoreColor(scoreTarget)}24, 0 0 35px ${scoreColor(scoreTarget)}16` }}>
            <div style={{ ...styles.scoreFill, background: `conic-gradient(${scoreColor(scoreTarget)} 0deg, ${scoreColor(scoreTarget)} ${scoreTarget * 3.6}deg, rgba(255,255,255,0.06) ${scoreTarget * 3.6}deg)` }} />
            <div style={styles.scoreInner}>
              <div style={{ ...styles.scoreLabel, color: scoreColor(scoreTarget) }}>{gradeLabel(scoreTarget)}</div>
              <div style={styles.scoreSubtext}>out of 100</div>
            </div>
          </div>
          {report.summary ? <div style={styles.summaryText}>{report.summary}</div> : null}
        </div>

        <div style={styles.miniRail}>
          {[
            { label: 'Bugs', value: bugs.length, tone: '#ef4444' },
            { label: 'Security', value: security.length, tone: '#f59e0b' },
            { label: 'Optimizations', value: optimizations.length, tone: '#60a5fa' },
            { label: 'Complexity', value: complexity.notation || 'O(n)', tone: '#a78bfa' },
          ].map((item) => (
            <div key={item.label} style={styles.miniCard}>
              <div style={styles.miniLabel}>{item.label}</div>
              <div style={{ ...styles.miniValue, color: item.tone }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.severityBox}>
        {[
          { label: 'Bug severity', count: bugs.length, color: '#ef4444' },
          { label: 'Security severity', count: security.length, color: '#f59e0b' },
          { label: 'Optimization gain', count: optimizations.length, color: '#60a5fa' },
        ].map((item) => (
          <div key={item.label} style={styles.severityRow}>
            <div style={styles.severityHeader}>
              <span>{item.label}</span>
              <span>{item.count}</span>
            </div>
            <div style={styles.severityTrack}>
              <div style={{ ...styles.severityFill, width: `${Math.max(10, (item.count / totalIssues) * 100)}%`, background: `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.18))` }} />
            </div>
          </div>
        ))}
      </div>

      {complexity && (complexity.notation || complexity.score) ? (
        <div style={styles.complexityCard}>
          <div style={styles.complexityHeader}>
            <div>
              <div style={styles.kicker}>Complexity</div>
              <div style={styles.complexityTitle}>{complexity.notation || 'Complexity profile'}</div>
            </div>
            {complexity.score != null ? <div style={styles.complexityScore}>{complexity.score}/10</div> : null}
          </div>
          <div style={styles.severityTrack}>
            <div style={{ ...styles.severityFill, width: `${Math.min(100, (Number(complexity.score) || 0) * 10)}%`, background: 'linear-gradient(90deg, #a78bfa, rgba(255,255,255,0.18))' }} />
          </div>
        </div>
      ) : null}

      {bugs.length > 0 ? (
        <IssueSection title="Bugs" tone="#ef4444" items={bugs} />
      ) : null}
      {security.length > 0 ? (
        <IssueSection title="Security" tone="#f59e0b" items={security} />
      ) : null}
      {optimizations.length > 0 ? (
        <IssueSection title="Optimizations" tone="#60a5fa" items={optimizations} />
      ) : null}

      {report.fixed_code ? (
        <div style={styles.fixedCard}>
          <div style={styles.fixedHeader}>
            <div>
              <div style={styles.kicker}>Suggested fix</div>
              <div style={styles.fixedTitle}>AI-generated code patch</div>
            </div>
            <div style={styles.fixedChip}>Ready</div>
          </div>
          <pre style={styles.fixedCode}>{report.fixed_code}</pre>
        </div>
      ) : null}
    </div>
  );
}

function IssueSection({ title, tone, items }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitleRow}>
        <div style={styles.sectionTitle}>{title}</div>
        <div style={{ ...styles.sectionCount, borderColor: tone, color: tone }}>{items.length}</div>
      </div>
      <div style={styles.issueList}>
        {items.map((item, index) => (
          <IssueCard key={`${title}-${index}`} item={item} tone={tone} />
        ))}
      </div>
    </div>
  );
}

function IssueCard({ item, tone }) {
  return (
    <div style={{ ...styles.issueCard, borderLeftColor: tone }}>
      <div style={styles.issueMessage}>{item.message}</div>
      <div style={styles.issueMetaRow}>
        {item.line ? <span style={styles.issueMeta}>Line {item.line}</span> : null}
        {item.suggestion ? <span style={styles.issueSuggestion}>{item.suggestion}</span> : null}
      </div>
    </div>
  );
}

function gradeLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

function scoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

const styles = {
  report: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.95rem',
  },
  stateWrap: {
    minHeight: '31rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    width: '100%',
    maxWidth: '34rem',
    padding: '1rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.045)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 26px 70px rgba(0, 0, 0, 0.36)',
  },
  loadingTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.85rem',
  },
  loadingBadge: {
    minWidth: '3.5rem',
    textAlign: 'center',
    padding: '0.45rem 0.65rem',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f6f8fc',
    fontSize: '0.84rem',
    fontWeight: 800,
  },
  kicker: {
    margin: 0,
    fontSize: '0.7rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#8d96a8',
  },
  stateTitle: {
    margin: '0.2rem 0 0',
    fontSize: '1.05rem',
    color: '#f4f7fb',
  },
  progressTrack: {
    height: '0.75rem',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    marginBottom: '0.95rem',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #7c8cff, #60a5fa, #a78bfa)',
    transition: 'width 260ms ease',
  },
  agentList: {
    display: 'grid',
    gap: '0.65rem',
    marginBottom: '0.95rem',
  },
  agentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.8rem 0.9rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'transform 220ms ease, box-shadow 220ms ease, background 220ms ease, border-color 220ms ease',
  },
  agentOrb: {
    width: '0.8rem',
    height: '0.8rem',
    borderRadius: '999px',
    flexShrink: 0,
  },
  agentCopy: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '1rem',
    flex: 1,
  },
  agentName: {
    color: '#f6f8fc',
    fontWeight: 700,
  },
  agentStatus: {
    color: '#8f99ab',
    fontSize: '0.84rem',
  },
  loadingFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    color: '#9aa3b2',
    fontSize: '0.86rem',
  },
  loadingNow: {
    color: '#f4f7fb',
    fontWeight: 700,
  },
  loadingNote: {
    color: '#9aa3b2',
  },
  errorBox: {
    width: '100%',
    display: 'flex',
    gap: '0.9rem',
    alignItems: 'flex-start',
    padding: '1rem',
    borderRadius: '1rem',
    background: 'rgba(127, 29, 29, 0.28)',
    border: '1px solid rgba(248, 113, 113, 0.28)',
  },
  errorIcon: {
    width: '1.8rem',
    height: '1.8rem',
    borderRadius: '999px',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(248, 113, 113, 0.18)',
    color: '#fecaca',
    fontWeight: 800,
    flexShrink: 0,
  },
  errorTitle: {
    color: '#fecaca',
    fontWeight: 700,
    marginBottom: '0.2rem',
  },
  errorText: {
    color: '#f8b4b4',
    fontSize: '0.92rem',
    lineHeight: 1.6,
  },
  emptyCard: {
    width: '100%',
    maxWidth: '34rem',
    padding: '1.3rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'center',
  },
  emptyIcon: {
    fontFamily: '"JetBrains Mono", monospace',
    color: '#6f788a',
    fontSize: '1.75rem',
    marginBottom: '0.6rem',
  },
  emptyTitle: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#f4f7fb',
    marginBottom: '0.35rem',
  },
  emptyText: {
    color: '#c4cfdd',
    lineHeight: 1.6,
    marginBottom: '0.35rem',
  },
  emptyHint: {
    color: '#8f99ab',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 280px)',
    gap: '0.9rem',
    alignItems: 'stretch',
  },
  scoreCard: {
    position: 'relative',
    padding: '1rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.045)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(18px)',
    overflow: 'hidden',
  },
  scoreValue: {
    position: 'absolute',
    top: '0.95rem',
    right: '1rem',
    fontSize: '2rem',
    fontWeight: 900,
    color: '#f8fbff',
    letterSpacing: '-0.05em',
  },
  scoreRing: {
    position: 'relative',
    width: '12rem',
    height: '12rem',
    borderRadius: '50%',
    marginTop: '1.2rem',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  scoreFill: {
    position: 'absolute',
    inset: '0.45rem',
    borderRadius: '50%',
    transition: 'background 500ms ease, width 500ms ease',
  },
  scoreInner: {
    position: 'relative',
    zIndex: 1,
    width: '8.6rem',
    height: '8.6rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(8, 8, 8, 0.88)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.28)',
  },
  scoreLabel: {
    fontSize: '1rem',
    fontWeight: 900,
  },
  scoreSubtext: {
    color: '#8f99ab',
    fontSize: '0.82rem',
    marginTop: '-0.3rem',
  },
  summaryText: {
    marginTop: '0.95rem',
    color: '#d7deea',
    lineHeight: 1.65,
  },
  miniRail: {
    display: 'grid',
    gap: '0.75rem',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  miniCard: {
    padding: '0.95rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  miniLabel: {
    color: '#8f99ab',
    fontSize: '0.74rem',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    marginBottom: '0.35rem',
  },
  miniValue: {
    fontSize: '1.1rem',
    fontWeight: 900,
  },
  severityBox: {
    display: 'grid',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  severityRow: {
    display: 'grid',
    gap: '0.45rem',
  },
  severityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    color: '#e8edf6',
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  severityTrack: {
    height: '0.8rem',
    borderRadius: '999px',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.06)',
  },
  severityFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 450ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  complexityCard: {
    padding: '1rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  complexityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '0.8rem',
  },
  complexityTitle: {
    marginTop: '0.2rem',
    color: '#f4f7fb',
    fontWeight: 800,
  },
  complexityScore: {
    padding: '0.45rem 0.7rem',
    borderRadius: '999px',
    background: 'rgba(167, 139, 250, 0.12)',
    border: '1px solid rgba(167, 139, 250, 0.22)',
    color: '#ddd6fe',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  section: {
    display: 'grid',
    gap: '0.75rem',
  },
  sectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#f4f7fb',
    fontSize: '0.96rem',
    fontWeight: 800,
    letterSpacing: '0.03em',
  },
  sectionCount: {
    minWidth: '2rem',
    padding: '0.28rem 0.6rem',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    textAlign: 'center',
    fontSize: '0.82rem',
    fontWeight: 800,
  },
  issueList: {
    display: 'grid',
    gap: '0.65rem',
  },
  issueCard: {
    padding: '0.95rem 1rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    boxShadow: '0 18px 38px rgba(0, 0, 0, 0.24)',
  },
  issueMessage: {
    color: '#e8edf6',
    lineHeight: 1.6,
  },
  issueMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.55rem',
    alignItems: 'center',
    marginTop: '0.45rem',
  },
  issueMeta: {
    color: '#9aa3b2',
    fontSize: '0.84rem',
  },
  issueSuggestion: {
    color: '#93c5fd',
    fontSize: '0.88rem',
  },
  fixedCard: {
    padding: '1rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  fixedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  fixedTitle: {
    marginTop: '0.2rem',
    fontWeight: 800,
    color: '#f4f7fb',
  },
  fixedChip: {
    padding: '0.45rem 0.7rem',
    borderRadius: '999px',
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#86efac',
    fontWeight: 800,
  },
  fixedCode: {
    margin: 0,
    padding: '0.95rem',
    borderRadius: '1rem',
    background: 'rgba(8, 8, 8, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#86efac',
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: '0.82rem',
    lineHeight: 1.7,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

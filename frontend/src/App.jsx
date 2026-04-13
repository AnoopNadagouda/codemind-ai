import { useEffect, useRef, useState } from 'react';
import CodeEditor from './components/CodeEditor.jsx';
import ReviewReport from './components/ReviewReport.jsx';
import ScoreBadge from './components/ScoreBadge.jsx';
import SearchTab from './components/SearchTab.jsx';
import IndexerTab from './components/IndexerTab.jsx';

const DEFAULT_LANGUAGE = 'Python';
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const STORAGE_KEY = 'codemind-ai-stats-v1';
const TAB_NAMES = ['Review', 'Search', 'Indexer'];
const AGENTS = [
  { key: 'bugs', label: 'Bug Hunter', tone: '#ef4444', soft: 'rgba(239, 68, 68, 0.12)' },
  { key: 'security', label: 'Security Guard', tone: '#f59e0b', soft: 'rgba(245, 158, 11, 0.12)' },
  { key: 'optimization', label: 'Optimizer', tone: '#60a5fa', soft: 'rgba(96, 165, 250, 0.12)' },
  { key: 'complexity', label: 'Complexity Lens', tone: '#a78bfa', soft: 'rgba(167, 139, 250, 0.12)' },
];

const placeholders = {
  Python: `def find_user(users, user_id):
    for i in range(len(users)):
        if users[i]['id'] == user_id:
            return users[i]
    return None`,
  JavaScript: `function fetchData(url) {
  var data = eval(url)
  for (var i = 0; i < data.length; i++) {
    console.log(data[i])
  }
}`,
  TypeScript: `function getUser(id: any): any {
  let result = db.query("SELECT * FROM users WHERE id = " + id)
  return result[0]
}`,
  Java: `public String getUserData(String id) {
  String query = "SELECT * FROM users WHERE id = " + id;
  ResultSet rs = stmt.executeQuery(query);
  return rs.getString("name");
}`,
  'C++': `int findMax(int arr[], int n) {
  int max = arr[0];
  for (int i = 0; i <= n; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}`,
  Go: `func getUser(id string) User {
  query := "SELECT * FROM users WHERE id = " + id
  row := db.QueryRow(query)
  var u User
  row.Scan(&u)
  return u
}`,
};

function App() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState(placeholders[DEFAULT_LANGUAGE]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Review');
  const [stats, setStats] = useState({ reviews: 0, bugsFound: 0, issuesFixed: 0 });
  const [loadingStage, setLoadingStage] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoverState, setHoverState] = useState('');

  const tabBarRef = useRef(null);
  const tabRefs = useRef([]);

  const score = report?.overall_score ?? 0;
  const loadingAgent = AGENTS[loadingStage] ?? AGENTS[0];
  const headline = getHeadline(report, score);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setStats({
          reviews: Number(parsed.reviews) || 0,
          bugsFound: Number(parsed.bugsFound) || 0,
          issuesFixed: Number(parsed.issuesFixed) || 0,
        });
      }
    } catch {
      setStats({ reviews: 0, bugsFound: 0, issuesFixed: 0 });
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage failures.
    }
  }, [stats]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulseTick((value) => (value + 1) % 240);
    }, 60);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function updateIndicator() {
      const bar = tabBarRef.current;
      const activeIndex = TAB_NAMES.indexOf(activeTab);
      const activeButton = tabRefs.current[activeIndex];

      if (!bar || !activeButton) {
        return;
      }

      const barRect = bar.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setTabIndicator({
        left: buttonRect.left - barRect.left + 6,
        width: buttonRect.width - 12,
        opacity: 1,
      });
    }

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return undefined;
    }

    setLoadingStage(0);

    const timer = window.setInterval(() => {
      setLoadingStage((value) => Math.min(value + 1, AGENTS.length - 1));
    }, 700);

    return () => window.clearInterval(timer);
  }, [loading]);

  async function analyzeCode(sourceCode = code, sourceLanguage = language, forceReviewTab = true) {
    if (!sourceCode.trim()) {
      setError('Paste or type code before analyzing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sourceCode, language: sourceLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'Review request failed');
      }

      setReport(data);
      if (forceReviewTab) {
        setActiveTab('Review');
      }
      setStats((current) => ({
        reviews: current.reviews + 1,
        bugsFound: current.bugsFound + (Array.isArray(data.bugs) ? data.bugs.length : 0),
        issuesFixed:
          current.issuesFixed +
          (Array.isArray(data.bugs) ? data.bugs.length : 0) +
          (Array.isArray(data.security) ? data.security.length : 0) +
          (Array.isArray(data.optimizations) ? data.optimizations.length : 0),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach the backend.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageChange(nextLanguage) {
    setLanguage(nextLanguage);
    setCode(placeholders[nextLanguage] || placeholders[DEFAULT_LANGUAGE]);
    setReport(null);
    setError('');
    setActiveTab('Review');
  }

  async function handleReviewFromSearch(nextCode, nextLanguage) {
    const resolvedLanguage = nextLanguage || DEFAULT_LANGUAGE;
    setLanguage(resolvedLanguage);
    setCode(nextCode);
    setReport(null);
    setError('');
    setActiveTab('Review');
    await analyzeCode(nextCode, resolvedLanguage, true);
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGrid} />

      <main style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.brandBlock}>
            <p style={styles.kicker}>Dark-mode review cockpit</p>
            <h1 style={styles.titleWrap}>
              <span
                style={{
                  ...styles.title,
                  textShadow: `0 0 ${14 + Math.sin(pulseTick / 14) * 7}px rgba(122, 162, 255, 0.28), 0 0 ${30 + Math.sin(pulseTick / 18) * 10}px rgba(160, 99, 255, 0.16)`,
                }}
              >
                CodeMind AI
              </span>
            </h1>
            <p style={styles.subtitle}>
              <span style={styles.subtitleAccent}>{headline}</span> · Four specialized agents inspect bugs, security, optimization, and complexity inside a premium workspace built for fast code triage.
            </p>
          </div>

          <div style={styles.headerRail}>
            <ScoreBadge score={score} />
            <div style={styles.agentRail}>
              {AGENTS.map((agent, index) => {
                const active = loading && index === loadingStage;
                return (
                  <div
                    key={agent.key}
                    style={{
                      ...styles.agentPill,
                      borderColor: active ? agent.tone : 'rgba(255, 255, 255, 0.1)',
                      background: active ? agent.soft : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: active ? `0 0 0 1px ${agent.tone}33, 0 12px 26px rgba(0, 0, 0, 0.4)` : 'none',
                      transform: active ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      opacity: loading ? (index <= loadingStage ? 1 : 0.72) : 1,
                    }}
                  >
                    <span
                      style={{
                        ...styles.agentDot,
                        background: agent.tone,
                        boxShadow: active ? `0 0 18px ${agent.tone}` : 'none',
                      }}
                    />
                    <span style={styles.agentLabel}>{agent.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <section style={styles.topBar}>
          <label style={styles.fieldLabel}>
            Language
            <select
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              style={styles.select}
            >
              {Object.keys(placeholders).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div style={styles.actionGroup}>
            <button
              type="button"
              onClick={() => analyzeCode()}
              onMouseEnter={() => setHoverState('analyze')}
              onMouseLeave={() => setHoverState('')}
              style={{
                ...styles.primaryButton,
                ...(hoverState === 'analyze' ? styles.primaryButtonHover : null),
                opacity: loading ? 0.88 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Reviewing...' : 'Run review'}
            </button>

            <div style={styles.quickMeta}>
              <span style={styles.quickMetaLabel}>Live score</span>
              <span style={styles.quickMetaValue}>{score}/100</span>
            </div>
          </div>
        </section>

        {error ? <div style={styles.error}>{error}</div> : null}

        <section style={styles.tabShell}>
          <div ref={tabBarRef} style={styles.tabBar}>
            {TAB_NAMES.map((tab, index) => {
              const active = tab === activeTab;
              return (
                <button
                  key={tab}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  onMouseEnter={() => setHoverState(`tab-${tab}`)}
                  onMouseLeave={() => setHoverState('')}
                  style={{
                    ...styles.tabButton,
                    ...(active ? styles.tabButtonActive : null),
                    ...(hoverState === `tab-${tab}` ? styles.tabButtonHover : null),
                  }}
                >
                  {tab}
                </button>
              );
            })}

            <span
              style={{
                ...styles.tabIndicator,
                opacity: tabIndicator.opacity,
                width: `${tabIndicator.width}px`,
                transform: `translateX(${tabIndicator.left}px)`,
              }}
            />
          </div>
        </section>

        <section style={styles.panelGrid}>
          {activeTab === 'Review' ? (
            <>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <p style={styles.panelKicker}>Source code</p>
                    <h2 style={styles.panelTitle}>Editor</h2>
                  </div>
                  <span style={styles.panelMeta}>{language}</span>
                </div>
                <CodeEditor code={code} onChange={setCode} language={language} />
              </div>

              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <p style={styles.panelKicker}>Agent output</p>
                    <h2 style={styles.panelTitle}>Review report</h2>
                  </div>
                  <span style={styles.panelMeta}>FastAPI backend</span>
                </div>
                <ReviewReport
                  report={report}
                  loading={loading}
                  loadingStage={loadingStage}
                  loadingAgent={loadingAgent}
                  loadingProgress={Math.min(100, ((loadingStage + 1) / AGENTS.length) * 100)}
                  error={error}
                />
              </div>
            </>
          ) : null}

          {activeTab === 'Search' ? (
            <>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <p style={styles.panelKicker}>Semantic search</p>
                    <h2 style={styles.panelTitle}>Code retrieval engine</h2>
                  </div>
                  <span style={styles.panelMeta}>ChromaDB + embeddings</span>
                </div>
                <SearchTab apiUrl={API_URL} onReviewCode={handleReviewFromSearch} />
              </div>
            </>
          ) : null}

          {activeTab === 'Indexer' ? (
            <>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <p style={styles.panelKicker}>Vector indexing</p>
                    <h2 style={styles.panelTitle}>Repository indexer</h2>
                  </div>
                  <span style={styles.panelMeta}>Sentence Transformers + ChromaDB</span>
                </div>

                <IndexerTab apiUrl={API_URL} />
              </div>
            </>
          ) : null}
        </section>

        <footer style={styles.footerBar}>
          <div style={styles.footerCard}>
            <span style={styles.footerLabel}>Total reviews done</span>
            <strong style={styles.footerValue}>{formatNumber(stats.reviews)}</strong>
          </div>
          <div style={styles.footerCard}>
            <span style={styles.footerLabel}>Bugs found</span>
            <strong style={styles.footerValue}>{formatNumber(stats.bugsFound)}</strong>
          </div>
          <div style={styles.footerCard}>
            <span style={styles.footerLabel}>Issues fixed</span>
            <strong style={styles.footerValue}>{formatNumber(stats.issuesFixed)}</strong>
          </div>
        </footer>
      </main>
    </div>
  );
}

function getHeadline(report, score) {
  if (!report) {
    return 'Review code with precision';
  }

  if (score >= 85) {
    return 'Clean, high-confidence code';
  }

  if (score >= 65) {
    return 'Solid code with a few sharp edges';
  }

  return 'A few critical fixes are needed';
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#080808',
    color: '#f4f7fb',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
  },
  bgGlowA: {
    position: 'absolute',
    inset: '-6rem auto auto -8rem',
    width: '28rem',
    height: '28rem',
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(74, 144, 226, 0.22), rgba(74, 144, 226, 0) 68%)',
    filter: 'blur(10px)',
    pointerEvents: 'none',
  },
  bgGlowB: {
    position: 'absolute',
    right: '-10rem',
    bottom: '-8rem',
    width: '34rem',
    height: '34rem',
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.18), rgba(167, 139, 250, 0) 68%)',
    filter: 'blur(18px)',
    pointerEvents: 'none',
  },
  bgGrid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.18,
    pointerEvents: 'none',
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
    backgroundSize: '72px 72px',
    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.72), rgba(0,0,0,0.04))',
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    width: 'min(1400px, calc(100% - 1.5rem))',
    margin: '0 auto',
    padding: '1rem 0 1.25rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  brandBlock: {
    flex: '1 1 460px',
    minWidth: 0,
  },
  kicker: {
    margin: 0,
    color: '#8f99ab',
    textTransform: 'uppercase',
    letterSpacing: '0.34em',
    fontSize: '0.68rem',
    fontWeight: 700,
  },
  titleWrap: {
    margin: '0.3rem 0 0.45rem',
    lineHeight: 1,
  },
  title: {
    display: 'inline-block',
    fontSize: 'clamp(2.3rem, 5vw, 4.5rem)',
    letterSpacing: '-0.06em',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #f9fbff 0%, #8ea8ff 32%, #d0a2ff 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  subtitle: {
    margin: 0,
    maxWidth: '72ch',
    color: '#c5cfdd',
    fontSize: '0.98rem',
    lineHeight: 1.7,
  },
  subtitleAccent: {
    color: '#f8fbff',
    fontWeight: 800,
  },
  headerRail: {
    flex: '0 1 440px',
    minWidth: 0,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  agentRail: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: '0.55rem',
  },
  agentPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0.6rem 0.75rem',
    backdropFilter: 'blur(18px)',
    transition: 'transform 220ms ease, box-shadow 220ms ease, background 220ms ease, border-color 220ms ease, opacity 220ms ease',
  },
  agentDot: {
    width: '0.55rem',
    height: '0.55rem',
    borderRadius: '999px',
    flexShrink: 0,
  },
  agentLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    color: '#eef2f8',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '0.9rem',
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#8f99ab',
  },
  select: {
    minWidth: '13rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '0.95rem',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f8fd',
    padding: '0.95rem 1rem',
    outline: 'none',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    padding: '0.95rem 1.25rem',
    background: 'linear-gradient(135deg, rgba(109, 92, 255, 0.95), rgba(63, 177, 255, 0.95))',
    color: '#ffffff',
    fontWeight: 800,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    boxShadow: '0 14px 35px rgba(58, 100, 255, 0.22)',
    transition: 'transform 220ms ease, box-shadow 220ms ease, filter 220ms ease, opacity 220ms ease',
  },
  primaryButtonHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 18px 42px rgba(58, 100, 255, 0.3)',
    filter: 'brightness(1.06)',
  },
  quickMeta: {
    minWidth: '132px',
    padding: '0.8rem 1rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(18px)',
  },
  quickMetaLabel: {
    display: 'block',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: '#8b94a5',
    marginBottom: '0.2rem',
  },
  quickMetaValue: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#f8fbff',
  },
  error: {
    marginBottom: '0.9rem',
    padding: '0.95rem 1rem',
    borderRadius: '1rem',
    background: 'rgba(127, 29, 29, 0.35)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    color: '#fecaca',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
  },
  tabShell: {
    marginBottom: '0.9rem',
  },
  tabBar: {
    position: 'relative',
    display: 'flex',
    gap: '0.45rem',
    padding: '0.35rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
  },
  tabButton: {
    position: 'relative',
    zIndex: 1,
    border: 'none',
    borderRadius: '0.95rem',
    padding: '0.8rem 1.1rem',
    background: 'transparent',
    color: '#8d96a8',
    fontWeight: 700,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transition: 'transform 180ms ease, color 180ms ease, background 180ms ease',
  },
  tabButtonHover: {
    transform: 'translateY(-1px)',
    color: '#f4f7fb',
    background: 'rgba(255, 255, 255, 0.04)',
  },
  tabButtonActive: {
    color: '#ffffff',
  },
  tabIndicator: {
    position: 'absolute',
    top: '0.35rem',
    bottom: '0.35rem',
    left: 0,
    borderRadius: '0.95rem',
    background: 'linear-gradient(135deg, rgba(94, 114, 250, 0.2), rgba(114, 64, 255, 0.28))',
    border: '1px solid rgba(148, 163, 255, 0.24)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
    transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
    pointerEvents: 'none',
  },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '0.95rem',
    alignItems: 'start',
    marginBottom: '1rem',
  },
  panel: {
    minHeight: '36rem',
    padding: '1rem',
    borderRadius: '1.35rem',
    background: 'rgba(255, 255, 255, 0.045)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    boxShadow: '0 26px 70px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(18px)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.85rem',
  },
  panelKicker: {
    margin: 0,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#8e98a8',
  },
  panelTitle: {
    margin: '0.2rem 0 0',
    fontSize: '1rem',
    letterSpacing: '0.02em',
    color: '#f6f8fc',
  },
  panelMeta: {
    fontSize: '0.82rem',
    color: '#9aa3b2',
    whiteSpace: 'nowrap',
  },
  searchField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    color: '#8f99ab',
    fontSize: '0.78rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: '0.95rem',
  },
  searchInput: {
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '0.95rem',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f8fd',
    padding: '0.95rem 1rem',
    outline: 'none',
  },
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  matchCard: {
    padding: '0.9rem 0.95rem',
    borderRadius: '1rem',
    background: 'rgba(8, 8, 8, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderLeft: '4px solid rgba(96, 165, 250, 0.9)',
  },
  matchLine: {
    fontSize: '0.72rem',
    color: '#8c96a7',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    marginBottom: '0.4rem',
  },
  matchText: {
    fontSize: '0.92rem',
    color: '#e9eef8',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  matchHighlight: {
    padding: '0 0.18rem',
    borderRadius: '0.28rem',
    background: 'rgba(167, 139, 250, 0.28)',
    color: '#f7f2ff',
  },
  emptyState: {
    minHeight: '20rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    textAlign: 'center',
    padding: '1.2rem',
  },
  emptyIcon: {
    fontSize: '2rem',
    color: '#647084',
    fontFamily: '"JetBrains Mono", monospace',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 800,
    color: '#f4f7fb',
  },
  emptyCopy: {
    margin: 0,
    maxWidth: '34ch',
    color: '#98a2b3',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  statsStack: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
  },
  inlineMetric: {
    padding: '0.9rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.035)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  inlineMetricLabel: {
    display: 'block',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: '#8f99ab',
    marginBottom: '0.45rem',
  },
  inlineMetricValue: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#f4f7fb',
  },
  indexRail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.95rem',
  },
  indexItem: {
    padding: '0.95rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.035)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  indexItemHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.55rem',
  },
  indexItemLabel: {
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: '#9aa3b2',
  },
  indexItemValue: {
    fontSize: '1.05rem',
    fontWeight: 800,
  },
  indexTrack: {
    height: '0.72rem',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  indexFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 500ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  snapshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '0.75rem',
  },
  snapshotCard: {
    padding: '1rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  snapshotLabel: {
    display: 'block',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: '#8f99ab',
    marginBottom: '0.45rem',
  },
  snapshotValue: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#f4f7fb',
  },
  footerBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  footerCard: {
    padding: '0.95rem 1rem',
    borderRadius: '1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(18px)',
  },
  footerLabel: {
    display: 'block',
    fontSize: '0.74rem',
    color: '#8f99ab',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    marginBottom: '0.35rem',
  },
  footerValue: {
    display: 'block',
    fontSize: '1.35rem',
    color: '#f8fbff',
    lineHeight: 1.1,
  },
};

export default App;

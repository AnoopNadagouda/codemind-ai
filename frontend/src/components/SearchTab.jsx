import { useMemo, useState } from 'react';

export default function SearchTab({ apiUrl, onReviewCode }) {
  const [query, setQuery] = useState('function that validates email');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasResults = useMemo(() => results.length > 0, [results]);

  async function runSearch() {
    if (!query.trim()) {
      setError('Enter a query before searching.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: Number(topK) || 5 }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Search request failed');
      }

      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run semantic search.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.controlsCard}>
        <div style={styles.controlsRow}>
          <label style={styles.fieldLabel}>
            Semantic Query
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="function that validates email"
              style={styles.input}
            />
          </label>

          <label style={{ ...styles.fieldLabel, maxWidth: '7rem' }}>
            Top K
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(event) => setTopK(event.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={runSearch}
          disabled={loading}
          style={{
            ...styles.searchButton,
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? 'Searching...' : 'Search Codebase'}
        </button>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
      </div>

      {hasResults ? (
        <div style={styles.resultsList}>
          {results.map((result, index) => (
            <article key={`${result.filename}-${result.start_line}-${index}`} style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div>
                  <div style={styles.fileName}>{result.filename}</div>
                  <div style={styles.metaText}>
                    {result.language} • lines {result.start_line}-{result.end_line}
                  </div>
                </div>
                <div style={styles.scoreChip}>{Math.round((result.similarity || 0) * 100)}%</div>
              </div>

              <pre style={styles.codeBlock}>{result.code}</pre>

              <button
                type="button"
                onClick={() => onReviewCode(result.code, result.language)}
                style={styles.reviewButton}
              >
                Review this code →
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div style={styles.emptyCard}>
          <div style={styles.emptyTitle}>No search results yet</div>
          <div style={styles.emptyCopy}>Index a code snippet or GitHub repo first, then run a semantic query to retrieve similar code.</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  controlsCard: {
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.035)',
    padding: '1rem',
    display: 'grid',
    gap: '0.8rem',
  },
  controlsRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  fieldLabel: {
    display: 'grid',
    gap: '0.4rem',
    flex: '1 1 260px',
    color: '#9aa3b2',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  input: {
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '0.9rem',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f6f8fc',
    padding: '0.8rem 0.9rem',
    outline: 'none',
  },
  searchButton: {
    justifySelf: 'start',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, rgba(109, 92, 255, 0.95), rgba(63, 177, 255, 0.95))',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  errorBox: {
    borderRadius: '0.9rem',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    background: 'rgba(127, 29, 29, 0.35)',
    color: '#fecaca',
    padding: '0.7rem 0.85rem',
  },
  resultsList: {
    display: 'grid',
    gap: '0.8rem',
  },
  resultCard: {
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(16px)',
    padding: '0.9rem',
    boxShadow: '0 18px 32px rgba(0, 0, 0, 0.3)',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.6rem',
  },
  fileName: {
    color: '#f6f8fc',
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  metaText: {
    color: '#9aa3b2',
    fontSize: '0.82rem',
  },
  scoreChip: {
    borderRadius: '999px',
    padding: '0.35rem 0.6rem',
    border: '1px solid rgba(167, 139, 250, 0.3)',
    background: 'rgba(167, 139, 250, 0.15)',
    color: '#ddd6fe',
    fontWeight: 800,
    fontSize: '0.82rem',
    whiteSpace: 'nowrap',
  },
  codeBlock: {
    margin: 0,
    borderRadius: '0.85rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(8, 8, 8, 0.7)',
    color: '#dbe4f1',
    padding: '0.8rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflow: 'auto',
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: '0.82rem',
    lineHeight: 1.6,
  },
  reviewButton: {
    marginTop: '0.7rem',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    borderRadius: '999px',
    background: 'rgba(96, 165, 250, 0.16)',
    color: '#bfdbfe',
    fontWeight: 700,
    padding: '0.6rem 0.9rem',
    cursor: 'pointer',
  },
  emptyCard: {
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '1.2rem',
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#f6f8fc',
    fontWeight: 700,
    marginBottom: '0.3rem',
  },
  emptyCopy: {
    color: '#9aa3b2',
    lineHeight: 1.6,
  },
};

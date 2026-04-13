import { useState } from 'react';

const LANGUAGE_OPTIONS = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go'];

export default function IndexerTab({ apiUrl }) {
  const [filename, setFilename] = useState('sample.py');
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState(`def validate_email(email):\n    return '@' in email and '.' in email`);
  const [githubUrl, setGithubUrl] = useState('');
  const [loadingSnippet, setLoadingSnippet] = useState(false);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function indexSnippet() {
    if (!code.trim() || !filename.trim()) {
      setError('Provide both filename and code to index.');
      return;
    }

    setLoadingSnippet(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`${apiUrl}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, filename, language }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Indexing snippet failed');
      }

      setResult(`Indexed ${data.chunks_indexed} chunks successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Snippet indexing failed.');
    } finally {
      setLoadingSnippet(false);
    }
  }

  async function indexRepository() {
    if (!githubUrl.trim()) {
      setError('Enter a public GitHub repository URL first.');
      return;
    }

    setLoadingRepo(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`${apiUrl}/index/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: githubUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'GitHub indexing failed');
      }

      setResult(`Processed ${data.files_processed} files and indexed ${data.chunks_indexed} chunks.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Repository indexing failed.');
    } finally {
      setLoadingRepo(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <section style={styles.card}>
        <div style={styles.heading}>Index Code Snippet</div>
        <div style={styles.row}>
          <label style={styles.fieldLabel}>
            Filename
            <input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              style={styles.input}
              placeholder="utils/validators.py"
            />
          </label>

          <label style={{ ...styles.fieldLabel, maxWidth: '14rem' }}>
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              style={styles.input}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={styles.fieldLabel}>
          Code
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            style={styles.codeArea}
            spellCheck={false}
          />
        </label>

        <button
          type="button"
          onClick={indexSnippet}
          disabled={loadingSnippet}
          style={{ ...styles.actionButton, opacity: loadingSnippet ? 0.75 : 1 }}
        >
          {loadingSnippet ? 'Indexing snippet...' : 'Index snippet'}
        </button>
      </section>

      <section style={styles.card}>
        <div style={styles.heading}>Index GitHub Repository</div>
        <label style={styles.fieldLabel}>
          Public repo URL
          <input
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            style={styles.input}
            placeholder="https://github.com/owner/repo"
          />
        </label>

        <button
          type="button"
          onClick={indexRepository}
          disabled={loadingRepo}
          style={{ ...styles.actionButton, opacity: loadingRepo ? 0.75 : 1 }}
        >
          {loadingRepo ? 'Indexing repository...' : 'Index GitHub repo'}
        </button>
      </section>

      {result ? <div style={styles.successBox}>{result}</div> : null}
      {error ? <div style={styles.errorBox}>{error}</div> : null}
    </div>
  );
}

const styles = {
  wrap: {
    display: 'grid',
    gap: '0.85rem',
  },
  card: {
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '1rem',
    display: 'grid',
    gap: '0.75rem',
  },
  heading: {
    color: '#f6f8fc',
    fontWeight: 700,
    fontSize: '1rem',
  },
  row: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  fieldLabel: {
    display: 'grid',
    gap: '0.4rem',
    flex: '1 1 240px',
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
    padding: '0.78rem 0.9rem',
    outline: 'none',
  },
  codeArea: {
    minHeight: '180px',
    resize: 'vertical',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '0.9rem',
    background: 'rgba(8, 8, 8, 0.7)',
    color: '#dbe4f1',
    padding: '0.8rem',
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: '0.82rem',
    lineHeight: 1.6,
    outline: 'none',
  },
  actionButton: {
    justifySelf: 'start',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    padding: '0.72rem 1rem',
    background: 'linear-gradient(135deg, rgba(109, 92, 255, 0.95), rgba(63, 177, 255, 0.95))',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  successBox: {
    borderRadius: '0.9rem',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    background: 'rgba(34, 197, 94, 0.12)',
    color: '#86efac',
    padding: '0.75rem 0.9rem',
  },
  errorBox: {
    borderRadius: '0.9rem',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    background: 'rgba(127, 29, 29, 0.35)',
    color: '#fecaca',
    padding: '0.75rem 0.9rem',
  },
};

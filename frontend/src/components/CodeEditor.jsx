import { useRef, useState } from 'react';

export default function CodeEditor({ code, onChange, language }) {
  const textareaRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [activeLine, setActiveLine] = useState(1);

  const lines = code.split('\n');
  const displayLines = Math.max(lines.length, 12);
  const editorHeight = Math.max(displayLines * 28 + 48, 360);
  const currentLine = Math.min(activeLine, Math.max(lines.length, 1));

  function handleSelection() {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    const selectionIndex = element.selectionStart ?? 0;
    const lineIndex = code.slice(0, selectionIndex).split('\n').length;
    setActiveLine(Math.max(lineIndex, 1));
  }

  function handleScroll(event) {
    setScrollTop(event.currentTarget.scrollTop);
  }

  return (
    <div style={{ ...styles.shell, minHeight: `${editorHeight}px` }}>
      <div style={{ ...styles.gutter, height: `${editorHeight}px` }} aria-hidden="true">
        <div style={{ ...styles.gutterInner, transform: `translateY(-${scrollTop}px)` }}>
          {Array.from({ length: displayLines }, (_, index) => {
            const lineNumber = index + 1;
            const active = lineNumber === currentLine;

            return (
              <div
                key={lineNumber}
                style={{
                  ...styles.gutterLine,
                  ...(active ? styles.gutterLineActive : null),
                }}
              >
                {lineNumber}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.codeStage}>
        <div
          style={{
            ...styles.codeMirror,
            height: `${editorHeight}px`,
            transform: `translateY(-${scrollTop}px)`,
          }}
          aria-hidden="true"
        >
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const active = lineNumber === currentLine;

            return (
              <div
                key={`${lineNumber}-${line}`}
                style={{
                  ...styles.codeLine,
                  ...(active ? styles.codeLineActive : null),
                }}
              >
                {renderHighlightedLine(line, language)}
              </div>
            );
          })}

          {!code.trim() ? (
            <div style={styles.placeholderWrap}>
              <div style={styles.placeholderTitle}>Paste code to start the review.</div>
              <div style={styles.placeholderCopy}>Syntax, line numbers, and the active line highlight appear immediately.</div>
            </div>
          ) : null}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          onClick={handleSelection}
          onKeyUp={handleSelection}
          onSelect={handleSelection}
          placeholder={placeholders[language] || placeholders.Python}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={styles.textarea}
        />
      </div>
    </div>
  );
}

const placeholders = {
  Python: `def find_user(users, id):
    for i in range(len(users)):
        if users[i]['id'] == id:
            return users[i]
    return None`,
  JavaScript: `function fetchData(url) {
  var data = eval(url);
  for (var i = 0; i < data.length; i++) {
    console.log(data[i]);
  }
}`,
  TypeScript: `function getUser(id: any): any {
  let result = db.query("SELECT * FROM users WHERE id = " + id);
  return result[0];
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

function renderHighlightedLine(line, language) {
  if (!line) {
    return <span style={styles.softText}> </span>;
  }

  const keywords = getKeywords(language);
  const keywordPattern = keywords.length ? `\\b(?:${keywords.map(escapeRegex).join('|')})\\b` : 'a^';
  const commentPattern = language === 'Python' ? '(#.*$)' : '(//.*$|/\\*.*?\\*/|#.*$)';
  const stringPattern =
    '"(?:\\\\.|[^"\\\\])*"' +
    "|'(?:\\\\.|[^'\\\\])*'" +
    '|`(?:\\\\.|[^`\\\\])*`';
  const numberPattern = '\\b\\d+(?:\\.\\d+)?\\b';
  const pattern = new RegExp(`${commentPattern}|${stringPattern}|${keywordPattern}|${numberPattern}`, 'g');

  const parts = [];
  let cursor = 0;
  let match;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) {
      parts.push(<span key={`plain-${cursor}`}>{line.slice(cursor, match.index)}</span>);
    }

    const token = match[0];
    parts.push(
      <span key={`token-${match.index}`} style={getTokenStyle(token, keywords)}>
        {token}
      </span>,
    );
    cursor = match.index + token.length;
  }

  if (cursor < line.length) {
    parts.push(<span key={`tail-${cursor}`}>{line.slice(cursor)}</span>);
  }

  return parts.length > 0 ? parts : <span>{line}</span>;
}

function getTokenStyle(token, keywords) {
  if (/^\/\//.test(token) || /^#/.test(token) || /^\/\*/.test(token)) {
    return styles.comment;
  }

  if (/^['"`]/.test(token)) {
    return styles.string;
  }

  if (keywords.includes(token)) {
    return styles.keyword;
  }

  if (/^\d/.test(token)) {
    return styles.number;
  }

  return styles.plainToken;
}

function getKeywords(language) {
  const keywordMap = {
    Python: ['def', 'return', 'for', 'in', 'if', 'else', 'elif', 'None', 'True', 'False', 'class', 'import', 'from', 'try', 'except', 'while', 'with'],
    JavaScript: ['function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'class', 'new', 'try', 'catch', 'async', 'await', 'null', 'true', 'false'],
    TypeScript: ['function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'class', 'new', 'type', 'interface', 'extends', 'implements', 'null', 'true', 'false', 'any', 'string', 'number', 'boolean'],
    Java: ['public', 'private', 'protected', 'class', 'return', 'new', 'if', 'else', 'for', 'while', 'try', 'catch', 'static', 'final', 'void', 'null', 'true', 'false'],
    'C++': ['int', 'float', 'double', 'return', 'if', 'else', 'for', 'while', 'class', 'public', 'private', 'const', 'auto', 'void', 'nullptr', 'true', 'false'],
    Go: ['func', 'return', 'if', 'else', 'for', 'range', 'struct', 'package', 'import', 'var', 'const', 'type', 'nil', 'true', 'false'],
  };

  return keywordMap[language] || keywordMap.Python;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const styles = {
  shell: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '72px minmax(0, 1fr)',
    minHeight: '100%',
    borderRadius: '1.2rem',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(6, 6, 6, 0.82)',
  },
  gutter: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(13, 13, 13, 0.98), rgba(9, 9, 9, 0.98))',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
  },
  gutterInner: {
    position: 'absolute',
    inset: 0,
    padding: '18px 0',
    transition: 'transform 140ms ease-out',
  },
  gutterLine: {
    height: '28px',
    paddingRight: '14px',
    color: '#3e4351',
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: '0.8rem',
    lineHeight: '28px',
    textAlign: 'right',
    userSelect: 'none',
    transition: 'color 180ms ease, background 180ms ease',
  },
  gutterLineActive: {
    color: '#98a8c9',
    background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.12), rgba(96, 165, 250, 0))',
  },
  codeStage: {
    position: 'relative',
    minHeight: '100%',
    background: 'linear-gradient(180deg, rgba(7, 7, 7, 0.98), rgba(10, 10, 10, 0.98))',
  },
  codeMirror: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    padding: '18px 18px 18px 16px',
    pointerEvents: 'none',
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: '0.86rem',
    lineHeight: '28px',
    letterSpacing: '0.01em',
    whiteSpace: 'pre',
  },
  codeLine: {
    minHeight: '28px',
    borderRadius: '0.5rem',
    paddingLeft: '0.2rem',
    color: '#d2d7e2',
    transition: 'background 180ms ease, color 180ms ease',
  },
  codeLineActive: {
    background: 'rgba(96, 165, 250, 0.08)',
    boxShadow: 'inset 0 0 0 1px rgba(96, 165, 250, 0.08)',
  },
  textarea: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    minHeight: '100%',
    resize: 'none',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'transparent',
    caretColor: '#f4f7fb',
    padding: '18px 18px 18px 16px',
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: '0.86rem',
    lineHeight: '28px',
    letterSpacing: '0.01em',
    whiteSpace: 'pre',
    overflow: 'auto',
    tabSize: 2,
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255, 255, 255, 0.18) transparent',
  },
  placeholderWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  placeholderTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#f4f7fb',
    marginBottom: '0.35rem',
  },
  placeholderCopy: {
    maxWidth: '28ch',
    color: '#8c96a7',
    fontSize: '0.88rem',
    lineHeight: 1.6,
  },
  softText: {
    color: '#3f4554',
  },
  plainToken: {
    color: '#d2d7e2',
  },
  keyword: {
    color: '#c084fc',
  },
  string: {
    color: '#4ade80',
  },
  comment: {
    color: '#7f8796',
  },
  number: {
    color: '#fbbf24',
  },
};

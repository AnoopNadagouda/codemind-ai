import json
import os

from .anthropic_client import create_anthropic_client

client = create_anthropic_client()

async def scan_security(code: str, language: str) -> list:
    """
    Agent 2: Scan for security vulnerabilities.
    Returns list of security issues mapped to CVE-style categories.
    """
    prompt = f"""You are an expert security scanner agent specialized in {language}.

Analyze this code for security vulnerabilities including:
- SQL Injection
- XSS (Cross-Site Scripting)
- Hardcoded secrets / API keys / passwords
- Insecure random number generation
- Path traversal attacks
- Command injection
- Insecure deserialization
- Broken authentication
- Sensitive data exposure

Code to analyze:
```{language}
{code}
```

Respond ONLY with a JSON array. No explanation, no markdown, just raw JSON.
Format:
[
  {{
    "message": "Clear description of the vulnerability",
    "line": 5,
    "severity": "critical",
    "cve_category": "CWE-89: SQL Injection",
    "suggestion": "Use parameterized queries instead"
  }}
]

If no issues found, return: []
Severity must be one of: critical, high, medium, low"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        return [{"message": f"Security scan error: {str(e)}", "line": 0, "severity": "low", "cve_category": "N/A", "suggestion": "Check your API key"}]

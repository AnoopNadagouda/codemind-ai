import json
import os

from .anthropic_client import create_anthropic_client

client = create_anthropic_client()

async def detect_bugs(code: str, language: str) -> list:
    """
    Agent 1: Detect bugs in the code.
    Returns a list of bug objects with message, line, severity, suggestion.
    """
    prompt = f"""You are an expert {language} bug detector agent.

Analyze this code and find ALL bugs including:
- Logic errors
- Null/undefined reference risks  
- Off-by-one errors
- Unhandled exceptions
- Infinite loops
- Wrong variable usage
- Type errors

Code to analyze:
```{language}
{code}
```

Respond ONLY with a JSON array. No explanation, no markdown, just the raw JSON array.
Format:
[
  {{
    "message": "Clear description of the bug",
    "line": 3,
    "severity": "high",
    "suggestion": "How to fix it"
  }}
]

If no bugs found, return an empty array: []
Severity must be one of: high, medium, low"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        # Clean up any accidental markdown fences
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        return [{"message": f"Bug detection error: {str(e)}", "line": 0, "severity": "low", "suggestion": "Check your API key"}]

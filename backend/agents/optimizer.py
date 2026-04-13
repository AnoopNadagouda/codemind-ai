import json
import os

from .anthropic_client import create_anthropic_client

client = create_anthropic_client()

async def optimize_code(code: str, language: str) -> list:
    """
    Agent 3: Find performance optimizations and return fixed code.
    """
    prompt = f"""You are an expert {language} performance optimization agent.

Analyze this code and find optimizations including:
- Inefficient loops (O(n²) that can be O(n))
- Redundant computations
- Memory inefficiencies  
- Better data structures to use
- Language-specific best practices
- Readability improvements

Code to analyze:
```{language}
{code}
```

Respond ONLY with a JSON object. No explanation, no markdown, just raw JSON.
Format:
{{
  "optimizations": [
    {{
      "message": "Clear description of what to improve",
      "line": 2,
      "suggestion": "Use a dictionary for O(1) lookup instead of O(n) loop"
    }}
  ],
  "fixed_code": "the complete rewritten optimized version of the code here"
}}"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)
        # Attach fixed_code to first optimization item for easy access
        opts = data.get("optimizations", [])
        if opts:
            opts[0]["fixed_code"] = data.get("fixed_code", "")
        return opts
    except Exception as e:
        return [{"message": f"Optimization error: {str(e)}", "line": 0, "suggestion": "Check your API key"}]

import json
import os

from .anthropic_client import create_anthropic_client

client = create_anthropic_client()

async def analyze_complexity(code: str, language: str) -> dict:
    """
    Agent 4: Analyze time and space complexity.
    Returns Big-O notation with interview-ready explanation.
    """
    prompt = f"""You are an expert algorithm complexity analyzer.

Analyze this {language} code and determine:
1. Time complexity (Big-O notation)
2. Space complexity (Big-O notation)
3. A score from 1-10 (10 = best possible complexity like O(1) or O(log n))
4. A short interview-ready explanation of WHY it has this complexity
5. How to improve the complexity if possible

Code to analyze:
```{language}
{code}
```

Respond ONLY with a JSON object. No explanation, no markdown, just raw JSON.
Format:
{{
  "time_complexity": "O(n)",
  "space_complexity": "O(1)",
  "notation": "O(n)",
  "score": 6,
  "explanation": "This code has O(n) time complexity because it iterates through the entire list once in the for loop. Each iteration does O(1) work, so the total is O(n) where n is the length of the list.",
  "improvement": "If you need to call this frequently, convert the list to a dictionary first (O(n) one-time cost) and then each lookup becomes O(1).",
  "is_optimal": false
}}"""

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
        return {
            "time_complexity": "Unknown",
            "space_complexity": "Unknown",
            "notation": "?",
            "score": 5,
            "explanation": f"Analysis error: {str(e)}",
            "improvement": "Check your API key",
            "is_optimal": False
        }

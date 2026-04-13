import os

import anthropic


def create_anthropic_client():
    api_key = (
        os.environ.get('ANTHROPIC_API_KEY')
        or os.environ.get('CLAUDE_CODE_KEY')
        or os.environ.get('CLAUDE_API_KEY')
        or os.environ.get('ANTHROPIC_KEY')
    )

    return anthropic.Anthropic(api_key=api_key)
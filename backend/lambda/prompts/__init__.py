"""
Prompts package for ScamGuard Lambda handlers
Manages system prompts for different analysis modes
"""

import os
from pathlib import Path

# Get the directory where this file is located
PROMPTS_DIR = Path(__file__).parent


def load_prompt(prompt_name: str) -> str:
    """
    Load a system prompt from file

    Args:
        prompt_name (str): Name of prompt (without .txt extension)

    Returns:
        str: The prompt content

    Raises:
        FileNotFoundError: If prompt file doesn't exist
    """
    prompt_file = PROMPTS_DIR / f"{prompt_name}.txt"

    if not prompt_file.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_file}")

    with open(prompt_file, 'r', encoding='utf-8') as f:
        return f.read()


def get_quebec_expert_prompt() -> str:
    """
    Get the Quebec cybersecurity expert system prompt

    Returns:
        str: The full system prompt for Quebec expert mode
    """
    return load_prompt('system_prompt_quebec_expert')


__all__ = [
    'load_prompt',
    'get_quebec_expert_prompt'
]

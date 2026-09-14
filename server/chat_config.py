"""Configuration for the chat provider used by the FastAPI service."""

from dataclasses import dataclass
import os
from typing import Mapping


GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "qwen/qwen3.8-27b"
MINIMAX_BASE_URL = "https://api.minimax.io/v1"
MINIMAX_DEFAULT_MODEL = "MiniMax-M2.5"


class ChatConfigurationError(ValueError):
    """Raised when the configured chat provider cannot be used."""


@dataclass(frozen=True)
class ChatSettings:
    """Validated settings needed to instantiate an OpenAI-compatible client."""

    provider: str
    api_key: str
    base_url: str
    model: str
    temperature: float
    timeout: float
    max_retries: int


def _read_float(env: Mapping[str, str], name: str, default: str) -> float:
    try:
        value = float(env.get(name, default))
    except (TypeError, ValueError) as error:
        raise ChatConfigurationError(f"{name} must be a number") from error
    if value <= 0:
        raise ChatConfigurationError(f"{name} must be greater than zero")
    return value


def _read_int(env: Mapping[str, str], name: str, default: str) -> int:
    try:
        value = int(env.get(name, default))
    except (TypeError, ValueError) as error:
        raise ChatConfigurationError(f"{name} must be an integer") from error
    if value < 0:
        raise ChatConfigurationError(f"{name} cannot be negative")
    return value


def _resolve_provider(env: Mapping[str, str]) -> str:
    configured_provider = env.get("CHAT_PROVIDER", "").strip().lower()
    if configured_provider:
        return configured_provider

    # Groq is the preferred provider, while keeping existing MiniMax setups
    # working when only MINIMAX_API_KEY is present.
    if env.get("GROQ_API_KEY", "").strip():
        return "groq"
    if env.get("MINIMAX_API_KEY", "").strip():
        return "minimax"
    return "groq"


def load_chat_settings(env: Mapping[str, str] | None = None) -> ChatSettings:
    """Load and validate chat settings without exposing credential values."""

    source = os.environ if env is None else env
    provider = _resolve_provider(source)

    if provider == "groq":
        api_key_name = "GROQ_API_KEY"
        api_key = source.get(api_key_name, "").strip()
        base_url = source.get("GROQ_BASE_URL", GROQ_BASE_URL).strip()
        model = (
            source.get("CHAT_MODEL", "").strip()
            or source.get("GROQ_MODEL", "").strip()
            or GROQ_DEFAULT_MODEL
        )
    elif provider == "minimax":
        api_key_name = "MINIMAX_API_KEY"
        api_key = source.get(api_key_name, "").strip()
        base_url = source.get("MINIMAX_BASE_URL", MINIMAX_BASE_URL).strip()
        model = (
            source.get("CHAT_MODEL", "").strip()
            or source.get("MINIMAX_MODEL", "").strip()
            or MINIMAX_DEFAULT_MODEL
        )
    else:
        raise ChatConfigurationError(
            "Unsupported CHAT_PROVIDER. Use 'groq' or 'minimax'."
        )

    if not api_key:
        raise ChatConfigurationError(f"{api_key_name} is not configured")
    if not base_url:
        raise ChatConfigurationError(f"Base URL for {provider} is empty")
    if not model:
        raise ChatConfigurationError(f"Model for {provider} is empty")

    return ChatSettings(
        provider=provider,
        api_key=api_key,
        base_url=base_url,
        model=model,
        temperature=_read_float(source, "CHAT_TEMPERATURE", "0.2"),
        timeout=_read_float(source, "CHAT_TIMEOUT_SECONDS", "30"),
        max_retries=_read_int(source, "CHAT_MAX_RETRIES", "1"),
    )

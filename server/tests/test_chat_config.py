import unittest

from server.chat_config import (
    GROQ_BASE_URL,
    GROQ_DEFAULT_MODEL,
    MINIMAX_BASE_URL,
    ChatConfigurationError,
    load_chat_settings,
)


class ChatConfigTests(unittest.TestCase):
    def test_prefers_groq_when_both_providers_are_configured(self):
        settings = load_chat_settings(
            {
                "GROQ_API_KEY": "gsk-test",
                "MINIMAX_API_KEY": "minimax-test",
            }
        )

        self.assertEqual(settings.provider, "groq")
        self.assertEqual(settings.api_key, "gsk-test")
        self.assertEqual(settings.base_url, GROQ_BASE_URL)
        self.assertEqual(settings.model, GROQ_DEFAULT_MODEL)

    def test_keeps_minimax_available_for_legacy_configuration(self):
        settings = load_chat_settings({"MINIMAX_API_KEY": "minimax-test"})

        self.assertEqual(settings.provider, "minimax")
        self.assertEqual(settings.base_url, MINIMAX_BASE_URL)

    def test_explicit_provider_requires_its_own_key(self):
        with self.assertRaisesRegex(ChatConfigurationError, "GROQ_API_KEY"):
            load_chat_settings({"CHAT_PROVIDER": "groq"})

    def test_rejects_unknown_provider(self):
        with self.assertRaisesRegex(ChatConfigurationError, "Unsupported CHAT_PROVIDER"):
            load_chat_settings(
                {"CHAT_PROVIDER": "unknown", "GROQ_API_KEY": "gsk-test"}
            )

    def test_allows_provider_specific_model_and_timeout(self):
        settings = load_chat_settings(
            {
                "CHAT_PROVIDER": "groq",
                "GROQ_API_KEY": "gsk-test",
                "GROQ_MODEL": "llama-3.1-8b-instant",
                "CHAT_TIMEOUT_SECONDS": "12.5",
                "CHAT_MAX_RETRIES": "0",
            }
        )

        self.assertEqual(settings.model, "llama-3.1-8b-instant")
        self.assertEqual(settings.timeout, 12.5)
        self.assertEqual(settings.max_retries, 0)


if __name__ == "__main__":
    unittest.main()

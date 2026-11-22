from typing import Protocol, AsyncIterator, Optional


class SpeechToText(Protocol):
    """Protocol for streaming speech-to-text service."""
    async def transcribe_stream(self, audio_chunks: AsyncIterator[bytes], language: str) -> AsyncIterator[str]:
        ...

    async def transcribe_chunk(self, audio_chunk: bytes, language: str) -> str:
        ...


class Translator(Protocol):
    """Protocol for cross-lingual text translation (e.g. Malayalam <-> Tamil)."""
    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        ...


class TextToSpeech(Protocol):
    """Protocol for target-language synthesized speech generation."""
    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: Optional[str] = None,
    ) -> bytes:
        ...


class VoiceProfileProvider(Protocol):
    """Protocol for voice sample enrollment and cloned voice profile management."""
    async def create_voice_profile(self, user_id: str, audio_sample: bytes) -> str:
        ...

    async def delete_voice_profile(self, provider_voice_id: str) -> bool:
        ...

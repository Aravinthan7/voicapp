import asyncio
from typing import AsyncIterator, Optional


class SimulatedSpeechToText:
    """Simulated streaming speech recognizer for Malayalam and Tamil."""

    async def transcribe_stream(self, audio_chunks: AsyncIterator[bytes], language: str) -> AsyncIterator[str]:
        async for _ in audio_chunks:
            await asyncio.sleep(0.1)
            yield "നമസ്കാരം, സുഖമാണോ?" if language == "ml-IN" else "வணக்கம், எப்படி இருக்கிறீர்கள்?"

    async def transcribe_chunk(self, audio_chunk: bytes, language: str) -> str:
        await asyncio.sleep(0.15)
        return "സുഖമായിരിക്കുന്നു, നന്ദി." if language == "ml-IN" else "நன்றாக இருக்கிறேன், நன்றி."


class SimulatedTranslator:
    """Simulated bidirectional translator for Malayalam <-> Tamil."""

    DICTIONARY_ML_TO_TA = {
        "നമസ്കാരം": "வணக்கம்",
        "സുഖമാണോ?": "எப்படி இருக்கிறீர்கள்?",
        "എന്റെ പേര് രാഹുൽ": "என் பெயர் ராகுல்",
        "ശരി": "சரி",
        "നന്ദി": "நன்றி",
        "വിട": "போய் வருகிறேன்",
    }

    DICTIONARY_TA_TO_ML = {
        "வணக்கம்": "നമസ്കാരം",
        "எப்படி இருக்கிறீர்கள்?": "സുഖമാണോ?",
        "என் பெயர் கார்த்திக்": "എന്റെ പേര് കാർത്തിക്",
        "சரி": "ശരി",
        "நன்றி": "നന്ദി",
        "போய் வருகிறேன்": "വിട",
    }

    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        await asyncio.sleep(0.12)
        clean = text.strip()

        if source_language.startswith("ml") and target_language.startswith("ta"):
            for k, v in self.DICTIONARY_ML_TO_TA.items():
                if k in clean:
                    clean = clean.replace(k, v)
            return clean if clean != text.strip() else f"மொழிபெயர்ப்பு: {text}"

        elif source_language.startswith("ta") and target_language.startswith("ml"):
            for k, v in self.DICTIONARY_TA_TO_ML.items():
                if k in clean:
                    clean = clean.replace(k, v)
            return clean if clean != text.strip() else f"വിവർത്തനം: {text}"

        return text


class SimulatedTextToSpeech:
    """Simulated speech synthesis returning simulated audio payload."""

    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: Optional[str] = None,
    ) -> bytes:
        await asyncio.sleep(0.18)
        # Return dummy audio buffer (e.g. WAV header or placeholder bytes)
        return b"RIFFsimulated_audio_bytes_wav_format"


class SimulatedVoiceProfileProvider:
    """Simulated speaker voice cloning provider."""

    async def create_voice_profile(self, user_id: str, audio_sample: bytes) -> str:
        await asyncio.sleep(0.3)
        return f"voice_clone_{user_id[:8]}"

    async def delete_voice_profile(self, provider_voice_id: str) -> bool:
        await asyncio.sleep(0.1)
        return True

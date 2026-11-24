import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioOutputMode } from '../types';

interface UseSpeechSynthesisProps {
  outputMode: AudioOutputMode;
  onDuckingChange?: (isDucked: boolean) => void;
}

interface SpeechQueueItem {
  id: string;
  text: string;
  language: string;
}

export const useSpeechSynthesis = ({
  outputMode,
  onDuckingChange,
}: UseSpeechSynthesisProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const onDuckingChangeRef = useRef(onDuckingChange);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const queueRef = useRef<SpeechQueueItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const recentSpokenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onDuckingChangeRef.current = onDuckingChange;
  }, [onDuckingChange]);

  // Load available system voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const resolveVoice = (lang: string): SpeechSynthesisVoice | null => {
    const voices =
      voicesRef.current.length > 0
        ? voicesRef.current
        : typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
    const cleanLang = lang.toLowerCase().replace('_', '-');
    const primary = cleanLang.split('-')[0];

    // 1. Exact match e.g. ta-IN or ml-IN
    let match = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === cleanLang);
    if (match) return match;

    // 2. Primary language match e.g. ta or ml
    match = voices.find((v) => v.lang.toLowerCase().startsWith(primary));
    if (match) return match;

    // 3. Fallback to default
    return voices.find((v) => v.default) || (voices[0] ?? null);
  };

  const processNext = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (queueRef.current.length === 0) {
      isProcessingRef.current = false;
      setIsSpeaking(false);
      onDuckingChangeRef.current?.(false);
      return;
    }

    const item = queueRef.current.shift()!;
    isProcessingRef.current = true;
    setIsSpeaking(true);

    // If outputMode is 'translated', duck or mute the original audio track so the translation is heard clearly
    if (outputMode === 'translated') {
      onDuckingChangeRef.current?.(true);
    }

    try {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = item.language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voice = resolveVoice(item.language);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        // Small pause between queue items for natural cadence
        setTimeout(() => {
          processNext();
        }, 120);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setTimeout(() => {
          processNext();
        }, 50);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak failed:', err);
      processNext();
    }
  }, [outputMode]);

  const speak = useCallback(
    (text: string, language: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const clean = text.trim();
      if (!clean) return;

      // In 'original' mode, receiver wants only the original peer audio without TTS
      if (outputMode === 'original') return;

      // Deduplicate immediate echoes within 2 seconds
      const dedupeKey = `${clean}_${language}`;
      if (recentSpokenRef.current.has(dedupeKey)) return;
      recentSpokenRef.current.add(dedupeKey);
      setTimeout(() => {
        recentSpokenRef.current.delete(dedupeKey);
      }, 3000);

      // Enqueue utterance to preserve full sentences without skipping or cutting off
      queueRef.current.push({
        id: `utt_${Date.now()}_${Math.random()}`,
        text: clean,
        language,
      });

      if (!isProcessingRef.current) {
        processNext();
      }
    },
    [outputMode, processNext]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isProcessingRef.current = false;
    setIsSpeaking(false);
    onDuckingChangeRef.current?.(false);
  }, []);

  useEffect(() => {
    return () => {
      queueRef.current = [];
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
  };
};

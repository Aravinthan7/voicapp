import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  language: string;
  enabled?: boolean;
  onFinalUtterance: (transcript: string) => void;
  onInterimUtterance?: (transcript: string) => void;
}

export const useSpeechRecognition = ({
  language,
  enabled = true,
  onFinalUtterance,
  onInterimUtterance,
}: UseSpeechRecognitionProps) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const onFinalUtteranceRef = useRef(onFinalUtterance);
  const onInterimUtteranceRef = useRef(onInterimUtterance);

  // Buffer to capture interim speech and prevent words being skipped on pauses
  const pendingInterimRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const recentDispatchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onFinalUtteranceRef.current = onFinalUtterance;
  }, [onFinalUtterance]);

  useEffect(() => {
    onInterimUtteranceRef.current = onInterimUtterance;
  }, [onInterimUtterance]);

  // Dispatch helper with deduplication
  const dispatchFinalUtterance = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;

    // Deduplicate identical submissions within 2.5 seconds
    const key = clean.toLowerCase();
    if (recentDispatchedRef.current.has(key)) return;
    recentDispatchedRef.current.add(key);
    setTimeout(() => {
      recentDispatchedRef.current.delete(key);
    }, 2500);

    pendingInterimRef.current = '';
    setInterimTranscript('');
    onFinalUtteranceRef.current(clean);
  }, []);

  // Map app language code to speech recognition BCP-47
  const resolveLangCode = useCallback((lang: string): string => {
    if (lang.startsWith('ta')) return 'ta-IN';
    if (lang.startsWith('ml')) return 'ml-IN';
    if (lang.startsWith('hi')) return 'hi-IN';
    if (lang.startsWith('en')) return 'en-IN';
    return lang;
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    if (recognitionRef.current && isListeningRef.current) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = resolveLangCode(language);
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimAccumulator = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0].transcript.trim();

          if (item.isFinal) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            dispatchFinalUtterance(transcript);
          } else {
            interimAccumulator += (interimAccumulator ? ' ' : '') + transcript;
          }
        }

        if (interimAccumulator) {
          pendingInterimRef.current = interimAccumulator;
          setInterimTranscript(interimAccumulator);
          onInterimUtteranceRef.current?.(interimAccumulator);

          // If speaker pauses for 1100ms without an isFinal event, flush interim buffer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (pendingInterimRef.current) {
              dispatchFinalUtterance(pendingInterimRef.current);
            }
          }, 1100);
        }
      };

      recognition.onerror = (event: any) => {
        // "no-speech" is normal during pauses; don't tear down
        if (event.error === 'not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Flush any lingering interim buffer so no words are skipped
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (pendingInterimRef.current) {
          dispatchFinalUtterance(pendingInterimRef.current);
        }

        // Seamless auto-restart if still active
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (isListeningRef.current) {
                try {
                  recognition.start();
                } catch {
                  isListeningRef.current = false;
                  setIsListening(false);
                }
              }
            }, 150);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [language, resolveLangCode, dispatchFinalUtterance]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (pendingInterimRef.current) {
      dispatchFinalUtterance(pendingInterimRef.current);
    }

    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, [dispatchFinalUtterance]);

  // Update language dynamically if speakingLanguage changes mid-call
  useEffect(() => {
    if (recognitionRef.current && isListeningRef.current) {
      stopListening();
      startListening();
    }
  }, [language, startListening, stopListening]);

  // Toggle listening with enabled prop (e.g. mute state)
  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  };
};

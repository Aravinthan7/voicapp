import { useState, useEffect, useRef, useCallback } from 'react';
import type { MicPermissionStatus } from '../components/call/MicPermissionGate';

export function useMediaDevices() {
  const [status, setStatus] = useState<MicPermissionStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setIsSpeaking(false);
  }, [stream]);

  const requestAudio = useCallback(async (): Promise<MediaStream | null> => {
    setStatus('prompting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unavailable');
      return null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono audio is sufficient for speech translation
        },
        video: false,
      });

      setStream(mediaStream);
      setStatus('granted');

      // Initialize audio level analyser
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        const source = ctx.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudio = () => {
          if (!analyserRef.current) return;
          if (ctx.state === 'suspended') {
            void ctx.resume();
          }
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale responsively for conversational speech levels
          const normalized = Math.min(avg / 35, 1);
          setAudioLevel(normalized);
          setIsSpeaking(normalized > 0.06);

          animationFrameRef.current = requestAnimationFrame(checkAudio);
        };

        checkAudio();
      } catch {
        // Analyser setup failure shouldn't fail audio capture
      }

      return mediaStream;
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setStatus('unavailable');
        } else {
          setStatus('denied');
        }
      } else {
        setStatus('denied');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    status,
    stream,
    audioLevel,
    isSpeaking,
    requestAudio,
    stopStream,
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PeerConnectionStatus } from '../components/call/ConnectionStatusBadge';

interface UseWebRTCOptions {
  isPolite: boolean;
  localStream: MediaStream | null;
  sendSignaling: (type: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => void;
  onRemoteStreamAvailable?: (stream: MediaStream) => void;
}

export function useWebRTC({
  isPolite,
  localStream,
  sendSignaling,
  onRemoteStreamAvailable,
}: UseWebRTCOptions) {
  const [connectionStatus, setConnectionStatus] = useState<PeerConnectionStatus>('connecting');
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(0);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState<boolean>(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const setupRemoteAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const norm = Math.min(avg / 100, 1);
        setRemoteAudioLevel(norm);
        setIsRemoteSpeaking(norm > 0.15);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      // Audio level setup should not break audio stream playback
    }
  }, []);

  const closeConnection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setConnectionStatus('disconnected');
    setRemoteAudioLevel(0);
    setIsRemoteSpeaking(false);
  }, []);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;

    // Perfect negotiation: onnegotiationneeded
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        if (pc.localDescription) {
          sendSignaling('offer', pc.localDescription);
        }
      } catch (err) {
        console.error('Error during offer creation:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // ICE Candidate emission
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendSignaling('ice-candidate', candidate);
      }
    };

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        onRemoteStreamAvailable?.(stream);
        setupRemoteAudioAnalyser(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setConnectionStatus('connected');
          break;
        case 'connecting':
          setConnectionStatus('connecting');
          break;
        case 'disconnected':
          setConnectionStatus('reconnecting');
          break;
        case 'failed':
          setConnectionStatus('failed');
          break;
        case 'closed':
          setConnectionStatus('disconnected');
          break;
      }
    };

    // Attach local audio tracks if already present
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    return () => {
      closeConnection();
    };
  }, [isPolite, localStream, sendSignaling, onRemoteStreamAvailable, setupRemoteAudioAnalyser, closeConnection]);

  // Handle incoming signaling message (Offer, Answer, ICE candidate)
  const handleSignalingData = useCallback(
    async (type: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (type === 'offer') {
          const offerDesc = payload as RTCSessionDescriptionInit;
          const readyForOffer =
            !makingOfferRef.current &&
            (pc.signalingState === 'stable' || isSettingRemoteAnswerPendingRef.current);
          const offerCollision = !readyForOffer;

          ignoreOfferRef.current = !isPolite && offerCollision;
          if (ignoreOfferRef.current) {
            return;
          }

          await pc.setRemoteDescription(offerDesc);
          await pc.setLocalDescription();
          if (pc.localDescription) {
            sendSignaling('answer', pc.localDescription);
          }
        } else if (type === 'answer') {
          const answerDesc = payload as RTCSessionDescriptionInit;
          isSettingRemoteAnswerPendingRef.current = true;
          await pc.setRemoteDescription(answerDesc);
          isSettingRemoteAnswerPendingRef.current = false;
        } else if (type === 'ice-candidate') {
          const candidateInit = payload as RTCIceCandidateInit;
          try {
            await pc.addIceCandidate(candidateInit);
          } catch (err) {
            if (!ignoreOfferRef.current) {
              console.warn('ICE candidate addition failed:', err);
            }
          }
        }
      } catch (err) {
        console.error('Signaling processing error:', err);
      }
    },
    [isPolite, sendSignaling]
  );

  return {
    connectionStatus,
    remoteAudioLevel,
    isRemoteSpeaking,
    handleSignalingData,
    closeConnection,
  };
}

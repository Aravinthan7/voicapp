import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VolumeX, Headphones, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { callService } from '../services/callService';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useCallSocket } from '../hooks/useCallSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { ParticipantTile } from '../components/call/ParticipantTile';
import { CallControls } from '../components/call/CallControls';
import { CaptionsPanel } from '../components/call/CaptionsPanel';
import { RoomInfo } from '../components/call/RoomInfo';
import { ConnectionStatusBadge } from '../components/call/ConnectionStatusBadge';
import { AudioSourceBadge } from '../components/call/AudioSourceBadge';
import { TranslationStatusIndicator } from '../components/call/TranslationStatusIndicator';
import { MicPermissionGate } from '../components/call/MicPermissionGate';
import { Button } from '../components/common/Button';
import { InlineAlert } from '../components/common/InlineAlert';
import { getErrorMessage } from '../utils/errors';
import type { CallRoom as CallRoomType, AudioOutputMode, TranslationState, CaptionItem, SignalingMessage } from '../types';

export const CallRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<CallRoomType | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio & Mic controls
  const [isMuted, setIsMuted] = useState(false);
  const [outputMode, setOutputMode] = useState<AudioOutputMode>('translated');
  const [remoteAudioBlocked, setRemoteAudioBlocked] = useState(false);

  // Peer & Translation state
  const [peerName, setPeerName] = useState<string>('Connecting Peer...');
  const [peerSpeakingLang, setPeerSpeakingLang] = useState<string>('ta-IN');
  const [peerListeningLang, setPeerListeningLang] = useState<string>('ml-IN');
  const [peerPresent, setPeerPresent] = useState(false);
  const [isPolite, setIsPolite] = useState(false);
  const [translationState, setTranslationState] = useState<TranslationState>('idle');
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [captionsOpen, setCaptionsOpen] = useState(true);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Media Devices hook
  const {
    status: micStatus,
    stream: localStream,
    audioLevel: localAudioLevel,
    isSpeaking: isLocalSpeaking,
    requestAudio,
    stopStream,
  } = useMediaDevices();

  // Load Room Details
  useEffect(() => {
    async function fetchRoom() {
      if (!roomId) return;
      try {
        const fetched = await callService.getRoom(roomId);
        setRoom(fetched);
        // The creator is polite peer, the joiner is impolite (or vice versa)
        if (user && fetched.createdBy === user.id) {
          setIsPolite(false);
        } else {
          setIsPolite(true);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoadingRoom(false);
      }
    }
    void fetchRoom();
  }, [roomId, user]);

  // Request Mic when entering room
  useEffect(() => {
    if (!loadingRoom && micStatus === 'idle') {
      void requestAudio();
    }
  }, [loadingRoom, micStatus, requestAudio]);

  const handleWebRTCSignalingRef = useRef<((type: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => Promise<void>) | null>(null);
  const handleLeaveCallRef = useRef<(() => void) | null>(null);

  // Handle remote audio stream attachment
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current
        .play()
        .then(() => setRemoteAudioBlocked(false))
        .catch(() => setRemoteAudioBlocked(true));
    }
  }, []);

  // WebSocket signaling
  const handleSignalingMessage = useCallback(
    (msg: SignalingMessage) => {
      switch (msg.type) {
        case 'peer-joined': {
          const payload = msg.payload as {
            displayName?: string;
            speakingLanguage?: string;
            listeningLanguage?: string;
          };
          setPeerPresent(true);
          if (payload.displayName) setPeerName(payload.displayName);
          if (payload.speakingLanguage) setPeerSpeakingLang(payload.speakingLanguage);
          if (payload.listeningLanguage) setPeerListeningLang(payload.listeningLanguage);
          break;
        }
        case 'peer-left':
          setPeerPresent(false);
          setPeerName('Peer left the room');
          break;
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          void handleWebRTCSignalingRef.current?.(msg.type, msg.payload);
          break;
        case 'translation-status': {
          const payload = msg.payload as { state?: TranslationState };
          if (payload.state) setTranslationState(payload.state);
          break;
        }
        case 'caption': {
          const cap = msg.payload as CaptionItem;
          setCaptions((prev) => {
            const index = prev.findIndex((c) => c.id === cap.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = cap;
              return updated;
            }
            return [...prev.slice(-20), cap]; // keep in-memory sliding window
          });
          break;
        }
        case 'end-call':
          handleLeaveCallRef.current?.();
          break;
        default:
          break;
      }
    },
    []
  );

  const { isConnected: isSocketConnected, sendMessage } = useCallSocket({
    roomId: roomId || '',
    onMessage: handleSignalingMessage,
  });

  // WebRTC hook
  const sendWebRTCSignaling = useCallback(
    (type: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => {
      sendMessage(type, payload);
    },
    [sendMessage]
  );

  const {
    connectionStatus,
    remoteAudioLevel,
    isRemoteSpeaking,
    handleSignalingData: handleWebRTCSignaling,
    closeConnection,
  } = useWebRTC({
    isPolite,
    localStream,
    sendSignaling: sendWebRTCSignaling,
    onRemoteStreamAvailable: handleRemoteStream,
  });

  useEffect(() => {
    handleWebRTCSignalingRef.current = handleWebRTCSignaling;
  }, [handleWebRTCSignaling]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (localStream) {
      const nextMuted = !isMuted;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
      sendMessage('mute-state', { isMuted: nextMuted });
    }
  };

  // Change Output Mode
  const handleChangeOutputMode = (mode: AudioOutputMode) => {
    setOutputMode(mode);
    sendMessage('output-mode', { mode });
  };

  // End / Leave Call
  const handleLeaveCall = useCallback(() => {
    closeConnection();
    stopStream();
    if (roomId) {
      void callService.endCall(roomId);
    }
    navigate('/');
  }, [closeConnection, stopStream, roomId, navigate]);

  useEffect(() => {
    handleLeaveCallRef.current = handleLeaveCall;
  }, [handleLeaveCall]);

  const unlockAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => setRemoteAudioBlocked(false))
        .catch(console.error);
    }
  };

  if (loadingRoom) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-ink-muted">
        Loading call room session...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-md mx-auto py-12 flex flex-col gap-4 text-center">
        <InlineAlert type="error" message={error || 'Room not found or expired.'} />
        <Button variant="secondary" onClick={() => navigate('/')} leadingIcon={<ArrowLeft className="size-4" />}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2 w-full max-w-5xl mx-auto">
      {/* Hidden HTML5 Audio Element for Remote Audio Transport */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Mic Permission Gate */}
      <MicPermissionGate
        status={micStatus}
        onRequestPermission={() => void requestAudio()}
        onContinueAnyway={() => {}}
      />

      {/* Autoplay Blocked Banner (Common in mobile/Safari) */}
      {remoteAudioBlocked && (
        <div className="p-3.5 rounded-2xl bg-brand-600 text-white flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <VolumeX className="size-5 shrink-0" />
            <span>Audio playback is paused by your browser. Tap here to hear the other person.</span>
          </div>
          <Button variant="secondary" size="sm" onClick={unlockAudio} className="text-black shrink-0">
            Enable Audio
          </Button>
        </div>
      )}

      {/* Top Bar: Room Info & Live Status Badges */}
      <div className="flex flex-col gap-3">
        <RoomInfo room={room} />

        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
          <div className="flex items-center gap-2.5">
            <ConnectionStatusBadge status={connectionStatus} />
            <AudioSourceBadge mode={outputMode} />
          </div>

          <div className="flex items-center gap-2">
            <TranslationStatusIndicator state={translationState} directionLabel="Translation" />
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-ink-muted">
              <Headphones className="size-3.5" />
              <span>Headphones recommended</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Participant Interactive Calling Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
        {/* Local Participant Tile */}
        <ParticipantTile
          name={user?.displayName || 'You'}
          isSelf
          speakingLanguage={user?.speakingLanguage || room.primaryLanguage}
          listeningLanguage={user?.listeningLanguage || room.secondaryLanguage}
          isMuted={isMuted}
          isSpeaking={isLocalSpeaking}
          audioLevel={localAudioLevel}
        />

        {/* Remote Participant Tile */}
        <ParticipantTile
          name={peerPresent ? peerName : 'Waiting for peer to join...'}
          isSelf={false}
          speakingLanguage={peerSpeakingLang}
          listeningLanguage={peerListeningLang}
          isMuted={false}
          isSpeaking={isRemoteSpeaking}
          audioLevel={remoteAudioLevel}
        />
      </div>

      {/* Live Captions Panel */}
      <CaptionsPanel
        captions={captions}
        isOpen={captionsOpen}
        onToggleOpen={() => setCaptionsOpen((prev) => !prev)}
        onClearCaptions={() => setCaptions([])}
      />

      {/* Bottom Floating Call Controls */}
      <div className="sticky bottom-4 z-30 flex justify-center w-full mt-2">
        <CallControls
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onEndCall={handleLeaveCall}
          outputMode={outputMode}
          onChangeOutputMode={handleChangeOutputMode}
          isCallActive={isSocketConnected}
        />
      </div>
    </div>
  );
};

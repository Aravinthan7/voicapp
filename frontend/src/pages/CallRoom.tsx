import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VolumeX, Headphones, ArrowLeft, Send, Sparkles, Mic, Languages } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { callService } from '../services/callService';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useCallSocket } from '../hooks/useCallSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
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

  // Local participant interactive language preferences (allows changing mid-call)
  const [mySpeakingLang, setMySpeakingLang] = useState<string>(
    user?.speakingLanguage || 'en-IN'
  );
  const [myListeningLang, setMyListeningLang] = useState<string>(
    user?.listeningLanguage || 'ta-IN'
  );

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
        if (user) {
          if (user.speakingLanguage) setMySpeakingLang(user.speakingLanguage);
          if (user.listeningLanguage) setMyListeningLang(user.listeningLanguage);
        } else {
          setMySpeakingLang(fetched.primaryLanguage || 'en-IN');
          setMyListeningLang(fetched.secondaryLanguage || 'ta-IN');
        }
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
  const initiateOfferRef = useRef<(() => Promise<void>) | null>(null);

  // Audio ducking for speech synthesis
  const handleDuckingChange = useCallback((isDucked: boolean) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isDucked ? 0.15 : 1.0;
    }
  }, []);

  const { speak } = useSpeechSynthesis({
    outputMode,
    onDuckingChange: handleDuckingChange,
  });

  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

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

          // Both users are present - trigger WebRTC offer negotiation
          void initiateOfferRef.current?.();
          break;
        }
        case 'peer-language-updated': {
          const payload = msg.payload as {
            speakingLanguage?: string;
            listeningLanguage?: string;
          };
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
          const cap = msg.payload as CaptionItem & { isSelf?: boolean };
          setCaptions((prev) => {
            const index = prev.findIndex((c) => c.id === cap.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = cap;
              return updated;
            }
            return [...prev.slice(-20), cap]; // keep in-memory sliding window
          });

          // Receiver speaks the translated text out loud unless this is our own echo
          if (!cap.isSelf && cap.translatedText) {
            speakRef.current?.(cap.translatedText, myListeningLang);
          }
          break;
        }
        case 'end-call':
          handleLeaveCallRef.current?.();
          break;
        default:
          break;
      }
    },
    [myListeningLang]
  );

  const { isConnected: isSocketConnected, sendMessage } = useCallSocket({
    roomId: roomId || '',
    onMessage: handleSignalingMessage,
  });

  // Speech Recognition hook - continuous voice transcription in speaking language
  const handleFinalSpeechUtterance = useCallback(
    (transcript: string) => {
      if (!transcript.trim()) return;
      sendMessage('speech-utterance', {
        text: transcript,
        speakingLanguage: mySpeakingLang,
        targetLanguage: peerListeningLang,
      });
      setTranslationState('translating');
    },
    [sendMessage, mySpeakingLang, peerListeningLang]
  );

  const {
    isSupported: isSpeechRecSupported,
    interimTranscript,
  } = useSpeechRecognition({
    language: mySpeakingLang,
    enabled: micStatus === 'granted' && !isMuted && isSocketConnected,
    onFinalUtterance: handleFinalSpeechUtterance,
  });

  // Quick utterance input state
  const [manualText, setManualText] = useState('');

  const handleSendUtterance = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : manualText).trim();
    if (!text) return;
    sendMessage('speech-utterance', {
      text,
      speakingLanguage: mySpeakingLang,
      targetLanguage: peerListeningLang,
    });
    setTranslationState('translating');
    setManualText('');
  };

  const handleChangeSpeakingLang = (lang: string) => {
    setMySpeakingLang(lang);
    sendMessage('language-update', { speakingLanguage: lang });
  };

  const handleChangeListeningLang = (lang: string) => {
    setMyListeningLang(lang);
    sendMessage('language-update', { listeningLanguage: lang });
  };

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
    initiateOffer,
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

  useEffect(() => {
    initiateOfferRef.current = initiateOffer;
  }, [initiateOffer]);

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

      {/* In-Call Active Language Selectors (Allows changing languages mid-call) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-card border border-border-subtle text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-brand-400" />
          <span className="font-semibold text-ink-primary">Live Call Languages:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Speaking Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">You Speak:</span>
            <select
              value={mySpeakingLang}
              onChange={(e) => handleChangeSpeakingLang(e.target.value)}
              className="bg-surface-elevated border border-border-subtle rounded-lg px-2.5 py-1 text-xs text-ink-primary font-medium focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="en-IN">English (English)</option>
              <option value="ta-IN">தமிழ் (Tamil)</option>
              <option value="ml-IN">മലയാളം (Malayalam)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Listening Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">You Hear Translated To:</span>
            <select
              value={myListeningLang}
              onChange={(e) => handleChangeListeningLang(e.target.value)}
              className="bg-surface-elevated border border-border-subtle rounded-lg px-2.5 py-1 text-xs text-ink-primary font-medium focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ta-IN">தமிழ் (Tamil)</option>
              <option value="ml-IN">മലയാളം (Malayalam)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
              <option value="en-IN">English (English)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two-Participant Interactive Calling Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-1">
        {/* Local Participant Tile */}
        <ParticipantTile
          name={user?.displayName || 'You'}
          isSelf
          speakingLanguage={mySpeakingLang}
          listeningLanguage={myListeningLang}
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

      {/* Live Speech Recognition Feedback (Active speaking transcript preview) */}
      {interimTranscript && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 animate-pulse">
          <Mic className="size-3.5 text-brand-400 shrink-0 animate-bounce" />
          <span className="font-semibold text-brand-200">Listening to you:</span>
          <span className="italic truncate">"{interimTranscript}"</span>
        </div>
      )}

      {/* Browser Speech Recognition Warning (if not supported on that browser/platform) */}
      {!isSpeechRecSupported && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <span>Your browser does not support Web Speech Recognition (supported on Chrome, Edge, Safari, Android Chrome). You can use the Quick Utterance bar below to test live translation!</span>
        </div>
      )}

      {/* Quick Utterance & Manual Translation Test Bar */}
      <div className="p-3.5 rounded-2xl bg-surface-card border border-border-subtle flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-primary">
            <Sparkles className="size-3.5 text-brand-400" />
            <span>Test Speech &amp; Live Translation</span>
            <span className="text-[11px] text-ink-muted">(Speech / Quick Phrases / Custom Text)</span>
          </div>
          <span className="text-[11px] text-brand-300 font-medium">
            Speaking in {mySpeakingLang} &rarr; Translating to {peerListeningLang}
          </span>
        </div>

        {/* Quick Phrase Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: '👋 Hello, how are you?', text: 'Hello, how are you?' },
            { label: '🌅 Good morning', text: 'Good morning' },
            { label: '🙏 Thank you', text: 'Thank you very much' },
            { label: '❓ Can you hear me?', text: 'Can you hear me clearly?' },
            { label: 'മലയാളം: നമസ്കാരം', text: 'നമസ്കാരം, സുഖമാണോ?' },
            { label: 'தமிழ்: வணக்கம்', text: 'வணக்கம், எப்படி இருக்கிறீர்கள்?' },
            { label: 'हिन्दी: नमस्ते', text: 'नमस्ते, आप कैसे हैं?' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendUtterance(item.text)}
              className="px-2.5 py-1 rounded-lg text-xs bg-surface-elevated hover:bg-brand-500/20 hover:text-brand-300 border border-border-subtle transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Text Utterance Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendUtterance();
          }}
          className="flex items-center gap-2 mt-1"
        >
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Type any sentence to translate and speak to peer..."
            className="flex-1 bg-surface-elevated/70 border border-border-subtle rounded-xl px-3.5 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-hidden focus:ring-1 focus:ring-brand-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!manualText.trim()}
            leadingIcon={<Send className="size-3.5" />}
          >
            Send &amp; Speak
          </Button>
        </form>
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

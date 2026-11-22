import { useEffect, useRef, useState, useCallback } from 'react';
import type { SignalingMessage } from '../types';

interface UseCallSocketOptions {
  roomId: string;
  token?: string;
  onMessage?: (message: SignalingMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useCallSocket({
  roomId,
  token,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseCallSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(1);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const sendMessage = useCallback((type: SignalingMessage['type'], payload: unknown = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const envelope: SignalingMessage = {
        type,
        payload,
        seq: seqRef.current++,
      };
      socketRef.current.send(JSON.stringify(envelope));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_BASE_URL || `${wsProtocol}//${window.location.hostname}:8000/api/v1`;
    const authToken = token || localStorage.getItem('voiceapp_token') || 'guest';
    const wsUrl = `${wsHost}/ws/calls/${roomId}?token=${encodeURIComponent(authToken)}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;
    } catch (e) {
      console.error('Failed to construct WebSocket:', e);
      return;
    }

    ws.onopen = () => {
      setIsConnected(true);
      onOpen?.();
      sendMessage('join', { roomId });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as SignalingMessage;
        onMessageRef.current?.(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      onClose?.();
    };

    ws.onerror = (err) => {
      console.error('WebSocket encountered error:', err);
      onError?.(err);
    };

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendMessage('ping', { time: Date.now() });
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [roomId, token, onOpen, onClose, onError, sendMessage]);

  return {
    isConnected,
    sendMessage,
  };
}

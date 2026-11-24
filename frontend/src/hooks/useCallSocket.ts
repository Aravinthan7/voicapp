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
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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
    const defaultHost =
      window.location.protocol === 'https:'
        ? `${wsProtocol}//${window.location.host}/api/v1`
        : `${wsProtocol}//${window.location.hostname}:8000/api/v1`;
    const wsHost = import.meta.env.VITE_WS_BASE_URL || defaultHost;
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
      onOpenRef.current?.();
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

    ws.onclose = (event) => {
      setIsConnected(false);
      onCloseRef.current?.();
      if (event.code === 1008) {
        console.warn('Call room is full (maximum 2 participants).');
      }
    };

    ws.onerror = (err) => {
      // Ignore if socket was aborted on component unmount
      if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
        return;
      }
      onErrorRef.current?.(err);
    };

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendMessage('ping', { time: Date.now() });
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      // Detach listeners so unmount doesn't emit false error events
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Component unmounted');
      }
      socketRef.current = null;
    };
  }, [roomId, token, sendMessage]);

  return {
    isConnected,
    sendMessage,
  };
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken, subscribeToAccessToken } from '@/lib/auth/token-store';

export type RealtimeConnectionState = 'connecting' | 'connected' | 'disconnected';

type RealtimeHandler = (...args: unknown[]) => void;

interface RealtimeContextType {
  connectionState: RealtimeConnectionState;
  emit: (event: string, payload: unknown) => void;
  on: (event: string, handler: RealtimeHandler) => () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const token = useSyncExternalStore(subscribeToAccessToken, getAccessToken, () => null);
  const isAuthenticated = Boolean(token);

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const joinedConversationsRef = useRef<Set<string>>(new Set());
  const listenersRef = useRef<Map<string, Set<RealtimeHandler>>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      joinedConversationsRef.current.clear();
      return;
    }

    const socket = io({
      forceNew: true,
      auth: (callback) => callback({ token: getAccessToken() ?? '' }),
    });
    socketRef.current = socket;

    for (const [event, handlers] of listenersRef.current) {
      for (const handler of handlers) {
        socket.on(event, handler);
      }
    }

    let serverDisconnectAttempts = 0;
    let serverDisconnectRetryTimeout: ReturnType<typeof setTimeout> | undefined;

    socket.on('connect', () => {
      serverDisconnectAttempts = 0;
      setConnected(true);
      for (const conversationId of joinedConversationsRef.current) {
        socket.emit('joinConversation', { conversationId });
      }
    });
    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        const delay = Math.min(1000 * 2 ** serverDisconnectAttempts, 5000);
        serverDisconnectAttempts += 1;
        serverDisconnectRetryTimeout = setTimeout(() => socket.connect(), delay);
      }
    });

    return () => {
      clearTimeout(serverDisconnectRetryTimeout);
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated]);

  const emit = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    joinedConversationsRef.current.add(conversationId);
    socketRef.current?.emit('joinConversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    joinedConversationsRef.current.delete(conversationId);
  }, []);

  const on = useCallback((event: string, handler: RealtimeHandler) => {
    let handlers = listenersRef.current.get(event);
    if (!handlers) {
      handlers = new Set();
      listenersRef.current.set(event, handlers);
    }
    handlers.add(handler);
    socketRef.current?.on(event, handler);

    return () => {
      listenersRef.current.get(event)?.delete(handler);
      socketRef.current?.off(event, handler);
    };
  }, []);

  const connectionState: RealtimeConnectionState = !token
    ? 'disconnected'
    : connected
      ? 'connected'
      : 'connecting';

  const contextValue = useMemo(
    () => ({ connectionState, emit, on, joinConversation, leaveConversation }),
    [connectionState, emit, on, joinConversation, leaveConversation],
  );

  return <RealtimeContext.Provider value={contextValue}>{children}</RealtimeContext.Provider>;
};

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken, subscribeToAccessToken } from '@/lib/auth/token-store';

export type RealtimeConnectionState = 'connecting' | 'connected' | 'disconnected';

interface RealtimeContextType {
  connectionState: RealtimeConnectionState;
  emit: (event: string, payload: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  joinConversation: (conversationId: string) => void;
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
  // Token lives outside React state (see token-store.ts); useSyncExternalStore
  // re-renders this provider whenever login/logout changes it.
  const token = useSyncExternalStore(subscribeToAccessToken, getAccessToken, () => null);

  // The socket itself is never read during render (only inside effects/
  // callbacks below), so a ref is safe here and avoids re-rendering on
  // every socket.io internal event.
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Conversation rooms the app has asked to join. Re-emitted on every
  // "connect" (the initial one and every reconnect after a drop), since the
  // server doesn't remember room membership across a dropped connection.
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      for (const conversationId of joinedConversationsRef.current) {
        socket.emit('joinConversation', { conversationId });
      }
    });
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const emit = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    joinedConversationsRef.current.add(conversationId);
    socketRef.current?.emit('joinConversation', { conversationId });
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const connectionState: RealtimeConnectionState = !token
    ? 'disconnected'
    : connected
      ? 'connected'
      : 'connecting';

  return (
    <RealtimeContext.Provider value={{ connectionState, emit, on, joinConversation }}>
      {children}
    </RealtimeContext.Provider>
  );
};

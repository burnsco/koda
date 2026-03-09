import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatEvent, ChatMessage } from "../types";

type UseRoomChatOptions = {
  activeRoomId: string;
  buildWsUrl: (pathname: string, params: Record<string, string>) => string;
  hydrated: boolean;
  httpBase: string;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  onSessionInvalid: () => void;
  onStatusNote: (note: string) => void;
  sessionToken: string;
  userId: string;
};

export function useRoomChat({
  activeRoomId,
  buildWsUrl,
  hydrated,
  httpBase,
  isAuthenticated,
  onAuthRequired,
  onSessionInvalid,
  onStatusNote,
  sessionToken,
  userId,
}: UseRoomChatOptions) {
  const chatSocketRef = useRef<WebSocket | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [chatSocketState, setChatSocketState] = useState("disconnected");

  const probeSessionToken = useCallback(async (): Promise<"valid" | "invalid" | "unreachable"> => {
    if (!sessionToken) {
      return "invalid";
    }

    try {
      const response = await fetch(`${httpBase}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          room_id: "",
          body: "",
        }),
      });

      if (response.status === 401) {
        return "invalid";
      }

      return "valid";
    } catch {
      return "unreachable";
    }
  }, [httpBase, sessionToken]);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();

    fetch(`${httpBase}/api/messages?room_id=${encodeURIComponent(activeRoomId)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: ChatMessage[]) => setMessages(payload))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMessages([]);
      });

    return () => {
      controller.abort();
    };
  }, [activeRoomId, httpBase]);

  useEffect(() => {
    if (!activeRoomId || !hydrated || !isAuthenticated || !userId || !sessionToken) {
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }

      setChatSocketState(hydrated && !isAuthenticated ? "login required" : "disconnected");
      return;
    }

    let socket: WebSocket | null = null;
    let cancelled = false;
    let reconnectTimer: number | null = null;
    let reconnectAttempt = 0;

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer !== null) {
        return;
      }

      const delayMs = Math.min(1000 * 2 ** reconnectAttempt, 5000);
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delayMs);
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      const currentSocket = new WebSocket(
        buildWsUrl("/ws/chat", {
          room_id: activeRoomId,
          token: sessionToken,
        }),
      );
      socket = currentSocket;
      let opened = false;

      currentSocket.onopen = () => {
        opened = true;
        reconnectAttempt = 0;
        setChatSocketState("connected");
      };

      currentSocket.onerror = () => {
        if (!opened) {
          setChatSocketState("error");
        }
      };

      currentSocket.onclose = () => {
        if (chatSocketRef.current === currentSocket) {
          chatSocketRef.current = null;
        }

        if (cancelled) {
          return;
        }

        if (opened) {
          setChatSocketState("disconnected");
          scheduleReconnect();
          return;
        }

        setChatSocketState("error");
        void probeSessionToken().then((status) => {
          if (cancelled) {
            return;
          }

          if (status === "invalid") {
            onSessionInvalid();
            setChatSocketState("login required");
            return;
          }

          scheduleReconnect();
        });
      };

      currentSocket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ChatEvent;
          if (payload.type !== "chat.message") {
            return;
          }

          if (payload.message.room_id !== activeRoomId) {
            return;
          }

          setMessages((currentMessages) => [...currentMessages, payload.message]);
        } catch {
          // Ignore malformed payloads.
        }
      };

      chatSocketRef.current = currentSocket;
    };

    setChatSocketState("connecting");
    connect();

    return () => {
      cancelled = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }

      if (chatSocketRef.current === socket) {
        chatSocketRef.current = null;
      }
    };
  }, [
    activeRoomId,
    buildWsUrl,
    hydrated,
    isAuthenticated,
    onSessionInvalid,
    probeSessionToken,
    sessionToken,
    userId,
  ]);

  const submitMessage = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      if (!activeRoomId) {
        onStatusNote("Pick a room to chat.");
        return;
      }

      if (!isAuthenticated) {
        onStatusNote("Sign in to chat.");
        onAuthRequired();
        return;
      }

      const text = draft.trim();
      if (!text) {
        return;
      }

      const socket = chatSocketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(text);
        setDraft("");
        return;
      }

      fetch(`${httpBase}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          room_id: activeRoomId,
          body: text,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("failed to send chat message");
          }

          const payload = (await response.json()) as ChatEvent;
          if (payload.type === "chat.message") {
            setMessages((currentMessages) => [...currentMessages, payload.message]);
          }
          setDraft("");
        })
        .catch(() => {
          onStatusNote("Could not send message.");
        });
    },
    [activeRoomId, draft, httpBase, isAuthenticated, onAuthRequired, onStatusNote, sessionToken],
  );

  return {
    chatSocketState,
    draft,
    messages,
    setDraft,
    submitMessage,
  };
}

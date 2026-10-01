"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface NotificationItem {
  id: string;
  timestamp: number;
  type: "info" | "emergency" | "ambulance" | "hospital" | "document" | "ai" | "alert";
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
}

let socketRef: Socket | null = null;

function getSocket(): Socket {
  if (socketRef && socketRef.connected) return socketRef;
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
  socketRef = io("/?XTransformPort=3003", {
    transports: ["websocket", "polling"],
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    timeout: 10000,
  });
  return socketRef;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit("notify:join");
    };
    const onDisconnect = () => setConnected(false);
    const onNotif = (n: NotificationItem) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("notify:new", onNotif);

    // If the socket is already connected (singleton reuse), join the
    // notifications room immediately. The connect handler above will also
    // join, but doing both is harmless.
    if (socket.connected) {
      socket.emit("notify:join");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("notify:new", onNotif);
    };
  }, []);

  const send = useCallback((n: Omit<NotificationItem, "id" | "timestamp">) => {
    const socket = getSocket();
    socket.emit("notify:send", n);
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  return { notifications, connected, send, clear };
}

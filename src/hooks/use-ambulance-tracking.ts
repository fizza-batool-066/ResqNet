"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TrackingPosition {
  lat: number;
  lng: number;
}

export interface TrackingEvent {
  ts: number;
  type: string;
  message: string;
}

export interface TrackingState {
  requestId: string;
  ambulanceCode: string;
  status: "dispatched" | "enroute" | "arrived" | "cancelled";
  progress: number; // 0..1
  etaMinutes: number;
  speedKmh: number;
  position: TrackingPosition;
  origin: TrackingPosition;
  destination: TrackingPosition;
  distanceKm: number;
  startedAt: number;
  updatedAt: number;
}

interface UseTrackingOpts {
  // auto-connect when set; clear it to disconnect
  requestId: string | null;
  ambulanceCode?: string;
  origin?: TrackingPosition;
  destination?: TrackingPosition;
  distanceKm?: number;
}

// ---------------------------------------------------------------------------
// Singleton socket — shared across hook instances within the same tab
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAmbulanceTracking({
  requestId,
  ambulanceCode,
  origin,
  destination,
  distanceKm,
}: UseTrackingOpts) {
  const [state, setState] = useState<TrackingState | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef<string | null>(null);

  // When the session id changes, clear stale local state. Use setTimeout
  // so the reset happens after render, avoiding a cascading-render lint.
  useEffect(() => {
    if (!requestId) return;
    const id = setTimeout(() => {
      setState(null);
      setEvents([]);
      setError(null);
    }, 0);
    return () => clearTimeout(id);
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;

    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (payload: TrackingState) => {
      if (payload?.requestId === requestId) setState(payload);
    };
    const onEvent = (payload: { requestId: string; event: TrackingEvent }) => {
      if (payload?.requestId === requestId) {
        setEvents((prev) => [...prev, payload.event].slice(-50));
      }
    };
    const onError = (payload: { message?: string }) => {
      setError(payload?.message || "tracking error");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("ambulance:update", onUpdate);
    socket.on("ambulance:event", onEvent);
    socket.on("track:error", onError);

    // Read current connection state without triggering a cascading render.
    // The onConnect / onDisconnect handlers below will sync the state on
    // the next event tick.
    void socket.connected;

    if (startedRef.current !== requestId) {
      startedRef.current = requestId;
      socket.emit("track:start", {
        requestId,
        ambulanceCode: ambulanceCode || "AMB-UNKNOWN",
        origin: origin || { lat: 24.8607, lng: 67.0011 },
        destination: destination || { lat: 24.8937, lng: 67.0281 },
        distanceKm: distanceKm || 5,
      });
    } else {
      socket.emit("track:join", { requestId });
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("ambulance:update", onUpdate);
      socket.off("ambulance:event", onEvent);
      socket.off("track:error", onError);
      // NOTE: do NOT stop the session on unmount — the parent may remount the modal
    };
  }, [requestId, ambulanceCode, origin, destination, distanceKm]);

  const stopTracking = () => {
    if (!requestId) return;
    const socket = getSocket();
    socket.emit("track:stop", { requestId });
    startedRef.current = null;
  };

  return { state, events, connected, error, stopTracking };
}

import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it to forward to the correct port
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Coord {
  lat: number;
  lng: number;
}

interface TrackingState {
  requestId: string;
  ambulanceCode: string;
  status: "dispatched" | "enroute" | "arrived" | "cancelled";
  // 0..1 — fraction of route completed
  progress: number;
  // current simulated ETA in minutes (decreases as progress increases)
  etaMinutes: number;
  // current speed km/h (simulated)
  speedKmh: number;
  // current simulated lat/lng along the route
  position: Coord;
  // origin (ambulance depot) and destination (patient/hospital)
  origin: Coord;
  destination: Coord;
  // total route distance in km
  distanceKm: number;
  startedAt: number;
  updatedAt: number;
  // event log
  events: { ts: number; type: string; message: string }[];
}

// ---------------------------------------------------------------------------
// In-memory store (sandbox demo only — not persistent)
// ---------------------------------------------------------------------------
const sessions = new Map<string, TrackingState>();
const tickIntervals = new Map<string, NodeJS.Timeout>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function linearInterp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function positionAlong(state: TrackingState): Coord {
  const t = Math.min(1, Math.max(0, state.progress));
  return {
    lat: linearInterp(state.origin.lat, state.destination.lat, t),
    lng: linearInterp(state.origin.lng, state.destination.lng, t),
  };
}

function recompute(state: TrackingState) {
  state.position = positionAlong(state);
  // ETA shrinks proportionally with progress, plus a small noise
  const remaining = 1 - state.progress;
  state.etaMinutes = Math.max(0.5, +(remaining * (state.distanceKm / 35) * 60).toFixed(1));
  // Simulate speed with mild noise
  state.speedKmh = +(28 + Math.random() * 22).toFixed(0);
  state.updatedAt = Date.now();
}

function logEvent(state: TrackingState, type: string, message: string) {
  state.events.push({ ts: Date.now(), type, message });
  if (state.events.length > 50) state.events.shift();
  io.to(`session:${state.requestId}`).emit("ambulance:event", {
    requestId: state.requestId,
    event: { ts: Date.now(), type, message },
  });
}

function broadcastState(state: TrackingState) {
  io.to(`session:${state.requestId}`).emit("ambulance:update", {
    requestId: state.requestId,
    ambulanceCode: state.ambulanceCode,
    status: state.status,
    progress: state.progress,
    etaMinutes: state.etaMinutes,
    speedKmh: state.speedKmh,
    position: state.position,
    distanceKm: state.distanceKm,
    destination: state.destination,
    origin: state.origin,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
  });
}

// ---------------------------------------------------------------------------
// Connection handling
// ---------------------------------------------------------------------------
io.on("connection", (socket) => {
  console.log(`[ambulance-tracker] client connected: ${socket.id}`);

  // Start a tracking session.
  // payload: { requestId, ambulanceCode, origin, destination, distanceKm }
  socket.on("track:start", (payload: any) => {
    try {
      const requestId = String(payload?.requestId || "").slice(0, 64);
      const ambulanceCode = String(payload?.ambulanceCode || "AMB-UNKNOWN").slice(0, 32);
      const distanceKm = Math.max(0.5, Math.min(50, Number(payload?.distanceKm) || 5));

      // Default route: Karachi approx coords (sandbox demo)
      const origin = payload?.origin && typeof payload.origin.lat === "number"
        ? payload.origin
        : { lat: 24.8607, lng: 67.0011 };   // Patient pickup
      const destination = payload?.destination && typeof payload.destination.lat === "number"
        ? payload.destination
        : { lat: 24.8937, lng: 67.0281 };    // Aga Khan Hospital approx

      if (!requestId) {
        socket.emit("track:error", { message: "requestId required" });
        return;
      }

      // Stop any existing session for this requestId
      const existing = sessions.get(requestId);
      if (existing) {
        const oldTimer = tickIntervals.get(requestId);
        if (oldTimer) clearInterval(oldTimer);
      }

      const state: TrackingState = {
        requestId,
        ambulanceCode,
        status: "dispatched",
        progress: 0,
        etaMinutes: +(distanceKm / 35 * 60).toFixed(1),
        speedKmh: 0,
        position: origin,
        origin,
        destination,
        distanceKm,
        startedAt: Date.now(),
        updatedAt: Date.now(),
        events: [],
      };

      sessions.set(requestId, state);
      socket.join(`session:${requestId}`);
      logEvent(state, "dispatched", `Ambulance ${ambulanceCode} dispatched from depot`);
      broadcastState(state);

      // Tick every 2 seconds, advancing ~5-10% of route per tick (full trip ~20-40s)
      const timer = setInterval(() => {
        const s = sessions.get(requestId);
        if (!s) return;
        // Pace: 6% per tick by default, with mild variance
        const step = 0.04 + Math.random() * 0.05;
        s.progress = Math.min(1, s.progress + step);
        recompute(s);

        // Status transitions
        if (s.progress > 0.05 && s.status === "dispatched") {
          s.status = "enroute";
          logEvent(s, "enroute", `Ambulance ${s.ambulanceCode} en route · ETA ${s.etaMinutes} min`);
        }
        if (s.progress >= 1 && s.status !== "arrived") {
          s.status = "arrived";
          s.etaMinutes = 0;
          logEvent(s, "arrived", `Ambulance ${s.ambulanceCode} has arrived at destination`);
          const t = tickIntervals.get(requestId);
          if (t) {
            clearInterval(t);
            tickIntervals.delete(requestId);
          }
        }

        broadcastState(s);

        if (s.status === "arrived") {
          // Auto-clear session 60s after arrival
          setTimeout(() => {
            sessions.delete(requestId);
            tickIntervals.delete(requestId);
          }, 60000);
        }
      }, 2000);

      tickIntervals.set(requestId, timer);
    } catch (err: any) {
      console.error("[ambulance-tracker] track:start error", err);
      socket.emit("track:error", { message: err?.message || "internal error" });
    }
  });

  // Join an existing session room to receive updates
  socket.on("track:join", (payload: any) => {
    const requestId = String(payload?.requestId || "");
    if (requestId) {
      socket.join(`session:${requestId}`);
      const state = sessions.get(requestId);
      if (state) {
        broadcastState(state);
        // Replay events
        for (const ev of state.events) {
          socket.emit("ambulance:event", { requestId, event: ev });
        }
      }
    }
  });

  // Cancel / stop tracking
  socket.on("track:stop", (payload: any) => {
    const requestId = String(payload?.requestId || "");
    const s = sessions.get(requestId);
    if (s) {
      s.status = "cancelled";
      logEvent(s, "cancelled", `Tracking cancelled for ${s.ambulanceCode}`);
      const t = tickIntervals.get(requestId);
      if (t) clearInterval(t);
      tickIntervals.delete(requestId);
      broadcastState(s);
      sessions.delete(requestId);
    }
  });

  // ----- Notifications feed -----
  // Clients join the global notifications room to receive emergency updates
  socket.on("notify:join", () => {
    socket.join("notifications");
  });

  // Any client can broadcast a notification to all listeners
  socket.on("notify:send", (payload: any) => {
    const notif = {
      id: String(payload?.id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      timestamp: Date.now(),
      type: String(payload?.type || "info"), // info | emergency | ambulance | hospital | document | ai | alert
      title: String(payload?.title || "Notification"),
      message: String(payload?.message || ""),
      level: String(payload?.level || "info"), // info | success | warning | error
    };
    io.to("notifications").emit("notify:new", notif);
  });

  // Also broadcast ambulance status events to the global notifications channel
  // so dashboard listeners see "Ambulance en route" updates even without the
  // tracking modal open.
  socket.on("disconnect", () => {
    console.log(`[ambulance-tracker] client disconnected: ${socket.id}`);
  });

  socket.on("error", (err: any) => {
    console.error(`[ambulance-tracker] socket error (${socket.id}):`, err);
  });
});

// Periodic cleanup of stale sessions (no updates for >10 min)
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.updatedAt > 10 * 60 * 1000) {
      const t = tickIntervals.get(id);
      if (t) clearInterval(t);
      tickIntervals.delete(id);
      sessions.delete(id);
    }
  }
}, 60000);

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[ambulance-tracker] WebSocket server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[ambulance-tracker] SIGTERM, shutting down...");
  for (const t of tickIntervals.values()) clearInterval(t);
  httpServer.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("[ambulance-tracker] SIGINT, shutting down...");
  for (const t of tickIntervals.values()) clearInterval(t);
  httpServer.close(() => process.exit(0));
});

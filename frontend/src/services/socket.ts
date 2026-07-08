import { io, Socket } from "socket.io-client";

const WS_URL = "";

type Callback = (...args: never[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Callback>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb as (...args: unknown[]) => void);
      });
    });
  }

  on(event: string, callback: Callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback as (...args: unknown[]) => void);
  }

  off(event: string, callback: Callback) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback as (...args: unknown[]) => void);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();

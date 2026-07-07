const { Server } = require("socket.io");
const logger = require("../utils/logger");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = 0;
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on("connection", (socket) => {
      this.connectedClients++;
      logger.info(`Client connected: ${socket.id} (total: ${this.connectedClients})`);

      socket.on("subscribe", (channel) => {
        socket.join(channel);
        logger.debug(`Socket ${socket.id} joined channel: ${channel}`);
      });

      socket.on("unsubscribe", (channel) => {
        socket.leave(channel);
      });

      socket.on("disconnect", (reason) => {
        this.connectedClients--;
        logger.info(`Client disconnected: ${socket.id} (reason: ${reason}, total: ${this.connectedClients})`);
      });
    });

    logger.info("Socket.IO server initialized");
  }

  broadcast(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  emitToRoom(room, event, data) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  getConnectedCount() {
    return this.connectedClients;
  }
}

module.exports = new SocketService();

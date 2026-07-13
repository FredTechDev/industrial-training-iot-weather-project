const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const config = require("./config");
const logger = require("./utils/logger");
const prisma = require("./utils/prisma");
const socketService = require("./services/socketService");
const mqttSubscriber = require("./mqtt/subscriber");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const weatherRoutes = require("./routes/weather");
const alertRoutes = require("./routes/alerts");
const deviceRoutes = require("./routes/devices");
const statusRoutes = require("./routes/status");
const dashboardRoutes = require("./routes/dashboard");

const path = require("path");
const app = express();
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan("short"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use("/api/weather", weatherRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/dashboard", dashboardRoutes);

const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return notFound(req, res);
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) res.status(404).send("Frontend not built");
  });
});

app.use(errorHandler);

socketService.initialize(server);

async function start() {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL database");
  } catch (err) {
    logger.warn("Database not reachable — starting without DB. App will retry connections at runtime.", { error: err.message });
  }

  mqttSubscriber.connect();

  server.listen(config.port, () => {
    logger.info(`Backend server running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`MQTT Broker: ${config.mqtt.brokerUrl}`);
  });
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received - shutting down");
  mqttSubscriber.disconnect();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received - shutting down");
  mqttSubscriber.disconnect();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

start();

module.exports = app;

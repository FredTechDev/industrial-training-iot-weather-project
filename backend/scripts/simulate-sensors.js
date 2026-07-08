const mqtt = require("mqtt");

const BROKER = "mqtts://6f83a2bd234445aca1060e89e6171e19.s1.eu.hivemq.cloud:8883";
const USERNAME = "mmust-iot-001";
const PASSWORD = "Fred1234";
const TOPIC = "weather/live";
const INTERVAL_MS = 5000;
const COUNT = 10;

function generateReading() {
  const baseTemp = 28 + Math.random() * 8;
  const baseHum = 50 + Math.random() * 20;
  return {
    deviceId: "station-001",
    temperature: parseFloat((baseTemp + (Math.random() - 0.5) * 2).toFixed(1)),
    humidity: parseFloat((baseHum + (Math.random() - 0.5) * 5).toFixed(1)),
    pressure: parseFloat((1013 + (Math.random() - 0.5) * 10).toFixed(1)),
    altitude: parseFloat((1780 + (Math.random() - 0.5) * 20).toFixed(1)),
    light: Math.round(15000 + Math.random() * 20000),
    rain: Math.random() < 0.2,
    battery: parseFloat((85 + Math.random() * 15).toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}

const client = mqtt.connect(BROKER, {
  clientId: `sim-${Date.now()}`,
  username: USERNAME,
  password: PASSWORD,
  rejectUnauthorized: false,
});

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud\n");
  let sent = 0;
  const interval = setInterval(() => {
    sent++;
    const reading = generateReading();
    client.publish(TOPIC, JSON.stringify(reading), { qos: 0 });
    console.log(
      `[${sent}/${COUNT}] ${reading.temperature}°C  ${reading.humidity}%  ` +
        `${reading.pressure}hPa  ${reading.altitude}m  ${reading.light}lux  ` +
        `${reading.rain ? "🌧" : "☀"}  ${reading.battery}%`
    );
    if (sent >= COUNT) {
      clearInterval(interval);
      console.log("\nDone. Waiting a moment for delivery...");
      setTimeout(() => client.end(true), 2000);
    }
  }, INTERVAL_MS);
});

client.on("error", (err) => console.error("MQTT error:", err.message));

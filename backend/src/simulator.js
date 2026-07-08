const mqtt = require("mqtt");
const config = require("./config");
const logger = require("./utils/logger");

class WeatherSimulator {
  constructor() {
    this.client = null;
    this.interval = null;
    this.readingCount = 0;
    this.baseTemp = 28;
    this.baseHumidity = 65;
    this.basePressure = 1008;
    this.baseLight = 3200;
    this.baseAltitude = 1780;
    this.rainProbability = 0.1;
    this.timeOfDay = 0;
  }

  start() {
    const options = {
      clientId: `weather-simulator-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
    };

    this.client = mqtt.connect(config.mqtt.brokerUrl, options);

    this.client.on("connect", () => {
      logger.info("Weather simulator connected to MQTT");
      this.simulate();
      this.interval = setInterval(() => this.simulate(), config.simulator.interval * 1000);
    });

    this.client.on("error", (err) => {
      logger.error("Simulator MQTT error", { error: err.message });
    });
  }

  simulate() {
    this.readingCount++;
    this.timeOfDay = (this.timeOfDay + config.simulator.interval) % 86400;

    const hourFraction = this.timeOfDay / 86400;
    const diurnalVariation = Math.sin(hourFraction * 2 * Math.PI - Math.PI / 2) * 5;

    const temp = parseFloat((this.baseTemp + diurnalVariation + this.gaussianRandom() * 1.5).toFixed(1));
    const humidity = parseFloat(Math.min(100, Math.max(10, this.baseHumidity - diurnalVariation * 2 + this.gaussianRandom() * 3)).toFixed(1));
    const pressure = parseFloat((this.basePressure + this.gaussianRandom() * 2 + Math.sin(this.readingCount * 0.01) * 3).toFixed(1));

    const isDaytime = this.timeOfDay > 21600 && this.timeOfDay < 64800;
    const light = isDaytime ? Math.round(3000 + Math.sin(hourFraction * 2 * Math.PI) * 20000 + Math.random() * 2000) : Math.round(Math.random() * 200);

    const rain = Math.random() < this.rainProbability;

    if (humidity > 80 && pressure < 1000) this.rainProbability = Math.min(0.8, this.rainProbability + 0.05);
    else this.rainProbability = Math.max(0.05, this.rainProbability - 0.01);

    const battery = parseFloat(Math.max(0, 100 - this.readingCount * 0.01).toFixed(1));

    const reading = {
      deviceId: config.simulator.deviceId,
      temperature: temp,
      humidity,
      pressure,
      altitude: this.baseAltitude + this.gaussianRandom() * 10,
      light,
      rain,
      battery,
      timestamp: new Date().toISOString(),
    };

    this.client.publish(config.mqtt.topics.live, JSON.stringify(reading), { qos: 1 });
    logger.debug(`Simulated reading #${this.readingCount}`, { temp, humidity, pressure, rain, light });
  }

  gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.client) this.client.end(true);
  }
}

// NOTE: Simulator is NOT auto-started in production.
// To use for testing: const simulator = new WeatherSimulator(); simulator.start();
module.exports = WeatherSimulator;

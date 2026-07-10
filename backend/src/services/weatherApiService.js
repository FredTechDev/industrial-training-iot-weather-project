const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

class WeatherApiService {
  constructor() {
    this.lastFetch = 0;
    this.cache = null;
    this.fetchInterval = 5 * 60 * 1000;
  }

  async getCurrentWeather() {
    const now = Date.now();
    if (this.cache && now - this.lastFetch < this.fetchInterval) {
      return this.cache;
    }

    const apiKey = config.openWeather.apiKey;
    if (!apiKey) {
      logger.warn("OpenWeatherMap API key not configured");
      return null;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${config.openWeather.lat}&lon=${config.openWeather.lon}&appid=${apiKey}&units=metric`;
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      this.cache = {
        temperature: parseFloat(data.main.temp.toFixed(1)),
        humidity: parseFloat(data.main.humidity.toFixed(1)),
        pressure: parseFloat(data.main.pressure.toFixed(1)),
        description: data.weather[0]?.description || "",
        fetchedAt: new Date().toISOString(),
      };
      this.lastFetch = now;

      logger.debug("OpenWeatherMap data fetched", this.cache);
      return this.cache;
    } catch (err) {
      logger.error("Failed to fetch OpenWeatherMap data", { error: err.message });
      return this.cache;
    }
  }
}

module.exports = new WeatherApiService();

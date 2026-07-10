const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class AlertEngine {
  async evaluateReading(reading, trends) {
    const alerts = [];

    try {
      const highTemp = this.checkHighTemperature(reading);
      if (highTemp) alerts.push(highTemp);

      const lowTemp = this.checkLowTemperature(reading);
      if (lowTemp) alerts.push(lowTemp);

      const lowPressure = this.checkLowPressure(reading);
      if (lowPressure) alerts.push(lowPressure);

      const stormRisk = this.checkStormRisk(reading, trends);
      if (stormRisk) alerts.push(stormRisk);

      const heavyRain = this.checkHeavyRain(reading);
      if (heavyRain) alerts.push(heavyRain);

      const extremeLight = this.checkExtremeLight(reading);
      if (extremeLight) alerts.push(extremeLight);

      const highHumidity = this.checkHighHumidity(reading);
      if (highHumidity) alerts.push(highHumidity);

      for (const alert of alerts) {
        await this.saveAlert(alert);
      }
    } catch (err) {
      logger.error("Error evaluating alerts", { error: err.message });
    }

    return alerts;
  }

  checkHighTemperature(reading) {
    const temp = Number(reading.temperature);
    if (temp > 40) {
      return {
        severity: "critical",
        title: "Extreme High Temperature",
        message: `Temperature reading of ${temp}°C exceeds safe threshold of 40°C. Potential heat hazard.`,
      };
    }
    if (temp > 35) {
      return {
        severity: "warning",
        title: "High Temperature Warning",
        message: `Temperature at ${temp}°C is above normal range.`,
      };
    }
    return null;
  }

  checkLowTemperature(reading) {
    const temp = Number(reading.temperature);
    if (temp < 0) {
      return {
        severity: "warning",
        title: "Freezing Temperature",
        message: `Temperature dropped to ${temp}°C. Frost risk detected.`,
      };
    }
    return null;
  }

  checkLowPressure(reading) {
    const pressure = Number(reading.pressure);
    if (pressure < 970) {
      return {
        severity: "critical",
        title: "Very Low Pressure",
        message: `Pressure at ${pressure} hPa. Severe storm risk.`,
      };
    }
    if (pressure < 990) {
      return {
        severity: "warning",
        title: "Low Pressure",
        message: `Pressure at ${pressure} hPa. Storm possible.`,
      };
    }
    return null;
  }

  checkStormRisk(reading, trends) {
    if (!trends || !trends.pressure) return null;
    if (trends.pressure.direction === "falling" && trends.pressure.rate < -0.3) {
      return {
        severity: "warning",
        title: "Storm Risk Detected",
        message: `Pressure dropping rapidly at ${Math.abs(trends.pressure.rate)} hPa/reading. Storm may be approaching.`,
      };
    }
    return null;
  }

  checkHeavyRain(reading) {
    if (reading.rain) {
      if (Number(reading.humidity) > 85) {
        return {
          severity: "warning",
          title: "Heavy Rain Detected",
          message: `Rain detected with humidity at ${reading.humidity}%. Possible heavy precipitation.`,
        };
      }
      return {
        severity: "info",
        title: "Rain Detected",
        message: "Rainfall detected at sensor station.",
      };
    }
    return null;
  }

  checkExtremeLight(reading) {
    if (reading.light > 80000) {
      return {
        severity: "info",
        title: "Extreme Brightness",
        message: `Light level at ${reading.light} lux. Direct sunlight detected.`,
      };
    }
    return null;
  }

  checkHighHumidity(reading) {
    const humidity = Number(reading.humidity);
    if (humidity > 95) {
      return {
        severity: "warning",
        title: "Extreme Humidity",
        message: `Humidity at ${humidity}%. Near saturation - fog or precipitation likely.`,
      };
    }
    return null;
  }

  async saveAlert(alert) {
    try {
      await prisma.alert.create({
        data: {
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          status: "active",
        },
      });
    } catch (err) {
      logger.error("Failed to save alert", { error: err.message });
    }
  }

  async getAlerts(limit = 50, status = null) {
    const where = status ? { status } : {};
    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async acknowledgeAlert(id) {
    return prisma.alert.update({
      where: { id },
      data: { status: "acknowledged" },
    });
  }

  async resolveAlert(id) {
    return prisma.alert.update({
      where: { id },
      data: { status: "resolved", resolvedAt: new Date() },
    });
  }
}

module.exports = new AlertEngine();

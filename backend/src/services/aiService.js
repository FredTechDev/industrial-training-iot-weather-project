const axios = require("axios");
const config = require("../config");
const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class AiService {
  constructor() {
    this.lastReportTime = 0;
    this.minInterval = 120000;
    this.consecutiveFailures = 0;
    this.maxRetries = 3;
  }

  async shouldGenerateReport(reading) {
    const now = Date.now();
    const backoffMs = this.minInterval * Math.pow(2, Math.min(this.consecutiveFailures, 4));
    if (now - this.lastReportTime < backoffMs) return false;
    return true;
  }

  async generateReport(reading, trends) {
    try {
      if (!config.gemini.apiKey || config.gemini.apiKey === "your_gemini_api_key_here") {
        logger.warn("Gemini API key not configured. Generating local analysis.");
        const report = this.generateLocalAnalysis(reading, trends);
        await this.saveReport(report);
        this.lastReportTime = Date.now();
        return report;
      }

      const prompt = this.buildPrompt(reading, trends);
      const response = await this.callGeminiWithRetry(prompt);
      const report = this.parseResponse(response, reading);
      await this.saveReport(report);

      this.lastReportTime = Date.now();
      this.consecutiveFailures = 0;
      return report;
    } catch (err) {
      this.consecutiveFailures++;
      const status = err.response?.status;
      const details = err.response?.data?.error?.message || err.code || "";
      logger.error("Failed to generate AI report", {
        error: err.message,
        statusCode: status,
        details,
        consecutiveFailures: this.consecutiveFailures,
      });
      const report = this.generateLocalAnalysis(reading, trends);
      await this.saveReport(report);
      this.lastReportTime = Date.now();
      return report;
    }
  }

  generateLocalAnalysis(reading, trends) {
    const temp = Number(reading.temperature);
    const humidity = Number(reading.humidity);
    const pressure = Number(reading.pressure);
    const light = reading.light;
    const rain = reading.rain;

    const tc = trends?.temperature || { direction: "stable", rate: 0 };
    const pc = trends?.pressure || { direction: "stable", rate: 0 };
    const hc = trends?.humidity || { direction: "stable", rate: 0 };
    const rf = trends?.rainFrequency || { frequency: 0 };

    const isDaytime = light > 500;

    let conditions = [];
    if (temp > 35) conditions.push(`hot (${temp}°C)`);
    else if (temp > 28) conditions.push(`warm (${temp}°C)`);
    else if (temp > 20) conditions.push(`pleasant (${temp}°C)`);
    else if (temp > 10) conditions.push(`cool (${temp}°C)`);
    else conditions.push(`cold (${temp}°C)`);

    if (humidity > 80) conditions.push("humid");
    else if (humidity < 30) conditions.push("dry");

    if (rain) conditions.push("rainy");
    else if (isDaytime) conditions.push("fair");

    let summary = `Currently ${conditions.join(", ")}.`;

    let risks = [];
    let recommendations = [];

    if (temp > 35) {
      risks.push("Heat stress", "Dehydration risk");
      recommendations.push("Stay hydrated", "Avoid prolonged sun exposure");
    } else if (temp < 10) {
      risks.push("Cold stress");
      recommendations.push("Dress warmly");
    }

    if (rain) {
      risks.push("Wet surfaces", "Reduced visibility");
      recommendations.push("Use umbrella or rain gear", "Drive with caution");
    }

    if (humidity > 85) {
      risks.push("Mold growth", "Discomfort");
      recommendations.push("Use dehumidifiers if needed");
    } else if (humidity < 25) {
      risks.push("Dry skin", "Static electricity");
      recommendations.push("Use moisturizer", "Stay hydrated");
    }

    if (pc.direction === "falling" && pc.rate < -0.3) {
      risks.push("Approaching storm");
      recommendations.push("Secure outdoor objects", "Prepare for possible severe weather");
    }

    if (risks.length === 0) {
      recommendations.push("No special precautions needed");
    }

    const rateText = (rate) => {
      if (Math.abs(rate) < 0.01) return "barely changing";
      return `${rate > 0 ? "rising" : "falling"} at ${Math.abs(rate).toFixed(2)} per reading`;
    };

    const tempText = tc.direction === "stable"
      ? `Temperature is ${rateText(tc.rate)}`
      : `Temperature is ${rateText(tc.rate)}`;
    const pressureText = pc.direction === "stable"
      ? `Pressure is ${rateText(pc.rate)}`
      : `Pressure is ${rateText(pc.rate)}`;
    const humidityText = hc.direction === "stable"
      ? `Humidity is ${rateText(hc.rate)}`
      : `Humidity is ${rateText(hc.rate)}`;

    reasoning = `${tempText}. ${pressureText}. ${humidityText}.`;

    const rainProb = rf.frequency > 0
      ? Math.min(Math.round(rf.frequency + Math.random() * 15), 100)
      : (rain ? 70 : Math.max(0, Math.round(Math.random() * 25 - 5)));

    if (pc.direction === "falling" && pc.rate < -0.2) {
      forecast = `Rain likely in the next 30-60 minutes (${rainProb}% probability). Falling pressure suggests an approaching weather system.`;
    } else if (rainProb > 50) {
      forecast = `Rain likely in the next 30-60 minutes (${rainProb}% probability). Conditions may remain unsettled.`;
    } else if (pc.direction === "rising" && pc.rate > 0.2) {
      forecast = `No significant rain expected in the next 30-60 minutes (${rainProb}% probability). Rising pressure indicates clearing conditions.`;
    } else {
      forecast = `No significant rain expected in the next 30-60 minutes (${rainProb}% probability). Conditions should remain stable.`;
    }

    confidence = rain ? 0.65 : Math.min(0.85, 0.55 + rf.frequency / 200);

    return {
      readingId: reading.id,
      summary,
      prediction: `Rain probability: ${rainProb}%`,
      forecast,
      recommendation: recommendations.join(". ") + ".",
      confidence: parseFloat(confidence.toFixed(2)),
      reasoning,
    };
  }

  async callGeminiWithRetry(prompt, attempt = 1) {
    try {
      return await this.callGemini(prompt);
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = status === 429 || status === 500 || status === 503 || !status;

      if (isRetryable && attempt <= this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
        logger.warn("Gemini API call failed, retrying", {
          status,
          attempt,
          maxRetries: this.maxRetries,
          retryAfterMs: Math.round(delay),
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.callGeminiWithRetry(prompt, attempt + 1);
      }

      throw err;
    }
  }

  buildPrompt(reading, trends) {
    const temp = Number(reading.temperature);
    const humidity = Number(reading.humidity);
    const pressure = Number(reading.pressure);
    const altitude = Number(reading.altitude);
    const light = reading.light;
    const rain = reading.rain;
    const battery = Number(reading.battery);

    const tc = trends?.temperature || { direction: "stable", rate: 0 };
    const pc = trends?.pressure || { direction: "stable", rate: 0 };
    const hc = trends?.humidity || { direction: "stable", rate: 0 };
    const rf = trends?.rainFrequency || { frequency: 0 };
    const shortTerm = trends?.shortTerm || {};

    return `You are a professional meteorologist. Analyze the following IoT weather station telemetry and generate a structured weather report.

CURRENT READINGS:
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Atmospheric Pressure: ${pressure} hPa
- Altitude: ${altitude}m
- Ambient Light: ${light} lux
- Rain Detection: ${rain ? "Yes" : "No"}
- Battery: ${battery}%

TRENDS (last 6 hours):
- Temperature Trend: ${tc.direction} (rate: ${tc.rate}°C/reading)
- Pressure Trend: ${pc.direction} (rate: ${pc.rate} hPa/reading)
- Humidity Trend: ${hc.direction} (rate: ${hc.rate}%/reading)
- Rain Frequency: ${rf.frequency}% of readings
- 30min Avg Temp: ${shortTerm.avgTemperature || "N/A"}°C
- 30min Avg Humidity: ${shortTerm.avgHumidity || "N/A"}%

Your task:
1. Provide a brief current weather summary in plain language
2. Assess the probability of rain in the next 30-60 minutes (return as a percentage 0-100)
3. Explain the weather reasoning based on pressure, humidity, and temperature trends
4. Generate a short-term forecast narrative (30-60 minutes ahead)
5. Identify any potential risks (storm, fog, frost, heat, etc.)
6. Provide safety recommendations
7. Note environmental observations
8. Give a confidence level for your analysis (0.00-1.00)

Respond with ONLY valid JSON in this exact structure:
{
  "summary": "string",
  "rainProbability": number,
  "reasoning": "string",
  "forecast": "string",
  "risks": ["string"],
  "recommendations": ["string"],
  "observations": "string",
  "confidence": number
}`;
  }

  async callGemini(prompt) {
    const url = `${config.gemini.apiUrl}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    return response.data;
  }

  parseResponse(apiResponse, reading) {
    try {
      const text = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        readingId: reading.id,
        summary: parsed.summary || "Weather analysis unavailable.",
        prediction: `Rain probability: ${parsed.rainProbability ?? 50}%`,
        forecast: parsed.forecast || "Forecast not available.",
        recommendation: (parsed.recommendations || ["No specific recommendations."]).join(" "),
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || "",
      };
    } catch (err) {
      logger.error("Failed to parse Gemini response", { error: err.message });
      throw new Error("Failed to parse Gemini response");
    }
  }

  async saveReport(report) {
    try {
      await prisma.aiReport.create({
        data: {
          readingId: report.readingId,
          summary: report.summary,
          prediction: report.prediction,
          forecast: report.forecast,
          recommendation: report.recommendation,
          confidence: report.confidence,
          reasoning: report.reasoning,
        },
      });
    } catch (err) {
      logger.error("Failed to save AI report", { error: err.message });
    }
  }

  async getReports(limit = 20) {
    return prisma.aiReport.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { reading: true },
    });
  }
}

module.exports = new AiService();

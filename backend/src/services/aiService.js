const axios = require("axios");
const config = require("../config");
const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class AiService {
  constructor() {
    this.lastReportTime = 0;
    this.minInterval = 120000;
    this.consecutiveSimilar = 0;
    this.lastSummary = "";
  }

  async shouldGenerateReport(reading) {
    const now = Date.now();
    if (now - this.lastReportTime < this.minInterval) return false;
    return true;
  }

  async generateReport(reading, trends) {
    try {
      if (!config.gemini.apiKey || config.gemini.apiKey === "your_gemini_api_key_here") {
        logger.warn("Gemini API key not configured. Skipping AI report.");
        return null;
      }

      const prompt = this.buildPrompt(reading, trends);
      const response = await this.callGemini(prompt);
      const report = this.parseResponse(response, reading);
      await this.saveReport(report);

      this.lastReportTime = Date.now();
      return report;
    } catch (err) {
      logger.error("Failed to generate AI report", { error: err.message });
      return null;
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

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
    const battery = Number(reading.battery);

    const tc = trends?.temperature || { direction: "stable", rate: 0 };
    const pc = trends?.pressure || { direction: "stable", rate: 0 };
    const hc = trends?.humidity || { direction: "stable", rate: 0 };
    const rf = trends?.rainFrequency || { frequency: 0 };

    let summary, rainProb, reasoning, forecast, risks, recommendations, confidence;

    if (temp > 35) {
      summary = `Hot and ${rain ? "rainy" : "dry"} conditions with temperature at ${temp}°C.`;
      risks = ["Heat stress", "Dehydration risk"];
      recommendations = ["Stay hydrated", "Avoid prolonged sun exposure", "Ensure proper ventilation"];
    } else if (temp < 10) {
      summary = `Cool conditions with temperature at ${temp}°C.`;
      risks = ["Cold stress", "Potential frost"];
      recommendations = ["Dress warmly", "Protect sensitive equipment", "Check heating systems"];
    } else {
      summary = `Mild conditions with temperature at ${temp}°C.`;
      risks = [];
      recommendations = ["No special precautions needed"];
    }

    if (rain) {
      summary += " Rainfall currently detected.";
      risks.push("Wet surfaces", "Reduced visibility");
      if (!recommendations.includes("Use umbrella or rain gear")) {
        recommendations.push("Use umbrella or rain gear", "Drive with caution");
      }
    }

    if (humidity > 80) {
      summary += ` High humidity at ${humidity}%.`;
      risks.push("Mold growth", "Discomfort");
      recommendations.push("Use dehumidifiers if needed");
    } else if (humidity < 30) {
      summary += ` Low humidity at ${humidity}%.`;
      risks.push("Dry skin", "Static electricity");
      recommendations.push("Use moisturizer", "Stay hydrated");
    }

    if (pc.direction === "falling" && pc.rate < -0.3) {
      risks.push("Approaching storm");
      recommendations.push("Secure outdoor objects", "Prepare for possible severe weather");
    }

    if (pc.direction === "rising" && pc.rate > 0.3) {
      summary += " Pressure rising - clearing weather ahead.";
    }

    rainProb = rf.frequency > 0 ? Math.min(Math.round(rf.frequency + Math.random() * 20), 100) : (rain ? 70 : Math.round(Math.random() * 25));

    const tempTrend = tc.direction === "rising" ? "warming" : tc.direction === "falling" ? "cooling" : "stable";
    const pressureDesc = pc.direction === "falling" ? "falling" : pc.direction === "rising" ? "rising" : "stable";
    const humidityDesc = hc.direction === "rising" ? "increasing" : hc.direction === "falling" ? "decreasing" : "stable";

    reasoning = `Temperature is ${tempTrend} at ${Math.abs(tc.rate)}°C per reading. Pressure is ${pressureDesc} at ${Math.abs(pc.rate)} hPa per reading. Humidity is ${humidityDesc}.`;
    forecast = rainProb > 50
      ? `Rain likely in the next 30-60 minutes (${rainProb}% probability). ${pc.direction === "falling" ? "Falling pressure supports this assessment." : "Conditions may remain unsettled."}`
      : `No significant rain expected in the next 30-60 minutes. ${pc.direction === "rising" ? "Rising pressure indicates improving conditions." : "Conditions should remain stable."}`;

    confidence = rain ? 0.65 : 0.75;

    return {
      readingId: reading.id,
      summary,
      prediction: `Rain probability: ${rainProb}%`,
      forecast,
      recommendation: recommendations.join(". ") + ".",
      confidence,
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

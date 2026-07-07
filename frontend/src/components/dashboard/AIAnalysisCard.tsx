import { useEffect, useState } from "react";
import type { AiReport } from "../../types";
import { socketService } from "../../services/socket";

interface AIAnalysisCardProps {
  initialData?: AiReport | null;
}

export default function AIAnalysisCard({ initialData }: AIAnalysisCardProps) {
  const [report, setReport] = useState<AiReport | null>(initialData ?? null);

  useEffect(() => {
    const handler = (data: AiReport) => setReport(data);
    socketService.on("weather:report", handler);
    return () => socketService.off("weather:report", handler);
  }, []);

  useEffect(() => {
    if (initialData) setReport(initialData);
  }, [initialData]);

  if (!report) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold text-white">AI Weather Analysis</h3>
        </div>
        <p className="text-gray-400 text-sm">Waiting for AI analysis...</p>
      </div>
    );
  }

  const confPercent = (Number(report.confidence) * 100).toFixed(0);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold text-white">AI Weather Analysis</h3>
        </div>
        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">
          {confPercent}% confidence
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">Summary</p>
          <p className="text-white text-sm">{report.summary}</p>
        </div>

        {report.forecast && (
          <div>
            <p className="text-sm text-gray-400 mb-1">30-60 Min Forecast</p>
            <p className="text-blue-300 text-sm">{report.forecast}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-400 mb-1">Prediction</p>
          <p className="text-yellow-300 text-sm">{report.prediction}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Recommendation</p>
          <p className="text-green-300 text-sm">{report.recommendation}</p>
        </div>

        {report.reasoning && (
          <div>
            <p className="text-sm text-gray-400 mb-1">Reasoning</p>
            <p className="text-gray-300 text-xs">{report.reasoning}</p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all"
            style={{ width: `${confPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

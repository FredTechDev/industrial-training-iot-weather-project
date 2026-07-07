import { useReports } from "../hooks/useWeather";
import Spinner from "../components/common/Spinner";

export default function AIReportsPage() {
  const { data: reports, isLoading } = useReports(50);

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Reports</h2>
        <p className="text-gray-400 text-sm">Gemini-powered weather analysis and forecasts</p>
      </div>

      {reports?.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <p className="text-gray-400">No AI reports generated yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Reports are generated automatically when sensor data is received
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports?.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <p className="text-white font-medium">AI Weather Report</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">
                  {Math.round(Number(report.confidence) * 100)}% confidence
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Summary</p>
                  <p className="text-white text-sm">{report.summary}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Forecast (30-60 min)</p>
                  <p className="text-blue-300 text-sm">{report.forecast}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Prediction</p>
                  <p className="text-yellow-300 text-sm">{report.prediction}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Recommendation</p>
                  <p className="text-green-300 text-sm">{report.recommendation}</p>
                </div>
              </div>

              {report.reasoning && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">Analysis Reasoning</p>
                  <p className="text-gray-400 text-xs">{report.reasoning}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

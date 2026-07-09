export default function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-800 rounded-xl border border-gray-700" />
      ))}
    </div>
  );
}

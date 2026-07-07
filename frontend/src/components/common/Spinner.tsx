interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export default function Spinner({ size = "md" }: SpinnerProps) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizes[size]} border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin`}
      />
    </div>
  );
}

import { motion } from "framer-motion";

interface WindowAnimationProps {
  isOpen: boolean;
}

export default function WindowAnimation({ isOpen }: WindowAnimationProps) {
  return (
    <div className="relative w-32 h-40">
      {/* Frame */}
      <div className="absolute inset-0 border-4 border-gray-600 rounded-lg" />
      {/* Glass pane */}
      <motion.div
        className="absolute top-1 left-1 right-1 bottom-1 rounded bg-gradient-to-br from-sky-400/20 to-blue-500/10 border border-gray-500/50 origin-left"
        animate={{ rotateY: isOpen ? -60 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ perspective: 400 }}
      >
        <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-sky-300/10 border border-gray-500/30 rounded-sm" />
          ))}
        </div>
      </motion.div>
      {/* Label */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className={`text-xs font-bold ${isOpen ? "text-emerald-400" : "text-amber-400"}`}>
          {isOpen ? "OPEN 90°" : "CLOSED 0°"}
        </span>
      </div>
    </div>
  );
}

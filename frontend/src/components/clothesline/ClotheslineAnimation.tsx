import { motion } from "framer-motion";

interface ClotheslineAnimationProps {
  isExtended: boolean;
}

export default function ClotheslineAnimation({ isExtended }: ClotheslineAnimationProps) {
  return (
    <div className="relative w-40 h-32">
      {/* Support pole */}
      <div className="absolute left-2 top-0 bottom-0 w-1 bg-gray-500 rounded" />
      <div className="absolute right-2 top-0 bottom-0 w-1 bg-gray-500 rounded" />

      {/* Cover / shelter */}
      <div className="absolute left-0 top-0 w-10 h-full bg-gray-700/50 border border-gray-600 rounded-l-lg" />

      {/* Clothesline wire */}
      <motion.div
        className="absolute top-3 h-0.5 bg-gradient-to-r from-gray-400 to-gray-300 origin-left"
        animate={{ width: isExtended ? "75%" : "20%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ left: "8px" }}
      />

      {/* Clothes items */}
      <motion.div
        className="absolute top-5 flex gap-3"
        animate={{ x: isExtended ? 0 : -60, opacity: isExtended ? 1 : 0.3 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className="w-4 h-6 bg-sky-400/60 rounded-sm border border-sky-300/30" />
        <div className="w-4 h-5 bg-rose-400/60 rounded-sm border border-rose-300/30" />
        <div className="w-4 h-6 bg-emerald-400/60 rounded-sm border border-emerald-300/30" />
        <div className="w-4 h-5 bg-amber-400/60 rounded-sm border border-amber-300/30" />
      </motion.div>

      {/* Sun indicator */}
      <motion.div
        className="absolute -top-1 right-2"
        animate={{ opacity: isExtended ? 1 : 0.2, scale: isExtended ? 1 : 0.7 }}
        transition={{ duration: 0.8 }}
      >
        <div className="w-5 h-5 rounded-full bg-yellow-400/80 shadow-lg shadow-yellow-500/30" />
      </motion.div>

      {/* Rain cloud indicator */}
      <motion.div
        className="absolute -top-1 left-12"
        animate={{ opacity: isExtended ? 0 : 1, scale: isExtended ? 0.7 : 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="w-6 h-3 bg-gray-400 rounded-full" />
      </motion.div>

      {/* Label */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className={`text-xs font-bold ${isExtended ? "text-emerald-400" : "text-amber-400"}`}>
          {isExtended ? "EXTENDED 90°" : "RETRACTED 0°"}
        </span>
      </div>
    </div>
  );
}

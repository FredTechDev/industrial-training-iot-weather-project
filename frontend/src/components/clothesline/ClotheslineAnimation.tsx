import { motion } from "framer-motion";

interface ClotheslineAnimationProps {
  isExtended: boolean;
}

export default function ClotheslineAnimation({ isExtended }: ClotheslineAnimationProps) {
  return (
    <div className="relative w-56 h-40 select-none">
      {/* Ground / base plate */}
      <div className="absolute bottom-4 left-0 right-0 h-1 bg-gray-600 rounded-full" />

      {/* Shelter housing (fixed, left side) */}
      <div className="absolute left-0 top-2 bottom-4 w-14">
        {/* Back wall */}
        <div className="absolute inset-0 bg-gray-700/80 border border-gray-600 rounded-l-lg rounded-br-lg" />
        {/* Roof overhang */}
        <div className="absolute -top-1 -left-1 w-16 h-2 bg-gray-600 rounded-t-md border border-gray-500" />
        {/* Inner shadow to show depth */}
        <div className="absolute inset-y-2 right-0 w-3 bg-gradient-to-l from-gray-900/60 to-transparent rounded-r" />
        {/* Servo motor dot */}
        <div className="absolute bottom-3 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full shadow-sm shadow-amber-500/40" />
      </div>

      {/* Sliding rail / track */}
      <div className="absolute bottom-4 left-14 right-2 h-0.5 bg-gray-700 rounded-full" />

      {/* === Sliding assembly (moves in/out) === */}
      <motion.div
        className="absolute top-0"
        animate={{ x: isExtended ? 56 : 14 }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: 160 }}
      >
        {/* Main horizontal wire */}
        <div className="absolute top-6 h-[2px] bg-gradient-to-r from-gray-300 via-gray-200 to-gray-400 rounded-full"
             style={{ left: 0, width: 130 }} />

        {/* Secondary lower wire */}
        <div className="absolute top-10 h-[1px] bg-gradient-to-r from-gray-400/60 to-gray-500/40 rounded-full"
             style={{ left: 0, width: 110 }} />

        {/* Support post (right end) */}
        <div className="absolute top-5 right-6 w-[3px] h-14 bg-gray-500 rounded-full" />
        {/* Post foot */}
        <div className="absolute bottom-4 right-5 w-3 h-1 bg-gray-500 rounded-full" />

        {/* Bracket connector (left end, attaches to shelter) */}
        <div className="absolute top-4 left-0 w-2 h-5 bg-gray-500 rounded-r-sm" />

        {/* === Clothes items (hang on wire, move with assembly) === */}
        <motion.div
          className="absolute flex items-start gap-5"
          style={{ top: 8, left: 20 }}
          animate={{ opacity: isExtended ? 1 : 0, y: isExtended ? 0 : -8 }}
          transition={{ duration: 0.6, delay: isExtended ? 0.5 : 0 }}
        >
          {/* Shirt */}
          <div className="flex flex-col items-center">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
            <div className="w-6 h-7 bg-sky-400/70 rounded-sm border border-sky-300/30 relative">
              <div className="absolute -left-1 top-0 w-2 h-3 bg-sky-400/50 rounded-l-sm" />
              <div className="absolute -right-1 top-0 w-2 h-3 bg-sky-400/50 rounded-r-sm" />
            </div>
          </div>
          {/* Towel */}
          <div className="flex flex-col items-center">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
            <div className="w-5 h-9 bg-rose-400/70 rounded-sm border border-rose-300/30" />
          </div>
          {/* Sock pair */}
          <div className="flex flex-col items-center">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
            <div className="flex gap-0.5">
              <div className="w-2.5 h-5 bg-emerald-400/70 rounded-b-full border border-emerald-300/30" />
              <div className="w-2.5 h-5 bg-emerald-400/70 rounded-b-full border border-emerald-300/30" />
            </div>
          </div>
          {/* Sheet corner */}
          <div className="flex flex-col items-center">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
            <div className="w-7 h-6 bg-amber-400/50 rounded-sm border border-amber-300/20" />
          </div>
        </motion.div>
      </motion.div>

      {/* Sun indicator (visible when extended) */}
      <motion.div
        className="absolute -top-2 right-0"
        animate={{ opacity: isExtended ? 1 : 0, scale: isExtended ? 1 : 0.5 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-6 h-6 rounded-full bg-yellow-400/80 shadow-lg shadow-yellow-500/30" />
        <div className="absolute inset-0 w-6 h-6 rounded-full bg-yellow-400/20 animate-ping" />
      </motion.div>

      {/* Rain cloud (visible when retracted) */}
      <motion.div
        className="absolute -top-1 left-16"
        animate={{ opacity: isExtended ? 0 : 1, y: isExtended ? -6 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <div className="w-8 h-3 bg-gray-400 rounded-full" />
          <div className="absolute -top-1.5 left-1.5 w-4 h-3 bg-gray-400 rounded-full" />
          <div className="absolute -top-0.5 right-1 w-3 h-2.5 bg-gray-400 rounded-full" />
          {/* Rain drops */}
          <motion.div
            className="absolute top-2.5 left-1 flex gap-1.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <div className="w-0.5 h-2 bg-blue-400/70 rounded-full" />
            <div className="w-0.5 h-2.5 bg-blue-400/70 rounded-full mt-0.5" />
            <div className="w-0.5 h-1.5 bg-blue-400/70 rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Status label */}
      <div className="absolute -bottom-1 left-0 right-0 text-center">
        <motion.span
          className={`text-xs font-bold ${isExtended ? "text-emerald-400" : "text-amber-400"}`}
          key={isExtended ? "ext" : "ret"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isExtended ? "EXTENDED 0°" : "RETRACTED 90°"}
        </motion.span>
      </div>
    </div>
  );
}

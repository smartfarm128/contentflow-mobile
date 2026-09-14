import type { HtmlTemplateProps } from "../types";
import { motion, AnimatePresence } from "framer-motion";

export function ExpandMapTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  const location = String(values.location ?? "San Francisco, CA");
  const coordinates = String(values.coordinates ?? "37.7749° N, 122.4194° W");
  const liveLabel = String(values.liveLabel ?? "Live");
  const hintText = String(values.hintText ?? "Click to expand");

  // Determine states algebraically from progress (0 to 1)
  // Hovered state is active during middle phases
  const isHovered = progress > 0.15 && progress < 0.85;
  // Expanded state opens in the second half
  const isExpanded = progress >= 0.5;

  // Compute tilt angles deterministically based on progress
  let tiltX = 0;
  let tiltY = 0;
  if (isHovered) {
    // Sweep the tilt to show interactive depth
    const sweepProgress = (progress - 0.15) / 0.7; // normalized sweep
    tiltX = Math.sin(sweepProgress * Math.PI * 2) * 6;
    tiltY = Math.cos(sweepProgress * Math.PI * 2) * 6;
  }

  const scale = Math.min(width, height) / 1080;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0b0f19",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Background ambient gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          transform: `scale(${scale * 2.2})`,
          transformOrigin: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <motion.div
          style={{
            perspective: 1000,
          }}
        >
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800"
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              transformStyle: "preserve-3d",
              width: isExpanded ? 360 : 240,
              height: isExpanded ? 280 : 140,
            }}
            animate={{
              width: isExpanded ? 360 : 240,
              height: isExpanded ? 280 : 140,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            {/* Ambient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10 pointer-events-none" />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-slate-900" />

                  {/* City map lines */}
                  <svg className="absolute inset-0 w-full h-full animate-pulse-subtle" preserveAspectRatio="none">
                    <line x1="0%" y1="35%" x2="100%" y2="35%" className="stroke-slate-700" strokeWidth="3" />
                    <line x1="0%" y1="65%" x2="100%" y2="65%" className="stroke-slate-700" strokeWidth="3" />
                    <line x1="30%" y1="0%" x2="30%" y2="100%" className="stroke-slate-700" strokeWidth="2.5" />
                    <line x1="70%" y1="0%" x2="70%" y2="100%" className="stroke-slate-700" strokeWidth="2.5" />

                    {[20, 50, 80].map((y, i) => (
                      <line key={`h-${i}`} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`} className="stroke-slate-800" strokeWidth="1.5" />
                    ))}
                    {[15, 45, 55, 85].map((x, i) => (
                      <line key={`v-${i}`} x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%" className="stroke-slate-800" strokeWidth="1.5" />
                    ))}
                  </svg>

                  {/* Buildings */}
                  <div className="absolute top-[40%] left-[10%] w-[15%] h-[20%] rounded bg-emerald-500/10 border border-emerald-500/20" />
                  <div className="absolute top-[15%] left-[35%] w-[12%] h-[15%] rounded bg-emerald-500/8 border border-emerald-500/15" />
                  <div className="absolute top-[70%] left-[75%] w-[18%] h-[18%] rounded bg-emerald-500/12 border border-emerald-500/25" />
                  <div className="absolute top-[20%] right-[10%] w-[10%] h-[25%] rounded bg-emerald-500/8 border border-emerald-500/15" />

                  {/* Location Marker */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="drop-shadow-lg"
                      style={{ filter: "drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))" }}
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10B981" />
                      <circle cx="12" cy="9" r="2.5" className="fill-slate-950" />
                    </svg>
                  </motion.div>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed grid pattern */}
            {!isExpanded && (
              <div className="absolute inset-0 opacity-[0.05]">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid-temp" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-temp)" />
                </svg>
              </div>
            )}

            {/* Card Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <div>
                  {!isExpanded && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-400"
                      style={{
                        filter: isHovered
                          ? "drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))"
                          : "drop-shadow(0 0 4px rgba(16, 185, 129, 0.3))",
                      }}
                    >
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                      <line x1="9" x2="9" y1="3" y2="18" />
                      <line x1="15" x2="15" y1="6" y2="21" />
                    </svg>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.04)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{liveLabel}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3
                  className="text-white font-semibold text-sm tracking-tight"
                  style={{
                    transform: `translateX(${isHovered ? 4 : 0}px)`,
                    transition: "transform 0.2s ease",
                  }}
                >
                  {location}
                </h3>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.p
                      className="text-slate-400 text-xs font-mono"
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -5, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {coordinates}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div
                  className="h-px bg-gradient-to-r from-emerald-500/50 via-emerald-400/20 to-transparent"
                  style={{
                    transform: `scaleX(${isHovered || isExpanded ? 1 : 0.3})`,
                    transformOrigin: "left center",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Text Hint */}
        <span
          style={{
            fontSize: "10px",
            color: "#64748b",
            opacity: isHovered && !isExpanded ? 1 : 0,
            transform: `translateY(${isHovered ? 0 : 4}px)`,
            transition: "opacity 0.2s, transform 0.2s",
            fontWeight: 500,
          }}
        >
          {hintText}
        </span>
      </div>
    </div>
  );
}

export default ExpandMapTemplate;

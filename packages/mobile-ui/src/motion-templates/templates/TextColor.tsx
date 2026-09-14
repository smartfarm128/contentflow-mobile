import type { HtmlTemplateProps } from "../types";
import { Plus } from "lucide-react";

export function TextColorTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 8);
  const text1 = String(values.text1 ?? "Develop.");
  const text2 = String(values.text2 ?? "Preview.");
  const text3 = String(values.text3 ?? "Ship.");

  const scaleFactor = Math.min(width, height) / 1080;
  
  // Calculate algebraic timing phase
  const t = time % cycleDuration;
  const p = t / cycleDuration; // 0 to 1

  // Function to calculate foreground opacity based on keyframes
  // keyframes 1:
  // [0, 0.16667] -> 1
  // [0.33333, 0.83333] -> 0
  // [0.16667, 0.33333] -> fade out
  // [0.83333, 0.91667] -> fade in
  const getOpacity1 = (pct: number) => {
    if (pct <= 0.16667 || pct >= 0.95) return 1;
    if (pct >= 0.33333 && pct <= 0.83333) return 0;
    if (pct > 0.16667 && pct < 0.33333) {
      return 1 - (pct - 0.16667) / (0.33333 - 0.16667);
    }
    // between 0.83333 and 0.95
    return (pct - 0.83333) / (0.95 - 0.83333);
  };

  // keyframes 2:
  // [0.33333, 0.5] -> 1
  // [0, 0.16667] & [0.66667, 1] -> 0
  // fades in/out in between
  const getOpacity2 = (pct: number) => {
    if (pct >= 0.33333 && pct <= 0.5) return 1;
    if (pct <= 0.16667 || pct >= 0.66667) return 0;
    if (pct > 0.16667 && pct < 0.33333) {
      return (pct - 0.16667) / (0.33333 - 0.16667);
    }
    // between 0.5 and 0.66667
    return 1 - (pct - 0.5) / (0.66667 - 0.5);
  };

  // keyframes 3:
  // [0.66667, 0.83333] -> 1
  // [0, 0.5] & [0.95, 1] -> 0
  // fades in/out in between
  const getOpacity3 = (pct: number) => {
    if (pct >= 0.66667 && pct <= 0.83333) return 1;
    if (pct <= 0.5 || pct >= 0.95) return 0;
    if (pct > 0.5 && pct < 0.66667) {
      return (pct - 0.5) / (0.66667 - 0.5);
    }
    // between 0.83333 and 0.95
    return 1 - (pct - 0.83333) / (0.95 - 0.83333);
  };

  const op1 = getOpacity1(p);
  const op2 = getOpacity2(p);
  const op3 = getOpacity3(p);

  // Background text layer opacity is the inverse of foreground (1 - op)
  const bgOp1 = 1 - op1;
  const bgOp2 = 1 - op2;
  const bgOp3 = 1 - op3;

  const fontSize = Math.max(24, 76 * scaleFactor);
  const plusSize = Math.max(12, 32 * scaleFactor);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030014",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ width: "90%", maxWidth: "1200px", padding: `${20 * scaleFactor}px` }}>
        <div
          style={{
            position: "relative",
            padding: `${64 * scaleFactor}px`,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            background: "radial-gradient(100rem 24rem at center, rgba(255,255,255,0.02), transparent)",
          }}
        >
          {/* Plus Corners */}
          <Plus style={{ position: "absolute", left: `-${plusSize/2}px`, top: `-${plusSize/2}px`, width: `${plusSize}px`, height: `${plusSize}px`, color: "#6366f1" }} />
          <Plus style={{ position: "absolute", left: `-${plusSize/2}px`, bottom: `-${plusSize/2}px`, width: `${plusSize}px`, height: `${plusSize}px`, color: "#6366f1" }} />
          <Plus style={{ position: "absolute", right: `-${plusSize/2}px`, top: `-${plusSize/2}px`, width: `${plusSize}px`, height: `${plusSize}px`, color: "#6366f1" }} />
          <Plus style={{ position: "absolute", right: `-${plusSize/2}px`, bottom: `-${plusSize/2}px`, width: `${plusSize}px`, height: `${plusSize}px`, color: "#6366f1" }} />

          <h1
            style={{
              display: "flex",
              flexDirection: width < 768 ? "column" : "row",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              margin: 0,
            }}
          >
            {/* Word 1 */}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                padding: `0 ${20 * scaleFactor}px`,
              }}
            >
              {/* Background dark text shadow */}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1c1917",
                  opacity: bgOp1,
                  zIndex: 0,
                }}
              >
                {text1}
              </span>
              {/* Foreground gradient text */}
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  backgroundImage: "linear-gradient(to right, #39ff14, #00ffff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: op1,
                }}
              >
                {text1}
              </span>
            </span>

            {/* Word 2 */}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                padding: `0 ${20 * scaleFactor}px`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1c1917",
                  opacity: bgOp2,
                  zIndex: 0,
                }}
              >
                {text2}
              </span>
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  backgroundImage: "linear-gradient(to right, #ff073a, #ff6ec7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: op2,
                }}
              >
                {text2}
              </span>
            </span>

            {/* Word 3 */}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                padding: `0 ${20 * scaleFactor}px`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1c1917",
                  opacity: bgOp3,
                  zIndex: 0,
                }}
              >
                {text3}
              </span>
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  backgroundImage: "linear-gradient(to right, #faff00, #00f0ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: op3,
                }}
              >
                {text3}
              </span>
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}

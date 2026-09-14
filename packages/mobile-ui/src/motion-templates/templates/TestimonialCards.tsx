import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Quote, Star } from "lucide-react";

export function TestimonialCardsTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const accentColor = String(values.accentColor ?? "#6366f1");
  const cardBg = String(values.cardBg ?? "#1e293b");

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Static list of 3 testimonials matching the demo structure
  const testimonials = useMemo(() => [
    {
      id: 1,
      name: "Jenn F.",
      title: "Marketing Director @ Square",
      text: "I feel like I've learned as much from ContentFlow as I did completing my masters. It's the first thing I read every morning.",
      rating: 5
    },
    {
      id: 2,
      name: "Adrian Y.",
      title: "Product Marketing @ Meta",
      text: "My boss thinks I know what I'm doing. Honestly, I just use these templates in my daily workflow to save dozens of hours.",
      rating: 5
    },
    {
      id: 3,
      name: "Devin R.",
      title: "Growth Marketing @ OpenAI",
      text: "Can not believe this tool is so lightweight. If it was $5,000 a month, it would still be worth every single penny.",
      rating: 5
    }
  ], []);

  // Animation cycle definitions (9-second loop for 3 cards, 3 seconds per card)
  const cycleDuration = 9;
  const t = time % cycleDuration;

  // Determine positions of cards (0: front, 1: middle, 2: back)
  const cardStates = useMemo(() => {
    // Determine card positions at t
    // cardIndex is 0, 1, 2
    // returns { zIndex, x, rotate, scale, opacity }
    const getCardStyle = (cardIdx: number) => {
      // Current active card index
      const activeIdx = Math.floor(t / 3); // 0, 1, 2
      
      // Calculate relative position in pile
      // 0 = front, 1 = middle, 2 = back
      const relativePos = (cardIdx - activeIdx + 3) % 3;
      
      // Swap transition duration (last 0.4s of the 3s window)
      const relativeTime = t % 3;
      const isSwapping = relativeTime > 2.6;
      const swapProgress = isSwapping ? (relativeTime - 2.6) / 0.4 : 0;

      let zIndex = 2 - relativePos;
      let x = 0;
      let rotate = 0;
      let scale = 1;
      let opacity = 1;

      // Pile offsets
      // front (relativePos = 0): x = 0%, rotate = -6deg, scale = 1.0
      // middle (relativePos = 1): x = 30%, rotate = 0deg, scale = 0.92
      // back (relativePos = 2): x = 60%, rotate = 6deg, scale = 0.84

      if (relativePos === 0) {
        // Front card is swapping to the back
        if (isSwapping) {
          // Swipe left and rotate
          x = -110 * swapProgress; // swipes left
          rotate = -6 - 15 * swapProgress;
          scale = 1 - 0.15 * swapProgress;
          opacity = 1 - 0.5 * swapProgress;
          zIndex = 3; // Keep on top during swipe
        } else {
          x = 0;
          rotate = -6;
          scale = 1;
          opacity = 1;
        }
      } else if (relativePos === 1) {
        // Middle card is moving to the front
        if (isSwapping) {
          x = 30 - 30 * swapProgress;
          rotate = 0 - 6 * swapProgress;
          scale = 0.92 + 0.08 * swapProgress;
        } else {
          x = 30;
          rotate = 0;
          scale = 0.92;
        }
      } else {
        // Back card is moving to the middle
        if (isSwapping) {
          x = 60 - 30 * swapProgress;
          rotate = 6 - 6 * swapProgress;
          scale = 0.84 + 0.08 * swapProgress;
        } else {
          x = 60;
          rotate = 6;
          scale = 0.84;
        }
      }

      return { zIndex, x, rotate, scale, opacity };
    };

    return [getCardStyle(0), getCardStyle(1), getCardStyle(2)];
  }, [t]);

  // Scaled dimensions
  const cardWidth = 350 * scaleFactor;
  const cardHeight = 450 * scaleFactor;
  const avatarSize = 100 * scaleFactor;
  const padding = 32 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0b0f19",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative Glow Grid */}
      <div
        style={{
          position: "absolute",
          width: `${800 * scaleFactor}px`,
          height: `${800 * scaleFactor}px`,
          background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Pile Wrapper Bounding Box */}
      <div
        style={{
          position: "relative",
          width: `${cardWidth * 1.6}px`,
          height: `${cardHeight}px`,
          display: "flex",
          alignItems: "center",
          marginLeft: `-${cardWidth * 0.3}px`, // center the stack offset
        }}
      >
        {testimonials.map((test, index) => {
          const style = cardStates[index];
          
          return (
            <div
              key={test.id}
              style={{
                position: "absolute",
                left: 0,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                backgroundColor: cardBg,
                borderRadius: `${20 * scaleFactor}px`,
                border: "2px solid rgba(255, 255, 255, 0.06)",
                padding: `${padding}px`,
                boxShadow: "0 15px 35px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "center",
                transform: `translateX(${style.x}%) rotate(${style.rotate}deg) scale(${style.scale})`,
                zIndex: style.zIndex,
                opacity: style.opacity,
                transition: "transform 0.1s linear, opacity 0.1s linear", // linear sync with playhead
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Quote Icon */}
              <Quote size={32 * scaleFactor} style={{ color: accentColor, opacity: 0.6 }} />

              {/* Avatar image */}
              <img
                src={`https://i.pravatar.cc/150?img=${test.id + 10}`}
                alt={test.name}
                style={{
                  width: `${avatarSize}px`,
                  height: `${avatarSize}px`,
                  borderRadius: "50%",
                  border: `2px solid ${accentColor}`,
                  objectFit: "cover",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                }}
              />

              {/* Testimonial review */}
              <p
                style={{
                  fontSize: `${15 * scaleFactor}px`,
                  fontStyle: "italic",
                  color: "#cbd5e1",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                "{test.text}"
              </p>

              {/* Star Rating & Author */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} size={14 * scaleFactor} fill="#f59e0b" stroke="#f59e0b" />
                  ))}
                </div>
                <div>
                  <span style={{ fontSize: `${14 * scaleFactor}px`, fontWeight: 700, color: "#ffffff" }}>
                    {test.name}
                  </span>
                  <span style={{ fontSize: `${12 * scaleFactor}px`, color: "#94a3b8", display: "block", marginTop: "2px" }}>
                    {test.title}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

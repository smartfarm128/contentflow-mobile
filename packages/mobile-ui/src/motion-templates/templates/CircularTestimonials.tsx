import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function CircularTestimonialsTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const perSlide = Number(values.perSlide ?? 4);
  const nameColor = String(values.nameColor ?? "#ffffff");
  const designationColor = String(values.designationColor ?? "#a1a1aa");
  const quoteColor = String(values.quoteColor ?? "#e4e4e7");
  const arrowBgColor = String(values.arrowBgColor ?? "#18181b");
  const arrowFgColor = String(values.arrowFgColor ?? "#ffffff");
  const arrowHoverBgColor = String(values.arrowHoverBgColor ?? "#3b82f6");

  const scaleFactor = Math.min(width, height) / 1080;

  // Parse dynamic testimonials list from values
  const testimonials = useMemo(() => [
    {
      quote: String(values.quote1 ?? "I was impressed by the food! And I could really tell that they use high-quality ingredients. The staff was friendly and attentive. I'll definitely be back for more!"),
      name: String(values.name1 ?? "Tamar Mendelson"),
      designation: String(values.designation1 ?? "Restaurant Critic"),
      src: String(values.image1 ?? "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?q=80&w=640&auto=format&fit=crop"),
    },
    {
      quote: String(values.quote2 ?? "This place exceeded all expectations! The atmosphere is inviting, and the staff truly goes above and beyond. I'll keep returning for more exceptional dining experience."),
      name: String(values.name2 ?? "Joe Charlescraft"),
      designation: String(values.designation2 ?? "Frequent Visitor"),
      src: String(values.image2 ?? "https://images.unsplash.com/photo-1628749528992-f5702133b686?q=80&w=640&auto=format&fit=crop"),
    },
    {
      quote: String(values.quote3 ?? "Shining Yam is a hidden gem! The impeccable service and overall attention to detail created a memorable experience. I highly recommend it!"),
      name: String(values.name3 ?? "Martina Edelweist"),
      designation: String(values.designation3 ?? "Satisfied Customer"),
      src: String(values.image3 ?? "https://images.unsplash.com/photo-1524267213992-b76e8577d046?q=80&w=640&auto=format&fit=crop"),
    },
  ], [
    values.quote1, values.name1, values.designation1, values.image1,
    values.quote2, values.name2, values.designation2, values.image2,
    values.quote3, values.name3, values.designation3, values.image3,
  ]);

  // Compute active card
  const activeIndex = Math.floor((time / perSlide) % testimonials.length);
  const activeTestimonial = testimonials[activeIndex] ?? testimonials[0];

  // Timing inside current card
  const cardElapsed = time % perSlide;
  const wordDuration = 1.2; // words fully reveal in 1.2 seconds
  const wordProgress = Math.min(1, cardElapsed / wordDuration);

  // Scaled dimensions
  const gap = 160 * scaleFactor;
  const maxStickUp = gap * 0.7;
  const titleSize = Math.max(16, 32 * scaleFactor);
  const designationSize = Math.max(12, 20 * scaleFactor);
  const quoteSize = Math.max(14, 24 * scaleFactor);

  const words = useMemo(() => {
    return activeTestimonial.quote.split(" ");
  }, [activeTestimonial]);

  // Compute transforms for each image
  function getImageStyle(index: number): React.CSSProperties {
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + testimonials.length) % testimonials.length === index;
    const isRight = (activeIndex + 1) % testimonials.length === index;

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: `${24 * scaleFactor}px`,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
      transition: "transform 0.7s cubic-bezier(0.4, 2.0, 0.3, 1), opacity 0.7s ease-out",
    };

    if (isActive) {
      return {
        ...baseStyle,
        zIndex: 3,
        opacity: 1,
        transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
      };
    }
    if (isLeft) {
      return {
        ...baseStyle,
        zIndex: 2,
        opacity: 0.9,
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
      };
    }
    if (isRight) {
      return {
        ...baseStyle,
        zIndex: 2,
        opacity: 0.9,
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
      };
    }
    return {
      ...baseStyle,
      zIndex: 1,
      opacity: 0,
      transform: `scale(0.7) translateY(-${maxStickUp}px)`,
    };
  }

  // Pre-calculate active navigation button states for playhead indicators
  const isSecondHalf = cardElapsed > (perSlide * 0.8);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#060507",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${40 * scaleFactor}px`,
      }}
    >
      <div
        style={{
          display: "grid",
          // Aspect-gated: stack to one column in portrait (9:16) so the two-up
          // layout doesn't overflow a narrow vertical frame.
          gridTemplateColumns: width > height && width >= 768 ? "1fr 1fr" : "1fr",
          gap: `${80 * scaleFactor}px`,
          width: "100%",
          maxWidth: `${900 * scaleFactor}px`,
          alignItems: "center",
        }}
      >
        {/* Images Stack */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `${400 * scaleFactor}px`,
            perspective: "1000px",
          }}
        >
          {testimonials.map((t, idx) => (
            <img
              key={t.src}
              src={t.src}
              alt={t.name}
              style={getImageStyle(idx)}
            />
          ))}
        </div>

        {/* Content Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minHeight: `${320 * scaleFactor}px`,
          }}
        >
          <div>
            <h3
              style={{
                fontWeight: 700,
                color: nameColor,
                fontSize: `${titleSize}px`,
                margin: `0 0 ${4 * scaleFactor}px 0`,
                letterSpacing: "-0.01em",
              }}
            >
              {activeTestimonial.name}
            </h3>
            <p
              style={{
                color: designationColor,
                fontSize: `${designationSize}px`,
                fontWeight: 500,
                margin: `0 0 ${32 * scaleFactor}px 0`,
              }}
            >
              {activeTestimonial.designation}
            </p>
            <p
              style={{
                color: quoteColor,
                fontSize: `${quoteSize}px`,
                lineHeight: 1.6,
                fontWeight: 400,
                margin: 0,
              }}
            >
              {words.map((word, i) => {
                const wordStart = i / words.length;
                const factor = Math.min(1, Math.max(0, (wordProgress - wordStart) * 5));
                const opacity = factor;
                const blurVal = Math.max(0, 10 - factor * 10);
                const yVal = Math.max(0, 5 - factor * 5);

                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: opacity,
                      filter: `blur(${blurVal}px)`,
                      transform: `translateY(${yVal}px)`,
                      transition: "opacity 0.1s linear, filter 0.1s linear, transform 0.1s linear",
                      marginRight: `${6 * scaleFactor}px`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: `${16 * scaleFactor}px`,
              paddingTop: `${32 * scaleFactor}px`,
            }}
          >
            <div
              style={{
                width: `${44 * scaleFactor}px`,
                height: `${44 * scaleFactor}px`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSecondHalf ? arrowHoverBgColor : arrowBgColor,
                color: arrowFgColor,
                transition: "background-color 0.3s",
              }}
            >
              <ArrowLeft size={20 * scaleFactor} />
            </div>
            <div
              style={{
                width: `${44 * scaleFactor}px`,
                height: `${44 * scaleFactor}px`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: !isSecondHalf ? arrowHoverBgColor : arrowBgColor,
                color: arrowFgColor,
                transition: "background-color 0.3s",
              }}
            >
              <ArrowRight size={20 * scaleFactor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { HtmlTemplateProps } from "../types";

export function AnimatedCardsStackTemplate({
  progress,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const scaleFactor = Math.min(width, height) / 1080;
  const cardWidth = 350 * scaleFactor;
  const cardHeight = 450 * scaleFactor;

  const sectionTitle = String(values.title ?? "Recognitions");
  const sectionSubtitle = String(values.subtitle ?? "See our achievements and reviews");

  const cards = [
    {
      id: 1,
      title: String(values.card1Title ?? "Awwwards"),
      subtitle: String(values.card1Subtitle ?? "Site of the Day"),
      icon: "🏆",
      description: String(values.card1Desc ?? "For outstanding creativity, visual design, and mobile friendliness."),
      color: "#2563eb",
    },
    {
      id: 2,
      title: String(values.card2Title ?? "Performance"),
      subtitle: String(values.card2Subtitle ?? "100% Performance Score"),
      icon: "🚀",
      description: String(values.card2Desc ?? "Optimized core web vitals and bundle size to achieve absolute speed."),
      color: "#ea580c",
    },
    {
      id: 3,
      title: String(values.card3Title ?? "CSS Design Awards"),
      subtitle: String(values.card3Subtitle ?? "Honorable Mention"),
      icon: "🎯",
      description: String(values.card3Desc ?? "Recognizing best UI/UX and visual design practices across developers."),
      color: "#0891b2",
    },
    {
      id: 4,
      title: String(values.card4Title ?? "Creative Direction"),
      subtitle: String(values.card4Subtitle ?? "Most Creative Design"),
      icon: "🎖",
      description: String(values.card4Desc ?? "Innovative layouts, micro-interactions, and premium aesthetics."),
      color: "#7c3aed",
    },
  ];

  const n = cards.length;

  const renderCards = () => {
    return cards.map((card, idx) => {
      const segment = 1 / n;
      const start = idx * segment;
      const end = (idx + 1) * segment;

      let cardOpacity = 1;
      let cardX = 0;
      let cardY = 0;
      let cardScale = 1;
      let cardRotate = 0;
      let zIndex = n - idx;

      if (progress > end) {
        // Exited card
        cardOpacity = 0;
        cardY = -300 * scaleFactor;
        cardRotate = -15;
      } else if (progress > start) {
        // Current card flying out
        const f = (progress - start) / (end - start);
        cardOpacity = 1 - f;
        cardY = -f * 200 * scaleFactor;
        cardScale = 1;
        cardRotate = (idx * -2) + f * -15;
      } else {
        // Stacking card waiting
        // Calculate remaining depth
        const activeIndex = Math.min(n - 1, Math.floor(progress / segment));
        const activeStart = activeIndex * segment;
        const activeEnd = (activeIndex + 1) * segment;
        const activeF = progress > activeStart ? (progress - activeStart) / (activeEnd - activeStart) : 0;

        const depth = (idx - activeIndex) - activeF;

        cardOpacity = Math.max(0.2, 1 - depth * 0.15);
        cardY = depth * 12 * scaleFactor;
        cardScale = 1 - depth * 0.04;
        cardRotate = -depth * 2;
        zIndex = n - idx + 10;
      }

      return (
        <div
          key={card.id}
          style={{
            position: "absolute",
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            borderRadius: `${20 * scaleFactor}px`,
            backgroundColor: card.color,
            color: "#ffffff",
            padding: `${28 * scaleFactor}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            opacity: cardOpacity,
            zIndex,
            transform: `translate3d(${cardX}px, ${cardY}px, 0) scale(${cardScale}) rotate(${cardRotate}deg)`,
            transformOrigin: "bottom center",
            transition: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${16 * scaleFactor}px`,
            }}
          >
            <div
              style={{
                width: `${56 * scaleFactor}px`,
                height: `${56 * scaleFactor}px`,
                borderRadius: `${10 * scaleFactor}px`,
                backgroundColor: "rgba(255,255,255,0.2)",
                fontSize: `${28 * scaleFactor}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.icon}
            </div>
            <div>
              <h4
                style={{
                  fontSize: `${13 * scaleFactor}px`,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255, 255, 255, 0.6)",
                  margin: 0,
                }}
              >
                {card.title}
              </h4>
              <h3
                style={{
                  fontSize: `${24 * scaleFactor}px`,
                  fontWeight: 700,
                  margin: `${4 * scaleFactor}px 0 0 0`,
                }}
              >
                {card.subtitle}
              </h3>
            </div>
          </div>

          <p
            style={{
              fontSize: `${15 * scaleFactor}px`,
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {card.description}
          </p>
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        padding: `${40 * scaleFactor}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: `${40 * scaleFactor}px`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: `${36 * scaleFactor}px`,
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {sectionTitle}
        </h2>
        <p
          style={{
            fontSize: `${16 * scaleFactor}px`,
            color: "rgba(255,255,255,0.4)",
            margin: `${8 * scaleFactor}px 0 0 0`,
          }}
        >
          {sectionSubtitle}
        </p>
      </div>

      <div
        style={{
          position: "relative",
          width: `${cardWidth}px`,
          height: `${cardHeight + 40 * scaleFactor}px`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {renderCards()}
      </div>
    </div>
  );
}

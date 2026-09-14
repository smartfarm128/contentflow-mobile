import type { HtmlTemplateProps } from "../types";

const testimonials = [
  {
    name: "Ava Green",
    username: "@ava",
    body: "Cascade AI made my workflow 10x faster!",
    img: "https://randomuser.me/api/portraits/women/32.jpg",
    country: "🇦🇺 Australia",
  },
  {
    name: "Ana Miller",
    username: "@ana",
    body: "Vertical marquee is a game changer!",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
    country: "🇩🇪 Germany",
  },
  {
    name: "Mateo Rossi",
    username: "@mat",
    body: "Animations are buttery smooth!",
    img: "https://randomuser.me/api/portraits/men/51.jpg",
    country: "🇮🇹 Italy",
  },
  {
    name: "Maya Patel",
    username: "@maya",
    body: "Setup was a breeze!",
    img: "https://randomuser.me/api/portraits/women/53.jpg",
    country: "🇮🇳 India",
  },
  {
    name: "Noah Smith",
    username: "@noah",
    body: "Best marquee component!",
    img: "https://randomuser.me/api/portraits/men/33.jpg",
    country: "🇺🇸 USA",
  },
  {
    name: "Lucas Stone",
    username: "@luc",
    body: "Very customizable and smooth.",
    img: "https://randomuser.me/api/portraits/men/22.jpg",
    country: "🇫🇷 France",
  },
  {
    name: "Haruto Sato",
    username: "@haru",
    body: "Impressive performance on mobile!",
    img: "https://randomuser.me/api/portraits/men/85.jpg",
    country: "🇯🇵 Japan",
  },
  {
    name: "Emma Lee",
    username: "@emma",
    body: "Love the pause on hover feature!",
    img: "https://randomuser.me/api/portraits/women/45.jpg",
    country: "🇨🇦 Canada",
  },
  {
    name: "Carlos Ray",
    username: "@carl",
    body: "Great for testimonials and logos.",
    img: "https://randomuser.me/api/portraits/men/61.jpg",
    country: "🇪🇸 Spain",
  },
];

export function ThreeDTestimonialsTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const speed = Number(values.speed ?? 80.0);
  const cardHeight = Number(values.cardHeight ?? 160);
  const cardWidth = Number(values.cardWidth ?? 240);
  const gap = Number(values.gap ?? 16);

  const angleX = Number(values.perspectiveAngleX ?? 20);
  const angleY = Number(values.perspectiveAngleY ?? -10);
  const angleZ = Number(values.perspectiveAngleZ ?? 20);

  const scale = Math.min(width, height) / 1080;
  const scaledCardWidth = cardWidth * scale;
  const scaledCardHeight = cardHeight * scale;
  const scaledGap = gap * scale;

  // Single set height
  const setHeight = testimonials.length * (scaledCardHeight + scaledGap);

  // Math-driven vertical marquee translations
  const scrollOffsetForward = -(time * speed * scale) % setHeight;
  const scrollOffsetBackward = ((time * speed * scale) % setHeight) - setHeight;

  // Render list of cards for a column
  const renderTestimonialCards = () => {
    // Tripled to ensure container is fully populated during loop wraps
    const tripled = [...testimonials, ...testimonials, ...testimonials];
    return tripled.map((item, idx) => (
      <div
        key={idx}
        style={{
          width: scaledCardWidth,
          height: scaledCardHeight,
          backgroundColor: "#1e293b",
          border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: `${16 * scale}px`,
          padding: `${20 * scale}px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: `0 ${6 * scale}px ${12 * scale}px rgba(0,0,0,0.15)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: `${10 * scale}px` }}>
          <img
            src={item.img}
            alt={item.name}
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: `${14 * scale}px`,
                fontWeight: 600,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: `${4 * scale}px`,
              }}
            >
              {item.name} <span style={{ fontSize: `${10 * scale}px` }}>{item.country.split(" ")[0]}</span>
            </div>
            <div style={{ fontSize: `${12 * scale}px`, color: "#94a3b8" }}>{item.username}</div>
          </div>
        </div>

        <blockquote
          style={{
            fontSize: `${13 * scale}px`,
            color: "#cbd5e1",
            margin: `${12 * scale}px 0 0 0`,
            lineHeight: 1.4,
            fontWeight: 400,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.body}
        </blockquote>
      </div>
    ));
  };

  const transform3d = `translateX(-${100 * scale}px) translateY(0px) translateZ(-${100 * scale}px) rotateX(${angleX}deg) rotateY(${angleY}deg) rotateZ(${angleZ}deg)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        perspective: `${800 * scale}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: `${scaledGap}px`,
          transform: transform3d,
        }}
      >
        {/* Column 1 (Scroll Down) */}
        <div style={{ height: setHeight * 1.5, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${scaledGap}px`,
              transform: `translateY(${scrollOffsetForward}px)`,
            }}
          >
            {renderTestimonialCards()}
          </div>
        </div>

        {/* Column 2 (Scroll Up) */}
        <div style={{ height: setHeight * 1.5, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${scaledGap}px`,
              transform: `translateY(${scrollOffsetBackward}px)`,
            }}
          >
            {renderTestimonialCards()}
          </div>
        </div>

        {/* Column 3 (Scroll Down) */}
        <div style={{ height: setHeight * 1.5, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${scaledGap}px`,
              transform: `translateY(${scrollOffsetForward}px)`,
            }}
          >
            {renderTestimonialCards()}
          </div>
        </div>

        {/* Column 4 (Scroll Up) */}
        <div style={{ height: setHeight * 1.5, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${scaledGap}px`,
              transform: `translateY(${scrollOffsetBackward}px)`,
            }}
          >
            {renderTestimonialCards()}
          </div>
        </div>
      </div>

      {/* Atmospheric Vignette Overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, transparent 20%, #09090b 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "25%",
          background: "linear-gradient(to bottom, #09090b, transparent)",
          pointerEvents: "none",
          zIndex: 11,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "25%",
          background: "linear-gradient(to top, #09090b, transparent)",
          pointerEvents: "none",
          zIndex: 11,
        }}
      />
    </div>
  );
}

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function TestimonialsColumnsTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const title = String(values.title ?? "What our users say");
  const subtitle = String(values.subtitle ?? "See what our customers have to say about us.");
  const scrollSpeed = Number(values.scrollSpeed ?? 8);
  const accentColor = String(values.accentColor ?? "#ffffff");

  const scaleFactor = Math.min(width, height) / 1080;

  // Parse dynamic testimonials list from values
  const testimonials = useMemo(() => [
    {
      text: String(values.quote1 ?? "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely."),
      image: String(values.image1 ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"),
      name: String(values.name1 ?? "Briana Patton"),
      role: String(values.role1 ?? "Operations Manager"),
    },
    {
      text: String(values.quote2 ?? "Implementing this ERP was smooth and quick. The customizable, user-friendly interface made team training effortless."),
      image: String(values.image2 ?? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"),
      name: String(values.name2 ?? "Bilal Ahmed"),
      role: String(values.role2 ?? "IT Manager"),
    },
    {
      text: String(values.quote3 ?? "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction."),
      image: String(values.image3 ?? "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop"),
      name: String(values.name3 ?? "Saman Malik"),
      role: String(values.role3 ?? "Customer Support Lead"),
    },
    {
      text: String(values.quote4 ?? "This ERP's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface."),
      image: String(values.image4 ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"),
      name: String(values.name4 ?? "Omar Raza"),
      role: String(values.role4 ?? "CEO"),
    },
    {
      text: String(values.quote5 ?? "Its robust features and quick support have transformed our workflow, making us significantly more efficient."),
      image: String(values.image5 ?? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop"),
      name: String(values.name5 ?? "Zainab Hussain"),
      role: String(values.role5 ?? "Project Manager"),
    },
    {
      text: String(values.quote6 ?? "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance."),
      image: String(values.image6 ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"),
      name: String(values.name6 ?? "Aliza Khan"),
      role: String(values.role6 ?? "Business Analyst"),
    },
  ], [
    values.quote1, values.image1, values.name1, values.role1,
    values.quote2, values.image2, values.name2, values.role2,
    values.quote3, values.image3, values.name3, values.role3,
    values.quote4, values.image4, values.name4, values.role4,
    values.quote5, values.image5, values.name5, values.role5,
    values.quote6, values.image6, values.name6, values.role6,
  ]);

  const firstColumn = testimonials.slice(0, 2);
  const secondColumn = testimonials.slice(2, 4);
  const thirdColumn = testimonials.slice(4, 6);

  // Scaled dimensions
  const titleSize = Math.max(20, 48 * scaleFactor);
  const subtitleSize = Math.max(12, 20 * scaleFactor);
  const gap = 24 * scaleFactor;
  const padding = 24 * scaleFactor;

  // Custom function to render a vertical scrolling track using time
  const renderColumn = (items: typeof testimonials, speedMultiplier: number) => {
    // 50% loop for seamless infinite scrolling
    const yPercent = -(time * scrollSpeed * speedMultiplier) % 50;

    return (
      <div
        style={{
          width: `${300 * scaleFactor}px`,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${gap}px`,
            transform: `translateY(${yPercent}%)`,
          }}
        >
          {/* Double list for seamless wrapping */}
          {[...items, ...items, ...items, ...items].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: `${padding}px`,
                borderRadius: `${24 * scaleFactor}px`,
                backgroundColor: "#0d0d12",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: `${16 * scaleFactor}px`,
              }}
            >
              <div
                style={{
                  fontSize: `${14 * scaleFactor}px`,
                  lineHeight: 1.5,
                  color: "rgba(255, 255, 255, 0.8)",
                }}
              >
                {item.text}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${12 * scaleFactor}px`,
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: `${40 * scaleFactor}px`,
                    height: `${40 * scaleFactor}px`,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: `${14 * scaleFactor}px`,
                      fontWeight: 600,
                      color: "#ffffff",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: `${12 * scaleFactor}px`,
                      color: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    {item.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030303",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${40 * scaleFactor}px`,
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: `${40 * scaleFactor}px`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-block",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: `${4 * scaleFactor}px ${16 * scaleFactor}px`,
            borderRadius: `${8 * scaleFactor}px`,
            color: accentColor,
            fontSize: `${12 * scaleFactor}px`,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
            marginBottom: `${16 * scaleFactor}px`,
          }}
        >
          Testimonials
        </div>
        <h2
          style={{
            fontSize: `${titleSize}px`,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: `${subtitleSize}px`,
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: `${12 * scaleFactor}px`,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Grid columns */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: `${gap}px`,
          height: `${550 * scaleFactor}px`,
          width: "100%",
          maxHeight: "65vh",
          maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        }}
      >
        {renderColumn(firstColumn, 1.0)}
        {renderColumn(secondColumn, 1.3)}
        {renderColumn(thirdColumn, 1.15)}
      </div>
    </div>
  );
}

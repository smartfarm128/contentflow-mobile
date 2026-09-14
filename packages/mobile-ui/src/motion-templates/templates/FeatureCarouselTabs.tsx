import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import {
  Pizza,
  Command,
  Globe,
  Award,
  Cloud,
  Smartphone,
  LayoutDashboard,
  CheckCircle,
  Sparkles,
} from "lucide-react";

const FEATURES_LIST = [
  {
    id: "sustainable",
    label: "Sustainable Sourcing",
    icon: Pizza,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
    description: "Ethically sourced ingredients from local farmers.",
  },
  {
    id: "community",
    label: "Community Focused",
    icon: Command,
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200",
    description: "Building stronger bonds through shared experiences.",
  },
  {
    id: "global",
    label: "Global Reach",
    icon: Globe,
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200",
    description: "Connecting visionaries across all continents.",
  },
  {
    id: "award",
    label: "Award Winning",
    icon: Award,
    image: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?q=80&w=1200",
    description: "Recognized excellence in design and innovation.",
  },
  {
    id: "cloud",
    label: "Cloud Ready",
    icon: Cloud,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    description: "Scale your infrastructure with seamless ease.",
  },
  {
    id: "mobile",
    label: "Mobile First",
    icon: Smartphone,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200",
    description: "A world-class experience on every single device.",
  },
  {
    id: "analytics",
    label: "Real-time Analytics",
    icon: LayoutDashboard,
    image: "https://images.unsplash.com/photo-1551288049-bbda38a10ad5?q=80&w=1200",
    description: "Insights at your fingertips, updated in real-time.",
  },
  {
    id: "security",
    label: "Enterprise Security",
    icon: CheckCircle,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200",
    description: "Bank-grade security protocols for your data.",
  },
  {
    id: "magic",
    label: "Magic Automations",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200",
    description: "Let AI handle the repetitive tasks for you.",
  },
  {
    id: "local",
    label: "Locally Owned",
    icon: CheckCircle,
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200",
    description: "Supporting local businesses and creators.",
  },
];

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarouselTabsTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Read customized title/descriptions if overridden in editing values
  const customizedFeatures = useMemo(() => {
    return FEATURES_LIST.map((feat, idx) => {
      const labelVal = values[`feat_${idx}_label` as string];
      const descVal = values[`feat_${idx}_desc` as string];
      const imgVal = values[`feat_${idx}_image` as string];
      return {
        ...feat,
        label: labelVal ? String(labelVal) : feat.label,
        description: descVal ? String(descVal) : feat.description,
        image: imgVal ? String(imgVal) : feat.image,
      };
    });
  }, [values]);

  const len = customizedFeatures.length;
  
  // Design scaling relative to 1080p
  const scale = Math.min(width, height) / 1080;
  const itemHeight = Math.max(30, Math.round(65 * scale));

  // Determine continuous virtual active index from progress
  const virtualActive = progress * (len - 1);
  const activeIntIndex = Math.min(len - 1, Math.round(virtualActive));

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
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "90%",
          height: "80%",
          display: "flex",
          flexDirection: "row",
          borderRadius: `${Math.round(40 * scale)}px`,
          border: `${Math.round(1 * scale)}px solid rgba(255, 255, 255, 0.08)`,
          overflow: "hidden",
          backgroundColor: "rgba(10, 15, 30, 0.4)",
        }}
      >
        {/* Left Side: Staggered list chips */}
        <div
          style={{
            width: "40%",
            height: "100%",
            backgroundColor: "#2c6fb8",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: `${Math.round(50 * scale)}px`,
            overflow: "hidden",
          }}
        >
          {/* Top/bottom gradient washes */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: `${Math.round(60 * scale)}px`,
              background: "linear-gradient(to bottom, #2c6fb8 0%, transparent 100%)",
              zIndex: 40,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${Math.round(60 * scale)}px`,
              background: "linear-gradient(to top, #2c6fb8 0%, transparent 100%)",
              zIndex: 40,
            }}
          />

          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            {customizedFeatures.map((feature, index) => {
              const distance = index - virtualActive;
              const wrappedDistance = wrap(-(len / 2), len / 2, distance);
              const isActive = index === activeIntIndex;
              const Icon = feature.icon;

              return (
                <div
                  key={feature.id}
                  style={{
                    position: "absolute",
                    height: `${itemHeight}px`,
                    display: "flex",
                    alignItems: "center",
                    transform: `translateY(${wrappedDistance * itemHeight}px)`,
                    opacity: 1 - Math.abs(wrappedDistance) * 0.28,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: `${Math.round(16 * scale)}px`,
                      padding: `${Math.round(12 * scale)}px ${Math.round(24 * scale)}px`,
                      borderRadius: `${Math.round(100 * scale)}px`,
                      backgroundColor: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#2c6fb8" : "rgba(255,255,255,0.6)",
                      border: `${Math.round(1 * scale)}px solid ${isActive ? "#ffffff" : "rgba(255,255,255,0.15)"}`,
                      fontSize: `${Math.max(10, Math.round(15 * scale))}px`,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <Icon size={Math.max(12, Math.round(18 * scale))} />
                    <span>{feature.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Features image stack */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.01)",
            position: "relative",
            overflow: "hidden",
            borderLeft: `${Math.round(1 * scale)}px solid rgba(255, 255, 255, 0.08)`,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "70%",
              aspectRatio: "4/5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {customizedFeatures.map((feature, index) => {
              const distance = index - virtualActive;
              const wrappedDistance = wrap(-(len / 2), len / 2, distance);
              const absDistance = Math.abs(wrappedDistance);
              const isActive = index === activeIntIndex;

              // Smooth algebraic fanning metrics based on playhead offset
              const xOffset = wrappedDistance * 100 * scale;
              const cardScale = 1 - Math.min(0.3, absDistance * 0.15);
              const opacity = Math.max(0, 1 - absDistance);
              const rotate = wrappedDistance * 3;
              const zIndex = Math.round(20 - absDistance * 10);

              return (
                <div
                  key={feature.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: `${Math.round(24 * scale)}px`,
                    border: `${Math.round(6 * scale)}px solid #ffffff`,
                    overflow: "hidden",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
                    backgroundColor: "#161b26",
                    transform: `translateX(${xOffset}px) scale(${cardScale}) rotate(${rotate}deg)`,
                    opacity,
                    zIndex,
                  }}
                >
                  <img
                    src={feature.image}
                    alt={feature.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: isActive ? "none" : "blur(2px) grayscale(40%)",
                    }}
                  />

                  {/* Gradient label overlay on active card */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "end",
                        padding: `${Math.round(30 * scale)}px`,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#161b26",
                          padding: `${Math.round(4 * scale)}px ${Math.round(12 * scale)}px`,
                          borderRadius: "100px",
                          fontSize: `${Math.max(8, Math.round(11 * scale))}px`,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          width: "fit-content",
                          marginBottom: `${Math.round(12 * scale)}px`,
                        }}
                      >
                        {index + 1} • {feature.label}
                      </div>
                      <p
                        style={{
                          fontSize: `${Math.max(12, Math.round(22 * scale))}px`,
                          color: "white",
                          fontWeight: 500,
                          lineHeight: 1.25,
                          margin: 0,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default FeatureCarouselTabsTemplate;

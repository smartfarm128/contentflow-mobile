import { Star, Bookmark, LayoutTemplate, Palette } from "lucide-react";
import type { HtmlTemplateProps } from "../types";
import { placeholderAvatar, placeholderImage } from "../local-placeholder";

export function FreelancerProfileCardTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const name = String(values.name ?? "Henrie Ekemezie");
  const titleText = String(values.title ?? "Web & UI/UX Designer");
  const avatarSrc = String(values.avatarSrc ?? placeholderAvatar("fitcropq80"));
  const bannerSrc = String(values.bannerSrc ?? placeholderImage("ropq60w900"));
  const rating = Number(values.rating ?? 4.0);
  const duration = String(values.duration ?? "8 Days");
  const rate = String(values.rate ?? "$40/hr");
  const accentColor = String(values.accentColor ?? "#3b82f6");

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 384 * scale;

  // 1. Entrance Animations (determined purely by time)
  const tCard = Math.min(1, Math.max(0, time / 0.6));
  const cardY = 30 * (1 - tCard);
  const cardOpacity = tCard;

  const tName = Math.min(1, Math.max(0, (time - 0.3) / 0.4));
  const nameY = 10 * (1 - tName);
  const nameOpacity = tName;

  const tStats = Math.min(1, Math.max(0, (time - 0.5) / 0.4));
  const statsY = 10 * (1 - tStats);
  const statsOpacity = tStats;

  const tBtn = Math.min(1, Math.max(0, (time - 0.7) / 0.4));
  const btnY = 10 * (1 - tBtn);
  const btnOpacity = tBtn;

  // 2. Slow hover scale / hover cycle
  const hoverProgress = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / 6.0);
  const hoverScale = 1 + hoverProgress * 0.03;

  const avatarName = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}10 0%, transparent 80%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          overflow: "hidden",
          borderRadius: `${24 * scale}px`,
          border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
          background: "rgba(9, 9, 11, 0.95)",
          boxShadow: `0 ${20 * scale}px ${50 * scale}px rgba(0, 0, 0, 0.5)`,
          transform: `scale(${hoverScale}) translateY(${cardY}px)`,
          opacity: cardOpacity,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Banner Image */}
        <div style={{ height: `${128 * scale}px`, width: "100%", overflow: "hidden" }}>
          <img
            src={bannerSrc}
            alt={`${name}'s banner`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Bookmark Button */}
        <button
          style={{
            position: "absolute",
            right: `${16 * scale}px`,
            top: `${16 * scale}px`,
            height: `${36 * scale}px`,
            width: `${36 * scale}px`,
            borderRadius: `${8 * scale}px`,
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Bookmark profile"
        >
          <Bookmark style={{ width: `${16 * scale}px`, height: `${16 * scale}px` }} />
        </button>

        {/* Avatar */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `${128 * scale}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              height: `${80 * scale}px`,
              width: `${80 * scale}px`,
              borderRadius: "50%",
              border: `${4 * scale}px solid rgba(9, 9, 11, 0.95)`,
              overflow: "hidden",
              backgroundColor: "#27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: `${24 * scale}px`, fontWeight: 600, color: "#ffffff" }}>
                {avatarName}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            padding: `${48 * scale}px ${24 * scale}px ${24 * scale}px ${24 * scale}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Name & Title */}
          <div
            style={{
              marginBottom: `${16 * scale}px`,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              transform: `translateY(${nameY}px)`,
              opacity: nameOpacity,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: `${20 * scale}px`,
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                {name}
              </h2>
              <p
                style={{
                  fontSize: `${14 * scale}px`,
                  color: "#94a3b8",
                  margin: `${4 * scale}px 0 0 0`,
                }}
              >
                {titleText}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "end", gap: `${6 * scale}px` }}>
              <div style={{ display: "flex", gap: `${6 * scale}px` }}>
                <div
                  style={{
                    display: "flex",
                    height: `${28 * scale}px`,
                    width: `${28 * scale}px`,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: `${6 * scale}px`,
                    backgroundColor: "#18181b",
                    border: `${1 * scale}px solid rgba(255, 255, 255, 0.08)`,
                    color: "#94a3b8",
                  }}
                >
                  <LayoutTemplate style={{ width: `${14 * scale}px`, height: `${14 * scale}px` }} />
                </div>
                <div
                  style={{
                    display: "flex",
                    height: `${28 * scale}px`,
                    width: `${28 * scale}px`,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: `${6 * scale}px`,
                    backgroundColor: "#18181b",
                    border: `${1 * scale}px solid rgba(255, 255, 255, 0.08)`,
                    color: "#94a3b8",
                  }}
                >
                  <Palette style={{ width: `${14 * scale}px`, height: `${14 * scale}px` }} />
                </div>
              </div>
              <span style={{ fontSize: `${10 * scale}px`, color: "#52525b" }}>Tools</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              margin: `${24 * scale}px 0`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              borderRadius: `${12 * scale}px`,
              border: `${1 * scale}px solid rgba(255, 255, 255, 0.08)`,
              background: "rgba(255, 255, 255, 0.02)",
              padding: `${16 * scale}px`,
              transform: `translateY(${statsY}px)`,
              opacity: statsOpacity,
            }}
          >
            {/* Rating */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: `${4 * scale}px` }}>
                <Star style={{ width: `${16 * scale}px`, height: `${16 * scale}px`, color: "#fbbf24", fill: "#fbbf24" }} />
                <span style={{ fontSize: `${16 * scale}px`, fontWeight: 600, color: "#ffffff" }}>
                  {rating.toFixed(1)}
                </span>
              </div>
              <span style={{ fontSize: `${11 * scale}px`, color: "#71717a", textTransform: "capitalize", marginTop: `${4 * scale}px` }}>
                rating
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: `${1 * scale}px`, height: `${32 * scale}px`, backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

            {/* Duration */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: `${16 * scale}px`, fontWeight: 600, color: "#ffffff" }}>
                {duration}
              </span>
              <span style={{ fontSize: `${11 * scale}px`, color: "#71717a", textTransform: "capitalize", marginTop: `${4 * scale}px` }}>
                duration
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: `${1 * scale}px`, height: `${32 * scale}px`, backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

            {/* Rate */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: `${16 * scale}px`, fontWeight: 600, color: "#ffffff" }}>
                {rate}
              </span>
              <span style={{ fontSize: `${11 * scale}px`, color: "#71717a", textTransform: "capitalize", marginTop: `${4 * scale}px` }}>
                rate
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ transform: `translateY(${btnY}px)`, opacity: btnOpacity }}>
            <button
              style={{
                width: "100%",
                padding: `${16 * scale}px`,
                borderRadius: `${12 * scale}px`,
                backgroundColor: accentColor,
                color: "#ffffff",
                fontSize: `${16 * scale}px`,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: `0 ${4 * scale}px ${12 * scale}px ${accentColor}30`,
              }}
            >
              Get in touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

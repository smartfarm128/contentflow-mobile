import { useEffect, useRef } from "react";
import type { HtmlTemplateProps } from "../types";
import createGlobe from "cobe";

export function CobeGlobeTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  const markerColor = [0.3, 0.45, 0.85] as [number, number, number];
  const baseColor = [0.1, 0.1, 0.2] as [number, number, number];
  const arcColor = [0.3, 0.45, 0.85] as [number, number, number];
  const glowColor = [0.94, 0.93, 0.91] as [number, number, number];

  const markers = [
    { id: "sf", location: [37.7595, -122.4367] as [number, number], label: "San Francisco" },
    { id: "nyc", location: [40.7128, -74.006] as [number, number], label: "New York" },
    { id: "tokyo", location: [35.6762, 139.6503] as [number, number], label: "Tokyo" },
    { id: "london", location: [51.5074, -0.1278] as [number, number], label: "London" },
  ];

  const arcs = [
    {
      id: "sf-tokyo",
      from: [37.7595, -122.4367] as [number, number],
      to: [35.6762, 139.6503] as [number, number],
    },
    {
      id: "nyc-london",
      from: [40.7128, -74.006] as [number, number],
      to: [51.5074, -0.1278] as [number, number],
    },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = Math.min(width, height) * 0.7;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 1,
      width: size,
      height: size,
      phi: progress * Math.PI * 2,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 8.0,
      baseColor,
      markerColor,
      glowColor,
      markerElevation: 0.01,
      markers: markers.map((m) => ({
        location: m.location,
        size: 0.03,
        id: m.id,
      })),
      arcs: arcs.map((a) => ({
        from: a.from,
        to: a.to,
        id: a.id,
      })),
      arcColor,
      arcWidth: 0.5,
      arcHeight: 0.25,
      opacity: 0.8,
    });

    globeRef.current = globe;

    return () => {
      globe.destroy();
      globeRef.current = null;
    };
  }, []);

  // Update globe orientation deterministically as progress and size changes
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const size = Math.min(width, height) * 0.7;

    globe.update({
      width: size,
      height: size,
      phi: progress * Math.PI * 2,
      theta: 0.25,
      markers: markers.map((m) => ({
        location: m.location,
        size: 0.03,
        id: m.id,
      })),
      arcs: arcs.map((a) => ({
        from: a.from,
        to: a.to,
        id: a.id,
      })),
    });
  }, [progress, width, height]);

  const scale = Math.min(width, height) / 1080;
  const fontSize = Math.max(16, 48 * scale * 2.2);

  const title = String(values.title ?? "Global Network");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Title */}
      <h2
        style={{
          position: "absolute",
          top: "10%",
          fontSize: `${fontSize}px`,
          color: "#fff",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          zIndex: 10,
          textTransform: "uppercase",
          textShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        {title}
      </h2>

      {/* Canvas Wrapper */}
      <div
        style={{
          width: `${Math.min(width, height) * 0.7}px`,
          height: `${Math.min(width, height) * 0.7}px`,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 50px rgba(59, 130, 246, 0.15)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

export default CobeGlobeTemplate;

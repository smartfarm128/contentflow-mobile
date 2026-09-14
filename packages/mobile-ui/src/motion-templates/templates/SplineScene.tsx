import { useEffect, useRef, useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function SplineSceneTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read control values
  const titleText = String(values.title ?? "Interactive 3D");
  const descriptionText = String(
    values.description ??
      "Bring your UI to life with beautiful 3D scenes. Create immersive experiences."
  );
  const accentColor = String(values.accentColor ?? "#00e8ed");
  const spotlightColor = String(values.spotlightColor ?? "#ffffff");
  const meshType = String(values.meshType ?? "sphere");
  const rotationSpeed = Number(values.rotationSpeed ?? 1.0);

  // Scale calculations
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Let's pre-generate the 3D vertices based on mesh type
  const vertices = useMemo(() => {
    const list: { x: number; y: number; z: number }[] = [];
    const radius = 180 * scaleFactor;

    if (meshType === "torus") {
      const ringCount = 16;
      const pipeCount = 12;
      const R = 130 * scaleFactor;
      const r = 50 * scaleFactor;

      for (let i = 0; i < ringCount; i++) {
        const u = (i * 2 * Math.PI) / ringCount;
        for (let j = 0; j < pipeCount; j++) {
          const v = (j * 2 * Math.PI) / pipeCount;
          const x = (R + r * Math.cos(v)) * Math.cos(u);
          const y = (R + r * Math.cos(v)) * Math.sin(u);
          const z = r * Math.sin(v);
          list.push({ x, y, z });
        }
      }
    } else if (meshType === "cube") {
      // Dodecahedron or Hypercube/Cube vertices
      const size = 130 * scaleFactor;
      const temp = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ];
      for (const [x, y, z] of temp) {
        list.push({ x: x * size, y: y * size, z: z * size });
      }
    } else {
      // Default: Sphere
      const rings = 12;
      const segments = 16;
      for (let i = 0; i <= rings; i++) {
        const theta = (i * Math.PI) / rings;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let j = 0; j < segments; j++) {
          const phi = (j * 2 * Math.PI) / segments;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
          const x = radius * cosPhi * sinTheta;
          const y = radius * cosTheta;
          const z = radius * sinPhi * sinTheta;
          list.push({ x, y, z });
        }
      }
    }

    return list;
  }, [meshType, scaleFactor]);

  // Drawing is done on canvas on time/value updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with transparent bg, since layout has radial gradient bg
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const angleY = time * 0.4 * rotationSpeed;
    const angleX = time * 0.25 * rotationSpeed;
    const angleZ = time * 0.15 * rotationSpeed;

    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);

    const projected = vertices.map((v) => {
      // Rotate Y
      let x1 = v.x * cosY - v.z * sinY;
      let z1 = v.x * sinY + v.z * cosY;

      // Rotate X
      let y2 = v.y * cosX - z1 * sinX;
      let z2 = v.y * sinX + z1 * cosX;

      // Rotate Z
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;

      // Perspective Projection
      const dist = 500 * scaleFactor;
      const projScale = dist / (dist + z2);
      const px = cx + x3 * projScale;
      const py = cy + y3 * projScale;

      return { px, py, z: z2 };
    });

    // Draw mesh connections
    ctx.lineWidth = 1 * scaleFactor;

    if (meshType === "torus") {
      const ringCount = 16;
      const pipeCount = 12;
      ctx.strokeStyle = `${accentColor}33`;

      for (let i = 0; i < ringCount; i++) {
        const nextI = (i + 1) % ringCount;
        for (let j = 0; j < pipeCount; j++) {
          const nextJ = (j + 1) % pipeCount;
          const p1 = projected[i * pipeCount + j];
          const p2 = projected[i * pipeCount + nextJ];
          const p3 = projected[nextI * pipeCount + j];

          // Draw pipe ring line
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();

          // Draw torus main ring connection
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p3.px, p3.py);
          ctx.stroke();
        }
      }
    } else if (meshType === "cube") {
      ctx.strokeStyle = `${accentColor}44`;
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Back face
        [4, 5], [5, 6], [6, 7], [7, 4], // Front face
        [0, 4], [1, 5], [2, 6], [3, 7]  // Connectors
      ];
      for (const [e1, e2] of edges) {
        const p1 = projected[e1];
        const p2 = projected[e2];
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
    } else {
      // Sphere
      const rings = 12;
      const segments = 16;

      // Draw rings
      for (let i = 0; i <= rings; i++) {
        ctx.beginPath();
        for (let j = 0; j <= segments; j++) {
          const idx = i * segments + (j % segments);
          const p = projected[idx];
          if (!p) continue;
          if (j === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.strokeStyle = `${accentColor}18`;
        ctx.stroke();
      }

      // Draw segments
      for (let j = 0; j < segments; j++) {
        ctx.beginPath();
        for (let i = 0; i <= rings; i++) {
          const idx = i * segments + j;
          const p = projected[idx];
          if (!p) continue;
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.strokeStyle = `${accentColor}18`;
        ctx.stroke();
      }
    }

    // Draw vertex dots with depth shading (closer dots are brighter/larger)
    projected.forEach((p) => {
      // z coordinates range roughly from -radius to +radius
      const radius = 180 * scaleFactor;
      const depthRatio = 1.0 - (p.z + radius) / (2 * radius); // 0 to 1 range (1 is closest, 0 is furthest)
      
      const size = Math.max(1, (2 + depthRatio * 4.5) * scaleFactor);
      const opacity = 0.2 + depthRatio * 0.8;

      ctx.beginPath();
      ctx.arc(p.px, p.py, size, 0, 2 * Math.PI);
      ctx.fillStyle = `${accentColor}`;
      ctx.globalAlpha = opacity;
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
  }, [vertices, time, scaleFactor, accentColor, meshType, rotationSpeed]);

  // Scaled dimensions
  const leftPadding = 80 * scaleFactor;
  const titleSize = 64 * scaleFactor;
  const descSize = 24 * scaleFactor;
  const maxContentWidth = 560 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        backgroundImage: "radial-gradient(circle at 75% 50%, #031525 0%, #000000 100%)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Spotlight Glow Background */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "20%",
          width: `${600 * scaleFactor}px`,
          height: `${600 * scaleFactor}px`,
          background: `radial-gradient(circle, ${spotlightColor}10 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Content Section (Left) */}
      <div
        style={{
          flex: 1.2,
          paddingLeft: `${leftPadding}px`,
          paddingRight: `${30 * scaleFactor}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: `${titleSize}px`,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.15,
            color: "#ffffff",
            background: "linear-gradient(to bottom, #ffffff 0%, #a3a3a3 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em",
          }}
        >
          {titleText}
        </h1>
        <p
          style={{
            fontSize: `${descSize}px`,
            color: "#cbd5e1",
            marginTop: `${20 * scaleFactor}px`,
            lineHeight: 1.5,
            maxWidth: `${maxContentWidth}px`,
          }}
        >
          {descriptionText}
        </p>
      </div>

      {/* 3D Canvas Section (Right) */}
      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Glow behind mesh */}
        <div
          style={{
            position: "absolute",
            width: `${300 * scaleFactor}px`,
            height: `${300 * scaleFactor}px`,
            background: `radial-gradient(circle, ${accentColor}18 0%, transparent 75%)`,
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <canvas
          ref={canvasRef}
          width={600 * scaleFactor}
          height={600 * scaleFactor}
          style={{
            width: `${600 * scaleFactor}px`,
            height: `${600 * scaleFactor}px`,
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
}

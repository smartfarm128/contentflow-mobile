import { useEffect, useRef } from "react";
import type { HtmlTemplateProps } from "../types";
import * as THREE from "three";

export function MatrixShaderTemplate({ progress, time, width, height, values }: HtmlTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: {
      iTime: { value: number };
      iResolution: { value: THREE.Vector2 };
      iMouse: { value: THREE.Vector2 };
      uColorStart: { value: THREE.Color };
      uColorEnd: { value: THREE.Color };
      uGridSize: { value: number };
    };
  } | null>(null);

  // Read control values
  const title = String(values.title ?? "Celestial Matrix");
  const subtitle = String(values.subtitle ?? "An Interactive WebGL Shader");
  const textColor = String(values.textColor ?? "#ffffff");

  const colorStartHex = String(values.colorStart ?? "#1a5fb4"); // deep blue
  const colorEndHex = String(values.colorEnd ?? "#2ec27e");   // emerald green
  const gridSize = Number(values.gridSize ?? 30.0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Renderer, Scene, Camera
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 2) GLSL Shaders
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform vec3 uColorStart;
      uniform vec3 uColorEnd;
      uniform float uGridSize;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        // normalize coords by height
        vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
        vec2 mouse = (iMouse * 2.0 - iResolution) / iResolution.y;

        float dist = length(uv - mouse);
        float warp = smoothstep(0.5, 0.0, dist);
        uv += normalize(uv - mouse) * warp * 0.2;

        float gridSize = uGridSize;
        vec2 gridUv = fract(uv * gridSize);
        vec2 gridId = floor(uv * gridSize);

        float t = iTime * 2.0;
        float rainSpeed = 0.5;
        float fall = fract(gridId.y * 0.1 - t * rainSpeed + random(gridId.xx) * 2.0);

        float character = random(gridId + floor(t * 5.0 * random(gridId.yx)));
        character = step(0.95, character);

        float glow = 1.0 - smoothstep(0.0, 0.8, gridUv.y);
        float intensity = character * glow * fall;

        vec3 finalColor = mix(uColorStart, uColorEnd, random(gridId)) * intensity;
        finalColor *= (1.0 - random(gridId + t) * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // 3) Uniforms, Material, Mesh
    const uniforms = {
      iTime:       { value: 0 },
      iResolution: { value: new THREE.Vector2(width, height) },
      iMouse:      { value: new THREE.Vector2(width / 2, height / 2) },
      uColorStart: { value: new THREE.Color(colorStartHex) },
      uColorEnd:   { value: new THREE.Color(colorEndHex) },
      uGridSize:   { value: gridSize }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms
    };

    // Render initial frame
    renderer.render(scene, camera);

    return () => {
      if (sceneRef.current) {
        if (container && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Update resolution when width or height changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.renderer.setSize(width, height);
    ctx.uniforms.iResolution.value.set(width, height);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [width, height]);

  // Update shader custom values dynamic controls
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.uniforms.uColorStart.value.set(colorStartHex);
    ctx.uniforms.uColorEnd.value.set(colorEndHex);
    ctx.uniforms.uGridSize.value = gridSize;
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [colorStartHex, colorEndHex, gridSize]);

  // Update playhead time & mouse position
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    ctx.uniforms.iTime.value = time;

    // Orbit mouse dynamically based on timeline progress
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const angle = progress * Math.PI * 2;
    const mouseX = centerX + radius * Math.cos(angle);
    const mouseY = centerY + radius * Math.sin(angle);
    ctx.uniforms.iMouse.value.set(mouseX, mouseY);

    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [time, progress, width, height]);

  // Calculate typography scales
  const scaleFactor = Math.min(width, height) / 1080;
  const titleFontSize = Math.max(24, 72 * scaleFactor);
  const descFontSize = Math.max(12, 24 * scaleFactor);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: `${12 * scaleFactor}px`,
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        {title && (
          <h1
            style={{
              fontSize: `${titleFontSize}px`,
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: textColor,
              textTransform: "uppercase",
              margin: 0,
              textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </h1>
        )}

        {subtitle && (
          <p
            style={{
              fontSize: `${descFontSize}px`,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.6)",
              margin: 0,
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default MatrixShaderTemplate;

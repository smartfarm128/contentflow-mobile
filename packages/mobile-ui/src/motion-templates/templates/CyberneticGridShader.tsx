import { useEffect, useRef } from "react";
import type { HtmlTemplateProps } from "../types";
import * as THREE from "three";

export function CyberneticGridShaderTemplate({ progress, time, width, height, values }: HtmlTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: {
      iTime: { value: number };
      iResolution: { value: THREE.Vector2 };
      iMouse: { value: THREE.Vector2 };
    };
  } | null>(null);

  const label = String(values.text ?? "Cybernetic Grid");
  const color = String(values.textColor ?? "#00D2FF");

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

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233)))
                     * 43758.5453123);
      }

      void main() {
        // normalize coords around center
        vec2 uv    = (gl_FragCoord.xy - 0.5 * iResolution.xy)
                     / iResolution.y;
        vec2 mouse = (iMouse - 0.5 * iResolution.xy)
                     / iResolution.y;

        float t         = iTime * 0.2;
        float mouseDist = length(uv - mouse);

        // warp effect around mouse
        float warp = sin(mouseDist * 20.0 - t * 4.0) * 0.1;
        warp *= smoothstep(0.4, 0.0, mouseDist);
        uv += warp;

        // grid lines
        vec2 gridUv = abs(fract(uv * 10.0) - 0.5);
        float line  = pow(1.0 - min(gridUv.x, gridUv.y), 50.0);

        // base grid color pulsing
        vec3 gridColor = vec3(0.1, 0.5, 1.0);
        vec3 color     = gridColor
                       * line
                       * (0.5 + sin(t * 2.0) * 0.2);

        // energetic pulses along grid
        float energy = sin(uv.x * 20.0 + t * 5.0)
                     * sin(uv.y * 20.0 + t * 3.0);
        energy = smoothstep(0.8, 1.0, energy);
        color += vec3(1.0, 0.2, 0.8) * energy * line;

        // glow around mouse
        float glow = smoothstep(0.1, 0.0, mouseDist);
        color += vec3(1.0) * glow * 0.5;

        // subtle noise
        color += random(uv + t * 0.1) * 0.05;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 3) Uniforms, Material, Mesh
    const uniforms = {
      iTime:       { value: 0 },
      iResolution: { value: new THREE.Vector2(width, height) },
      iMouse:      { value: new THREE.Vector2(width / 2, height / 2) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh     = new THREE.Mesh(geometry, material);
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
        if (container && renderer.domElement) {
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

  // Update values and redraw frame
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    // Set time
    ctx.uniforms.iTime.value = time;

    // Simulate mouse path in a circle over progress
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    const angle = progress * Math.PI * 2;
    const mouseX = centerX + radius * Math.cos(angle);
    const mouseY = centerY + radius * Math.sin(angle);
    ctx.uniforms.iMouse.value.set(mouseX, mouseY);

    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [time, progress, width, height]);

  const scaleFactor = Math.min(width, height) / 1080;
  const fontSize = Math.max(16, 72 * scaleFactor * 2.2);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000",
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

      {label && (
        <span
          style={{
            position: "absolute",
            pointerEvents: "none",
            zIndex: 10,
            textAlign: "center",
            fontSize: `${fontSize}px`,
            lineHeight: 1.0,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            whiteSpace: "pre-wrap",
            color: color,
            textShadow: "0 0 20px rgba(0,210,255,0.4), 0 4px 12px rgba(0,0,0,0.8)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default CyberneticGridShaderTemplate;

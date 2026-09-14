import { useEffect, useRef } from "react";
import type { HtmlTemplateProps } from "../types";
import * as THREE from "three";

export function ShaderAnimationTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: {
      time: { type: string; value: number };
      resolution: { type: string; value: THREE.Vector2 };
    };
  } | null>(null);

  const label = String(values.text ?? "Shader Animation");
  const color = String(values.textColor ?? "#ffffff");

  // Initialize ThreeJS scene once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        
        gl_FragColor = vec4(color[0],color[1],color[2],1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { type: "f", value: 0.0 },
      resolution: { type: "v2", value: new THREE.Vector2(width, height) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);

    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
    };

    // Clean up
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
    ctx.uniforms.resolution.value.set(width, height);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [width, height]);

  // Update time when time changes and render a single frame
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    // Map time to match original component's speed increment (it did uniforms.time.value += 0.05 per frame).
    // Usually 60fps, so time * 60 * 0.05 = time * 3.0
    ctx.uniforms.time.value = time * 3.0;
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [time]);

  // Calculate scaled fonts for overlay
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const fontSize = Math.max(16, 72 * scaleFactor * 2.2);

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
            fontWeight: 600,
            letterSpacing: "-0.05em",
            whiteSpace: "pre-wrap",
            color: color,
            textShadow: "0 4px 12px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

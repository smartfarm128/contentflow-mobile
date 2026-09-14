import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HtmlTemplateProps } from "../types";

export function DottedSurfaceTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
    points: THREE.Points;
  } | null>(null);

  const themeMode = String(values.theme ?? "dark");
  const title = String(values.title ?? "Dotted Surface");
  const dotSize = Number(values.dotSize ?? 8);

  const AMOUNTX = 40;
  const AMOUNTY = 60;
  const SEPARATION = 150;

  // Initialize Three.js scene once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      1,
      10000
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);
    renderer.setClearColor(scene.fog.color, 0);

    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];

    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        if (themeMode === 'dark') {
          colors.push(200, 200, 200);
        } else {
          colors.push(0, 0, 0);
        }
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: dotSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      geometry,
      material,
      points,
    };

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
  }, [themeMode]);

  // Update size/aspect ratio when width or height changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.camera.aspect = width / height;
    ctx.camera.updateProjectionMatrix();
    ctx.renderer.setSize(width, height);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [width, height]);

  // Update dot size when control changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.material.size = dotSize;
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [dotSize]);

  // Update animation state when time updates
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    const positionAttribute = ctx.geometry.attributes.position;
    const positions = positionAttribute.array as Float32Array;

    // Increments by 0.1 at 60fps -> count = time * 6.0
    const count = time * 6.0;

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const index = i * 3;
        positions[index + 1] =
          Math.sin((ix + count) * 0.3) * 50 +
          Math.sin((iy + count) * 0.5) * 50;
        i++;
      }
    }

    positionAttribute.needsUpdate = true;
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
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: themeMode === "dark" ? "#000000" : "#ffffff",
      }}
    >
      {/* Canvas container */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Decorative gradient overlay */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: "-10%",
          left: "50%",
          width: "100%",
          height: "100%",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          backgroundImage: themeMode === "dark" 
            ? "radial-gradient(ellipse at center, rgba(255,255,255,0.05), transparent 60%)"
            : "radial-gradient(ellipse at center, rgba(0,0,0,0.03), transparent 60%)",
          filter: "blur(30px)",
        }}
      />

      {/* Title */}
      {title && (
        <h1
          style={{
            position: "relative",
            zIndex: 10,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: themeMode === "dark" ? "#ffffff" : "#000000",
            margin: 0,
            textShadow: themeMode === "dark" 
              ? "0 4px 12px rgba(0,0,0,0.8)"
              : "0 4px 12px rgba(255,255,255,0.8)",
          }}
        >
          {title}
        </h1>
      )}
    </div>
  );
}

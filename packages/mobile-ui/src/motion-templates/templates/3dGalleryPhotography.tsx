"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HtmlTemplateProps } from "../types";

export function ThreeDGalleryPhotographyTemplate({
  time,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const title = String(values.title || "Gallery");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;

    const vertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 2.0 + uTime * 2.0) * 0.2;
        pos.z += cos(pos.y * 2.0 + uTime * 1.5) * 0.15;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec3 col = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0.0, 2.0, 4.0));
        gl_FragColor = vec4(col, 0.9);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
    materialRef.current = mat;

    const geo = new THREE.PlaneGeometry(5, 3.5, 32, 32);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    return () => {
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      scene.clear();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      materialRef.current = null;
    };
  }, [width, height]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const mat = materialRef.current;
    if (!renderer || !scene || !camera || !mat) return;

    mat.uniforms.uTime.value = time;
    renderer.render(scene, camera);
  }, [time]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          color: "white",
          fontSize: "24px",
          fontWeight: "bold",
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {title}
      </div>
    </div>
  );
}

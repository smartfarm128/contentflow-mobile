"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HtmlTemplateProps } from "../types";

export function ThreeDOrbitGalleryTemplate({
  time,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  const accentColor = String(values.accentColor || "#00f2fe");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 24);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;

    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Particles
    const PARTICLE_COUNT = 200;
    const SPHERE_RADIUS = 8;
    const color = new THREE.Color(accentColor);
    const sphereGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const sphereMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      const r = SPHERE_RADIUS + (Math.random() - 0.5) * 1.5;

      const pMesh = new THREE.Mesh(sphereGeo, sphereMat);
      pMesh.position.set(
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
      );
      group.add(pMesh);
    }

    // Orbiting cards
    const CARD_COUNT = 12;
    const planeGeo = new THREE.PlaneGeometry(1.6, 1.6);
    for (let i = 0; i < CARD_COUNT; i++) {
      const angle = (i / CARD_COUNT) * Math.PI * 2;
      const x = SPHERE_RADIUS * Math.cos(angle);
      const y = Math.sin(i * 1.5) * 1.2;
      const z = SPHERE_RADIUS * Math.sin(angle);

      const cardMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(i / CARD_COUNT, 0.8, 0.55),
        side: THREE.DoubleSide,
      });

      const card = new THREE.Mesh(planeGeo, cardMat);
      card.position.set(x, y, z);
      card.lookAt(0, 0, 0);
      group.add(card);
    }

    return () => {
      renderer.dispose();
      scene.clear();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      groupRef.current = null;
    };
  }, [width, height, accentColor]);

  // Deterministic render on playhead time change
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const group = groupRef.current;
    if (!renderer || !scene || !camera || !group) return;

    group.rotation.y = time * 0.25;
    group.rotation.x = time * 0.08;

    renderer.render(scene, camera);
  }, [time]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}

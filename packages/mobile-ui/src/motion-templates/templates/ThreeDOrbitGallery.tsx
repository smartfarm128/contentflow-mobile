/// <reference types="@react-three/fiber" />
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { HtmlTemplateProps } from "../types";

function OrbitingGroup({ time, accentColor }: { time: number; accentColor: string }) {
  const PARTICLE_COUNT = 300; // Keep it lightweight for clean web editor execution
  const SPHERE_RADIUS = 9;
  const POSITION_RANDOMNESS = 2;
  const IMAGE_COUNT = 16;
  const IMAGE_SIZE = 1.5;

  const particles = useMemo(() => {
    const arr = [];
    const color = new THREE.Color(accentColor);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      const radiusVariation = SPHERE_RADIUS + (Math.random() - 0.5) * POSITION_RANDOMNESS;

      const x = radiusVariation * Math.cos(theta) * Math.sin(phi);
      const y = radiusVariation * Math.cos(phi);
      const z = radiusVariation * Math.sin(theta) * Math.sin(phi);

      arr.push({
        position: [x, y, z] as [number, number, number],
        scale: 0.03 + Math.random() * 0.04,
        color: color.clone().multiplyScalar(0.6 + Math.random() * 0.4)
      });
    }
    return arr;
  }, [PARTICLE_COUNT, SPHERE_RADIUS, POSITION_RANDOMNESS, accentColor]);

  const orbitingBoxes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < IMAGE_COUNT; i++) {
      const angle = (i / IMAGE_COUNT) * Math.PI * 2;
      const x = SPHERE_RADIUS * Math.cos(angle);
      const y = Math.sin(i * 1.5) * 1.0; 
      const z = SPHERE_RADIUS * Math.sin(angle);

      const position = new THREE.Vector3(x, y, z);
      const center = new THREE.Vector3(0, 0, 0);
      const outwardDirection = position.clone().sub(center).normalize();

      const euler = new THREE.Euler();
      const matrix = new THREE.Matrix4();
      matrix.lookAt(position, position.clone().add(outwardDirection), new THREE.Vector3(0, 1, 0));
      euler.setFromRotationMatrix(matrix);
      euler.z += Math.PI;

      arr.push({
        position: [x, y, z] as [number, number, number],
        rotation: [euler.x, euler.y, euler.z] as [number, number, number],
        color: new THREE.Color().setHSL((i / IMAGE_COUNT), 0.8, 0.5)
      });
    }
    return arr;
  }, [IMAGE_COUNT, SPHERE_RADIUS]);

  // Deterministic rotation based on timeline playhead time
  const groupRotationY = time * 0.2;
  const groupRotationX = time * 0.05;

  return (
    <group rotation={[groupRotationX, groupRotationY, 0]}>
      {/* Glow Particles */}
      {particles.map((p, idx) => (
        <mesh key={`p-${idx}`} position={p.position} scale={p.scale}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Orbiting Gallery Items */}
      {orbitingBoxes.map((box, idx) => (
        <mesh key={`b-${idx}`} position={box.position} rotation={box.rotation}>
          <planeGeometry args={[IMAGE_SIZE, IMAGE_SIZE]} />
          <meshBasicMaterial color={box.color} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function ThreeDOrbitGalleryTemplate({ time, values }: HtmlTemplateProps) {
  const accentColor = String(values.accentColor ?? "#ffaa00");
  const backgroundColor = String(values.backgroundColor ?? "#000000");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        overflow: "hidden"
      }}
    >
      <Canvas camera={{ position: [-10, 2, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <OrbitingGroup time={time} accentColor={accentColor} />
      </Canvas>
    </div>
  );
}

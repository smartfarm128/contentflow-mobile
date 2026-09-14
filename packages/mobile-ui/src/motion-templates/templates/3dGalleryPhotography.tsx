/// <reference types="@react-three/fiber" />
import { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

interface FadeSettings {
  fadeIn: {
    start: number;
    end: number;
  };
  fadeOut: {
    start: number;
    end: number;
  };
}

interface BlurSettings {
  blurIn: {
    start: number;
    end: number;
  };
  blurOut: {
    start: number;
    end: number;
  };
  maxBlur: number;
}

const DEFAULT_DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;

const createClothMaterial = () => {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        float curveIntensity = scrollForce * 0.3;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;
        
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;
        
        float flagWave = sin(pos.x * 3.0 + time * 8.0) * 0.05 * smoothstep(-0.5, 0.5, pos.x);
        
        pos.z -= (curve + clothEffect + flagWave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vec4 color = texture2D(map, vUv);
        
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  });
};

function ImagePlane({
  texture,
  position,
  scale,
  material,
  time,
  scrollForce,
  opacity,
  blurAmount,
}: {
  texture: THREE.Texture;
  position: [number, number, number];
  scale: [number, number, number];
  material: THREE.ShaderMaterial;
  time: number;
  scrollForce: number;
  opacity: number;
  blurAmount: number;
}) {
  if (material) {
    if (texture) material.uniforms.map.value = texture;
    material.uniforms.time.value = time;
    material.uniforms.scrollForce.value = scrollForce;
    material.uniforms.opacity.value = opacity;
    material.uniforms.blurAmount.value = blurAmount;
  }

  return (
    <mesh position={position} scale={scale} material={material}>
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  );
}

function GalleryScene({
  images,
  progress,
  time,
  visibleCount = 8,
  fadeSettings,
  blurSettings,
}: {
  images: { src: string; alt: string }[];
  progress: number;
  time: number;
  visibleCount?: number;
  fadeSettings: FadeSettings;
  blurSettings: BlurSettings;
}) {
  const textures = useTexture(images.map((img) => img.src));

  const materials = useMemo(
    () => Array.from({ length: visibleCount }, () => createClothMaterial()),
    [visibleCount]
  );

  const spatialPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const maxHorizontalOffset = MAX_HORIZONTAL_OFFSET;
    const maxVerticalOffset = MAX_VERTICAL_OFFSET;

    for (let i = 0; i < visibleCount; i++) {
      const horizontalAngle = (i * 2.618) % (Math.PI * 2);
      const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);

      const horizontalRadius = (i % 3) * 1.2;
      const verticalRadius = ((i + 1) % 4) * 0.8;

      const x = (Math.sin(horizontalAngle) * horizontalRadius * maxHorizontalOffset) / 3;
      const y = (Math.cos(verticalAngle) * verticalRadius * maxVerticalOffset) / 4;

      positions.push({ x, y });
    }

    return positions;
  }, [visibleCount]);

  const totalImages = images.length;
  const depthRange = DEFAULT_DEPTH_RANGE;

  const scrollZ = progress * depthRange * 2;
  const scrollForce = 0.5 + Math.sin(progress * Math.PI) * 0.5;

  return (
    <>
      {Array.from({ length: visibleCount }).map((_, i) => {
        const initialZ = (depthRange / visibleCount) * i;
        const rawZ = initialZ + scrollZ;
        const wraps = Math.floor(rawZ / depthRange);
        const z = rawZ % depthRange;

        const x = spatialPositions[i]?.x ?? 0;
        const y = spatialPositions[i]?.y ?? 0;

        const imageIndex = totalImages > 0 ? (i + wraps * visibleCount) % totalImages : 0;
        const texture = textures[imageIndex];
        const material = materials[i];

        if (!texture || !material) return null;

        const worldZ = z - depthRange / 2;

        const img = texture.image as HTMLImageElement | undefined;
        const aspect = img ? img.width / img.height : 1;
        const scale: [number, number, number] =
          aspect > 1 ? [2 * aspect, 2, 1] : [2, 2 / aspect, 1];

        const normalizedPosition = z / depthRange;
        let opacity = 1;

        if (
          normalizedPosition >= fadeSettings.fadeIn.start &&
          normalizedPosition <= fadeSettings.fadeIn.end
        ) {
          const fadeInProgress =
            (normalizedPosition - fadeSettings.fadeIn.start) /
            (fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
          opacity = fadeInProgress;
        } else if (normalizedPosition < fadeSettings.fadeIn.start) {
          opacity = 0;
        } else if (
          normalizedPosition >= fadeSettings.fadeOut.start &&
          normalizedPosition <= fadeSettings.fadeOut.end
        ) {
          const fadeOutProgress =
            (normalizedPosition - fadeSettings.fadeOut.start) /
            (fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
          opacity = 1 - fadeOutProgress;
        } else if (normalizedPosition > fadeSettings.fadeOut.end) {
          opacity = 0;
        }
        opacity = Math.max(0, Math.min(1, opacity));

        let blur = 0;
        if (
          normalizedPosition >= blurSettings.blurIn.start &&
          normalizedPosition <= blurSettings.blurIn.end
        ) {
          const blurInProgress =
            (normalizedPosition - blurSettings.blurIn.start) /
            (blurSettings.blurIn.end - blurSettings.blurIn.start);
          blur = blurSettings.maxBlur * (1 - blurInProgress);
        } else if (normalizedPosition < blurSettings.blurIn.start) {
          blur = blurSettings.maxBlur;
        } else if (
          normalizedPosition >= blurSettings.blurOut.start &&
          normalizedPosition <= blurSettings.blurOut.end
        ) {
          const blurOutProgress =
            (normalizedPosition - blurSettings.blurOut.start) /
            (blurSettings.blurOut.end - blurSettings.blurOut.start);
          blur = blurSettings.maxBlur * blurOutProgress;
        } else if (normalizedPosition > blurSettings.blurOut.end) {
          blur = blurSettings.maxBlur;
        }
        blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

        return (
          <ImagePlane
            key={i}
            texture={texture}
            position={[x, y, worldZ]}
            scale={scale}
            material={material}
            time={time}
            scrollForce={scrollForce}
            opacity={opacity}
            blurAmount={blur}
          />
        );
      })}
    </>
  );
}

function FallbackGallery({ images }: { images: { src: string; alt: string }[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-4">
      <p className="text-gray-400 mb-4 font-sans text-sm">WebGL not supported. Showing images:</p>
      <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src || "/placeholder.svg"}
            alt={img.alt}
            className="w-full h-32 object-cover rounded border border-white/10"
          />
        ))}
      </div>
    </div>
  );
}

export function ThreeDGalleryPhotographyTemplate({ progress, time, width: _width, height: _height, values }: HtmlTemplateProps) {
  const [webglSupported, setWebglSupported] = useState(true);

  const images = useMemo(() => [
    {
      src: String(values.image1 ?? placeholderImage("fitcropq60")),
      alt: "Photo 1",
    },
    {
      src: String(values.image2 ?? placeholderImage("fitcropq60")),
      alt: "Photo 2",
    },
    {
      src: String(values.image3 ?? placeholderImage("fitcropq60")),
      alt: "Photo 3",
    },
    {
      src: String(values.image4 ?? placeholderImage("fitcropq60")),
      alt: "Photo 4",
    },
    {
      src: String(values.image5 ?? placeholderImage("fitcropq60")),
      alt: "Photo 5",
    },
  ], [values]);

  const fadeSettings: FadeSettings = useMemo(() => ({
    fadeIn: { start: 0.05, end: 0.25 },
    fadeOut: { start: 0.4, end: 0.43 },
  }), []);

  const blurSettings: BlurSettings = useMemo(() => ({
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.4, end: 0.43 },
    maxBlur: 8.0,
  }), []);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <FallbackGallery images={images} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0e12",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <GalleryScene
          images={images}
          progress={progress}
          time={time}
          fadeSettings={fadeSettings}
          blurSettings={blurSettings}
        />
      </Canvas>
    </div>
  );
}

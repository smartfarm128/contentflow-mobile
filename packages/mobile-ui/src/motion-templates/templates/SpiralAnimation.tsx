import { useEffect, useRef, useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Seeded random number generator
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

class Vector2D {
  constructor(public x: number, public y: number) {}
}

class Vector3D {
  constructor(public x: number, public y: number, public z: number) {}
}

interface DeterministicStar {
  angle: number;
  distance: number;
  rotationDirection: number;
  expansionRate: number;
  finalScale: number;
  dx: number;
  dy: number;
  spiralLocation: number;
  z: number;
  strokeWeightFactor: number;
}

export function SpiralAnimationTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const numberOfStars = Math.min(5000, Number(values.numberOfStars ?? 3000));
  const speedScale = Number(values.speedScale ?? 1.0);
  const starColor = String(values.starColor ?? "#ffffff");
  const trailColor = String(values.trailColor ?? "#ffffff");
  const backgroundColor = String(values.backgroundColor ?? "#000000");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleFactor = Math.min(width, height) / 1080;

  // Constants
  const changeEventTime = 0.32;
  const cameraZ = -400;
  const cameraTravelDistance = 3400;
  const startDotYOffset = 28;
  const viewZoom = 100;
  const trailLength = 80;

  // Pre-generate stars deterministically
  const stars: DeterministicStar[] = useMemo(() => {
    const random = createSeededRandom(1234);
    const list: DeterministicStar[] = [];

    const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

    for (let i = 0; i < numberOfStars; i++) {
      const angle = random() * Math.PI * 2;
      const distance = 30 * random() + 15;
      const rotationDirection = random() > 0.5 ? 1 : -1;
      const expansionRate = 1.2 + random() * 0.8;
      const finalScale = 0.7 + random() * 0.6;
      
      const dx = distance * Math.cos(angle);
      const dy = distance * Math.sin(angle);
      
      const spiralLocation = (1 - Math.pow(1 - random(), 3.0)) / 1.3;
      let starZ = (random() * (cameraTravelDistance)) + (0.5 * cameraZ);
      starZ = lerp(starZ, cameraTravelDistance / 2, 0.3 * spiralLocation);
      const strokeWeightFactor = Math.pow(random(), 2.0);

      list.push({
        angle,
        distance,
        rotationDirection,
        expansionRate,
        finalScale,
        dx,
        dy,
        spiralLocation,
        z: starZ,
        strokeWeightFactor,
      });
    }
    return list;
  }, [numberOfStars]);

  // Derived helper functions
  const ease = (p: number, g: number): number => {
    if (p < 0.5) 
      return 0.5 * Math.pow(2 * p, g);
    else
      return 1 - 0.5 * Math.pow(2 * (1 - p), g);
  };

  const easeOutElastic = (x: number): number => {
    const c4 = (2 * Math.PI) / 4.5;
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
  };

  const mapRange = (value: number, start1: number, stop1: number, start2: number, stop2: number): number => {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  };

  const constrain = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
  };

  const spiralPath = (p: number): Vector2D => {
    const cp = constrain(1.2 * p, 0, 1);
    const eased = ease(cp, 1.8);
    const numberOfSpiralTurns = 6;
    const theta = 2 * Math.PI * numberOfSpiralTurns * Math.sqrt(eased);
    const r = 170 * Math.sqrt(eased);
    
    return new Vector2D(
      r * Math.cos(theta),
      r * Math.sin(theta) + startDotYOffset
    );
  };

  const rotate = (v1: Vector2D, v2: Vector2D, p: number, orientation: boolean): Vector2D => {
    const middle = new Vector2D(
      (v1.x + v2.x) / 2,
      (v1.y + v2.y) / 2
    );
    
    const dx = v1.x - middle.x;
    const dy = v1.y - middle.y;
    const angle = Math.atan2(dy, dx);
    const o = orientation ? -1 : 1;
    const r = Math.sqrt(dx * dx + dy * dy);
    
    const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p);
    
    return new Vector2D(
      middle.x + r * (1 + bounce) * Math.cos(angle + o * Math.PI * easeOutElastic(p)),
      middle.y + r * (1 + bounce) * Math.sin(angle + o * Math.PI * easeOutElastic(p))
    );
  };

  // Perform single frame canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and match exact size
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Normalize time to a 15-second loop
    const localTime = ((time * speedScale) % 15) / 15;

    const t1 = constrain(mapRange(localTime, 0, changeEventTime + 0.25, 0, 1), 0, 1);
    const t2 = constrain(mapRange(localTime, changeEventTime, 1, 0, 1), 0, 1);

    // Rotate camera
    ctx.rotate(-Math.PI * ease(t2, 2.7));

    // Projection rendering helper
    const showProjectedDot = (pos: Vector3D, sizeFactor: number, colorStr: string) => {
      const newCameraZ = cameraZ + ease(Math.pow(t2, 1.2), 1.8) * cameraTravelDistance;
      
      if (pos.z > newCameraZ) {
        const dotDepthFromCamera = pos.z - newCameraZ;
        
        const x = (viewZoom * pos.x / dotDepthFromCamera) * scaleFactor;
        const y = (viewZoom * pos.y / dotDepthFromCamera) * scaleFactor;
        const sw = (400 * sizeFactor / dotDepthFromCamera) * scaleFactor;
        
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, sw / 2), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw trail
    for (let i = 0; i < trailLength; i++) {
      const f = mapRange(i, 0, trailLength, 1.1, 0.1);
      const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
      const pathTime = t1 - 0.00015 * i;
      const position = spiralPath(pathTime);
      
      const rotated = rotate(
        position, 
        new Vector2D(position.x + 5, position.y + 5), 
        Math.sin(localTime * Math.PI * 2) * 0.5 + 0.5, 
        i % 2 === 0
      );

      // Project the 2D path coordinate back as standard depth
      const trailZ = lerp(cameraTravelDistance / 2, cameraTravelDistance, t1);
      const vx = (trailZ - cameraZ) * rotated.x / viewZoom;
      const vy = (trailZ - cameraZ) * rotated.y / viewZoom;

      showProjectedDot(new Vector3D(vx, vy, trailZ), sw * 3.5, trailColor);
    }

    // Draw stars
    for (const star of stars) {
      const spiralPos = spiralPath(star.spiralLocation);
      const q = t1 - star.spiralLocation;
      
      if (q > 0) {
        const displacementProgress = constrain(4 * q, 0, 1);
        
        let starEasing;
        if (displacementProgress < 0.3) {
          starEasing = lerp(displacementProgress, Math.pow(displacementProgress, 2), displacementProgress / 0.3);
        } else if (displacementProgress < 0.7) {
          const t = (displacementProgress - 0.3) / 0.4;
          starEasing = lerp(Math.pow(displacementProgress, 2), easeOutElastic(displacementProgress), t);
        } else {
          starEasing = easeOutElastic(displacementProgress);
        }
        
        let screenX, screenY;
        
        if (displacementProgress < 0.3) {
          screenX = lerp(spiralPos.x, spiralPos.x + star.dx * 0.3, starEasing / 0.3);
          screenY = lerp(spiralPos.y, spiralPos.y + star.dy * 0.3, starEasing / 0.3);
        } else if (displacementProgress < 0.7) {
          const midProgress = (displacementProgress - 0.3) / 0.4;
          const curveStrength = Math.sin(midProgress * Math.PI) * star.rotationDirection * 1.5;
          
          const baseX = spiralPos.x + star.dx * 0.3;
          const baseY = spiralPos.y + star.dy * 0.3;
          const targetX = spiralPos.x + star.dx * 0.7;
          const targetY = spiralPos.y + star.dy * 0.7;
          
          const perpX = -star.dy * 0.4 * curveStrength;
          const perpY = star.dx * 0.4 * curveStrength;
          
          screenX = lerp(baseX, targetX, midProgress) + perpX * midProgress;
          screenY = lerp(baseY, targetY, midProgress) + perpY * midProgress;
        } else {
          const finalProgress = (displacementProgress - 0.7) / 0.3;
          
          const baseX = spiralPos.x + star.dx * 0.7;
          const baseY = spiralPos.y + star.dy * 0.7;
          
          const targetDistance = star.distance * star.expansionRate * 1.5;
          const spiralTurns = 1.2 * star.rotationDirection;
          const spiralAngle = star.angle + spiralTurns * finalProgress * Math.PI;
          
          const targetX = spiralPos.x + targetDistance * Math.cos(spiralAngle);
          const targetY = spiralPos.y + targetDistance * Math.sin(spiralAngle);
          
          screenX = lerp(baseX, targetX, finalProgress);
          screenY = lerp(baseY, targetY, finalProgress);
        }
        
        const vx = (star.z - cameraZ) * screenX / viewZoom;
        const vy = (star.z - cameraZ) * screenY / viewZoom;
        
        let sizeMultiplier = 1.0;
        if (displacementProgress < 0.6) {
          sizeMultiplier = 1.0 + displacementProgress * 0.2;
        } else {
          const t = (displacementProgress - 0.6) / 0.4;
          sizeMultiplier = 1.2 * (1.0 - t) + star.finalScale * t;
        }
        
        const dotSize = 8.5 * star.strokeWeightFactor * sizeMultiplier;
        showProjectedDot(new Vector3D(vx, vy, star.z), dotSize, starColor);
      }
    }

    // Draw center start dot
    if (localTime > changeEventTime) {
      const dy = cameraZ * startDotYOffset / viewZoom;
      const startDotPosition = new Vector3D(0, dy, cameraTravelDistance);
      showProjectedDot(startDotPosition, 2.5, starColor);
    }

    ctx.restore();
  }, [time, width, height, stars, starColor, trailColor, backgroundColor, speedScale, scaleFactor]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

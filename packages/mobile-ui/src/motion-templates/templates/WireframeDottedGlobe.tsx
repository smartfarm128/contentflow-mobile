import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function WireframeDottedGlobeTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const globeSize = Number(values.globeSize ?? 400);
  const dotColor = String(values.dotColor ?? "#999999");
  const strokeColor = String(values.strokeColor ?? "#ffffff");
  const oceanColor = String(values.oceanColor ?? "#000000");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landData, setLandData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const allDotsRef = useRef<[number, number][]>([]);

  // 2. Scale factor calculation
  const scaleFactor = Math.min(width, height) / 1080;
  const resolvedGlobeSize = globeSize * scaleFactor;

  // Helper helpers for polygon points containment
  const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  };

  const pointInFeature = (point: [number, number], feature: any): boolean => {
    const geometry = feature.geometry;

    if (geometry.type === "Polygon") {
      const coordinates = geometry.coordinates;
      if (!pointInPolygon(point, coordinates[0])) return false;
      for (let i = 1; i < coordinates.length; i++) {
        if (pointInPolygon(point, coordinates[i])) return false;
      }
      return true;
    } else if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        if (pointInPolygon(point, polygon[0])) {
          let inHole = false;
          for (let i = 1; i < polygon.length; i++) {
            if (pointInPolygon(point, polygon[i])) {
              inHole = true;
              break;
            }
          }
          if (!inHole) return true;
        }
      }
      return false;
    }
    return false;
  };

  const generateDotsInPolygon = (feature: any, dotSpacing = 16) => {
    const dots: [number, number][] = [];
    const bounds = d3.geoBounds(feature);
    const [[minLng, minLat], [maxLng, maxLat]] = bounds;

    const stepSize = dotSpacing * 0.08;
    for (let lng = minLng; lng <= maxLng; lng += stepSize) {
      for (let lat = minLat; lat <= maxLat; lat += stepSize) {
        const point: [number, number] = [lng, lat];
        if (pointInFeature(point, feature)) {
          dots.push(point);
        }
      }
    }
    return dots;
  };

  // 3. Load Map Data on Mount
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const response = await fetch(
          placeholderImage("0mlandjson"),
        );
        if (!response.ok) throw new Error("Failed to load map data");
        const json = await response.json();
        if (active) {
          const dots: [number, number][] = [];
          json.features.forEach((feature: any) => {
            const featureDots = generateDotsInPolygon(feature, 16);
            dots.push(...featureDots);
          });
          allDotsRef.current = dots;
          setLandData(json);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Dotted Globe Template: error loading map data", err);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // 4. Draw Frame strictly from Playhead Progress
  useEffect(() => {
    if (!canvasRef.current || isLoading || !landData) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Calculate dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    context.clearRect(0, 0, width, height);

    // Setup geo Orthographic projection
    const projection = d3
      .geoOrthographic()
      .scale(resolvedGlobeSize)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    // Rotation is strictly evaluated from playhead progress
    const rotationAngle = progress * 360;
    projection.rotate([rotationAngle, 0]);

    const path = d3.geoPath().projection(projection).context(context);

    // Draw ocean back-sphere
    context.beginPath();
    context.arc(width / 2, height / 2, resolvedGlobeSize, 0, 2 * Math.PI);
    context.fillStyle = oceanColor;
    context.fill();
    context.strokeStyle = strokeColor;
    context.lineWidth = 2 * scaleFactor;
    context.stroke();

    // Draw graticules
    const graticule = d3.geoGraticule();
    context.beginPath();
    path(graticule());
    context.strokeStyle = strokeColor;
    context.lineWidth = 1 * scaleFactor;
    context.globalAlpha = 0.15;
    context.stroke();
    context.globalAlpha = 1;

    // Draw land outlines
    context.beginPath();
    landData.features.forEach((feature: any) => {
      path(feature);
    });
    context.strokeStyle = strokeColor;
    context.lineWidth = 1 * scaleFactor;
    context.stroke();

    // Draw halftone land dots
    allDotsRef.current.forEach((dot) => {
      const projected = projection(dot);
      if (
        projected &&
        projected[0] >= 0 &&
        projected[0] <= width &&
        projected[1] >= 0 &&
        projected[1] <= height
      ) {
        // Draw dot only if it lies on the visible hemisphere
        context.beginPath();
        context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
        context.fillStyle = dotColor;
        context.fill();
      }
    });

  }, [progress, width, height, landData, isLoading, resolvedGlobeSize, dotColor, strokeColor, oceanColor, scaleFactor]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#050608",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {isLoading && (
        <div style={{ position: "absolute", zIndex: 10, color: "#ffffff", fontFamily: "Inter, sans-serif", fontSize: `${16 * scaleFactor}px` }}>
          Loading Dotted Globe Data...
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
        }}
      />
    </div>
  );
}

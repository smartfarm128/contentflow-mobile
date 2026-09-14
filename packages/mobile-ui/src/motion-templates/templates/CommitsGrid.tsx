import type { HtmlTemplateProps } from "../types";

const letterPatterns: { [key: string]: number[] } = {
  A: [
    1, 2, 3, 50, 100, 150, 200, 250, 300, 54, 104, 154, 204, 254, 304, 151, 152,
    153,
  ],
  B: [
    0, 1, 2, 3, 4, 50, 100, 150, 151, 200, 250, 300, 301, 302, 303, 304, 54,
    104, 152, 153, 204, 254, 303,
  ],
  C: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 301, 302, 303, 304],
  D: [
    0, 1, 2, 3, 50, 100, 150, 200, 250, 300, 301, 302, 54, 104, 154, 204, 254,
    303,
  ],
  E: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 301, 302, 303, 304, 151, 152],
  F: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 151, 152, 153],
  G: [
    0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 301, 302, 303, 153, 204, 154,
    304, 254,
  ],
  H: [
    0, 50, 100, 150, 200, 250, 300, 151, 152, 153, 4, 54, 104, 154, 204, 254,
    304,
  ],
  I: [0, 1, 2, 3, 4, 52, 102, 152, 202, 252, 300, 301, 302, 303, 304],
  J: [0, 1, 2, 3, 4, 52, 102, 152, 202, 250, 252, 302, 300, 301],
  K: [0, 4, 50, 100, 150, 200, 250, 300, 151, 152, 103, 54, 203, 254, 304],
  L: [0, 50, 100, 150, 200, 250, 300, 301, 302, 303, 304],
  M: [
    0, 50, 100, 150, 200, 250, 300, 51, 102, 53, 4, 54, 104, 154, 204, 254, 304,
  ],
  N: [
    0, 50, 100, 150, 200, 250, 300, 51, 102, 153, 204, 4, 54, 104, 154, 204,
    254, 304,
  ],
  O: [1, 2, 3, 50, 100, 150, 200, 250, 301, 302, 303, 54, 104, 154, 204, 254],
  P: [0, 50, 100, 150, 200, 250, 300, 1, 2, 3, 54, 104, 151, 152, 153],
  Q: [
    1, 2, 3, 50, 100, 150, 200, 250, 301, 302, 54, 104, 154, 204, 202, 253, 304,
  ],
  R: [
    0, 50, 100, 150, 200, 250, 300, 1, 2, 3, 54, 104, 151, 152, 153, 204, 254,
    304,
  ],
  S: [1, 2, 3, 4, 50, 100, 151, 152, 153, 204, 254, 300, 301, 302, 303],
  T: [0, 1, 2, 3, 4, 52, 102, 152, 202, 252, 302],
  U: [0, 50, 100, 150, 200, 250, 301, 302, 303, 4, 54, 104, 154, 204, 254],
  V: [0, 50, 100, 150, 200, 251, 302, 4, 54, 104, 154, 204, 253],
  W: [
    0, 50, 100, 150, 200, 250, 301, 152, 202, 252, 4, 54, 104, 154, 204, 254,
    303,
  ],
  X: [0, 50, 203, 254, 304, 4, 54, 152, 101, 103, 201, 250, 300],
  Y: [0, 50, 101, 152, 202, 252, 302, 4, 54, 103],
  Z: [0, 1, 2, 3, 4, 54, 103, 152, 201, 250, 300, 301, 302, 303, 304],
  "0": [1, 2, 3, 50, 100, 150, 200, 250, 301, 302, 303, 54, 104, 154, 204, 254],
  "1": [1, 52, 102, 152, 202, 252, 302, 0, 2, 300, 301, 302, 303, 304],
  "2": [0, 1, 2, 3, 54, 104, 152, 153, 201, 250, 300, 301, 302, 303, 304],
  "3": [0, 1, 2, 3, 54, 104, 152, 153, 204, 254, 300, 301, 302, 303],
  "4": [0, 50, 100, 150, 4, 54, 104, 151, 152, 153, 154, 204, 254, 304],
  "5": [0, 1, 2, 3, 4, 50, 100, 151, 152, 153, 204, 254, 300, 301, 302, 303],
  "6": [
    1, 2, 3, 50, 100, 150, 151, 152, 153, 200, 250, 301, 302, 204, 254, 303,
  ],
  "7": [0, 1, 2, 3, 4, 54, 103, 152, 201, 250, 300],
  "8": [
    1, 2, 3, 50, 100, 151, 152, 153, 200, 250, 301, 302, 303, 54, 104, 204, 254,
  ],
  "9": [1, 2, 3, 50, 100, 151, 152, 153, 154, 204, 254, 304, 54, 104],
  " ": [],
};

export function CommitsGridTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "GITHUB");
  const speed = Number(values.speed ?? 1.5);
  const scaleFactor = Math.min(width, height) / 1080;

  const cleanString = (str: string): string => {
    const upperStr = str.toUpperCase();
    const withoutAccents = upperStr
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const allowedChars = Object.keys(letterPatterns);
    return withoutAccents
      .split("")
      .filter((char) => allowedChars.includes(char))
      .join("");
  };

  const generateHighlightedCells = (inputText: string) => {
    const cleanedText = cleanString(inputText);
    const gridWidth = Math.max(cleanedText.length * 6, 6) + 1;

    let currentPosition = 1;
    const highlightedCells: number[] = [];

    cleanedText
      .toUpperCase()
      .split("")
      .forEach((char) => {
        if (letterPatterns[char]) {
          const pattern = letterPatterns[char].map((pos) => {
            const row = Math.floor(pos / 50);
            const col = pos % 50;
            return (row + 1) * gridWidth + col + currentPosition;
          });
          highlightedCells.push(...pattern);
        }
        currentPosition += 6;
      });

    return {
      cells: highlightedCells,
      width: gridWidth,
      height: 9,
    };
  };

  const {
    cells: highlightedCells,
    width: gridWidth,
    height: gridHeight,
  } = generateHighlightedCells(text);

  // Playhead-deterministic random commits calculation
  const commitColors = ["#48d55d", "#016d32", "#0d4429"];
  
  // Seedable deterministic pseudo-random function for styling grid cells
  const getCellColor = (cellIdx: number) => {
    const hash = Math.abs(Math.sin(cellIdx * 12.9898 + 4.1414) * 43758.5453) % 1;
    const colorIdx = Math.floor(hash * commitColors.length);
    return commitColors[colorIdx];
  };

  const getCellDelay = (cellIdx: number) => {
    const hash = Math.abs(Math.cos(cellIdx * 7.8233 + 3.1231) * 31235.1231) % 1;
    return `${(hash * 0.6).toFixed(1)}s`;
  };

  const isFlashing = (cellIdx: number) => {
    // Generate a clean deterministic flash behavior driven by time
    const hash = Math.abs(Math.sin(cellIdx * 9.8123 + time * 1.5)) % 1;
    return hash < 0.25;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        className="grid border border-neutral-800 bg-neutral-900/60 backdrop-blur-md p-4 rounded-xl shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`,
          width: `${Math.min(width * 0.9, gridWidth * 16 * scaleFactor)}px`,
          gap: `${4 * scaleFactor}px`,
        }}
      >
        {Array.from({ length: gridWidth * gridHeight }).map((_, index) => {
          const isHighlighted = highlightedCells.includes(index);
          const flashActive = !isHighlighted && isFlashing(index);

          let cellBg = "rgba(22, 27, 34, 0.5)"; // empty cell
          let glow = "none";
          if (isHighlighted) {
            cellBg = "#39d353";
            // Highlight intensity pulses slowly with time
            const pulse = 0.8 + 0.2 * Math.sin(time * speed * 6 + index * 0.1);
            glow = `0 0 10px rgba(57, 211, 83, ${pulse})`;
          } else if (flashActive) {
            cellBg = getCellColor(index);
          }

          return (
            <div
              key={index}
              className="border border-neutral-800/40 rounded-sm aspect-square"
              style={{
                backgroundColor: cellBg,
                boxShadow: glow,
                transition: "background-color 0.15s ease-out, box-shadow 0.15s ease-out",
                animationDelay: getCellDelay(index),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

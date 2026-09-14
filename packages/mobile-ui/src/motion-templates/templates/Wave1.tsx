import type { HtmlTemplateProps } from "../types";
import { DitheringShader, DitheringType } from "../ui/dithering-shader";

export function Wave1Template({ time, width, height, values }: HtmlTemplateProps) {
  const type = String(values.type ?? "8x8") as DitheringType;
  const colorBack = String(values.colorBack ?? "#001122");
  const colorFront = String(values.colorFront ?? "#ff0088");
  const pxSize = Number(values.pxSize ?? 3);
  const textTitle = String(values.title ?? "Wave");

  const scaleFactor = Math.min(width, height) / 1080;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <DitheringShader
        width={width}
        height={height}
        shape="wave"
        type={type}
        colorBack={colorBack}
        colorFront={colorFront}
        pxSize={pxSize}
        speed={0} // Disable internal animation loop
        time={time} // Feed the playhead time directly!
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {textTitle && (
        <span
          style={{
            position: "absolute",
            zIndex: 10,
            pointerEvents: "none",
            textAlign: "center",
            fontSize: `${Math.max(28, 72 * scaleFactor)}px`,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            textShadow: "0 10px 30px rgba(0,0,0,0.8)",
          }}
        >
          {textTitle}
        </span>
      )}
    </div>
  );
}

import type { HtmlTemplateProps } from "../types";
import { ArrowRight } from "lucide-react";

export function Card21Template({ time, values }: HtmlTemplateProps) {
  const imageUrl = String(values.imageUrl ?? "https://images.unsplash.com/photo-1524675053444-52c3ca294ad2?q=80&w=900");
  const location = String(values.location ?? "Indonesia");
  const flag = String(values.flag ?? "🇮🇩");
  const stats = String(values.stats ?? "1,345 Hotels • 24 Packages");
  const themeColor = String(values.themeColor ?? "150 50% 25%");
  const cycleDuration = Number(values.cycleDuration ?? 4);

  // Compute a smooth hover progress loop (0 -> 1 -> 0)
  const hoverProgress = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / cycleDuration);
  
  const scale = 1 + 0.05 * hoverProgress;
  const shadowGlow = `0 0 ${40 + 20 * hoverProgress}px -15px hsl(${themeColor} / ${0.5 + 0.1 * hoverProgress})`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          boxShadow: shadowGlow,
          borderRadius: "16px",
        }}
        className="relative overflow-hidden"
      >
        {/* Background Image with Zoom */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            transform: `scale(${1 + 0.1 * hoverProgress})`,
          }}
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, hsl(${themeColor} / 0.9), hsl(${themeColor} / 0.6) 30%, transparent 60%)`,
          }}
        />
        
        {/* Content */}
        <div className="relative flex flex-col justify-end h-full p-6 text-white">
          <h3 className="text-3xl font-bold tracking-tight">
            {location} <span className="text-2xl ml-1">{flag}</span>
          </h3>
          <p className="text-sm text-white/80 mt-1 font-medium">{stats}</p>

          {/* Explore Button */}
          <div 
            className="mt-8 flex items-center justify-between backdrop-blur-md border rounded-lg px-4 py-3"
            style={{
              backgroundColor: `hsl(${themeColor} / ${0.2 + 0.2 * hoverProgress})`,
              borderColor: `hsl(${themeColor} / ${0.3 + 0.2 * hoverProgress})`,
            }}
          >
            <span className="text-sm font-semibold tracking-wide">Explore Now</span>
            <ArrowRight 
              className="h-4 w-4 transform" 
              style={{
                transform: `translateX(${hoverProgress * 4}px)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

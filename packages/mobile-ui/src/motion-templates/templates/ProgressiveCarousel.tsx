"use client";

import type { HtmlTemplateProps } from "../types";

const items = [
  {
    img: "https://images.unsplash.com/photo-1709949908058-a08659bfa922?q=80&w=1170&auto=format&fit=crop",
    title: "Bridge",
    desc: "A breathtaking view of a city illuminated by countless lights, showcasing the vibrant and bustling nightlife.",
    sliderName: "bridge",
  },
  {
    img: "https://images.unsplash.com/photo-1518972734183-c5b490a7c637?q=80&w=1170&auto=format&fit=crop",
    title: "Mountains View",
    desc: "A serene lake reflecting the surrounding mountains and trees, creating a mirror-like surface.",
    sliderName: "mountains",
  },
  {
    img: "https://images.unsplash.com/photo-1548192746-dd526f154ed9?q=80&w=1170&auto=format&fit=crop",
    title: "Autumn",
    desc: "A picturesque path winding through a dense forest adorned with vibrant autumn foliage.",
    sliderName: "autumn",
  },
  {
    img: "https://images.unsplash.com/photo-1628965882741-570e75becd5d?q=80&w=687&auto=format&fit=crop",
    title: "Foggy",
    sliderName: "foggy",
    desc: "A stunning foggy view over the forest, with the sun casting a golden glow across the canopy.",
  },
];

export function ProgressiveCarouselTemplate({ time, values }: HtmlTemplateProps) {
  const slideDuration = Number(values.slideDuration ?? 4.0);
  const total = items.length;

  const activeIndex = Math.floor(time / slideDuration) % total;
  const progressPercent = ((time % slideDuration) / slideDuration) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8 w-full">
      <main className="max-w-4xl px-10 mx-auto w-full relative">
        <div className="relative">
          {/* Active Image frame wrapper */}
          <div className="h-[450px] w-full overflow-hidden rounded-xl border border-white/10 relative bg-zinc-950">
            {items.map((item, index) => (
              <img
                key={index}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                src={item.img}
                alt={item.desc}
                style={{
                  opacity: index === activeIndex ? 1 : 0,
                }}
              />
            ))}
          </div>

          {/* Staggered progress bar selectors */}
          <div className="absolute bottom-0 h-fit text-white bg-zinc-900/80 backdrop-blur-md overflow-hidden grid grid-cols-2 md:grid-cols-4 rounded-b-xl border-t border-white/10 w-full">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              const fillWidth = isActive ? `${progressPercent}%` : "0%";

              return (
                <div
                  key={index}
                  className={`text-left p-4 border-r border-white/5 last:border-r-0 relative transition-opacity duration-300 overflow-hidden ${
                    isActive ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <h2 className="relative px-3 py-0.5 rounded-full w-fit bg-purple-600 text-xs font-semibold text-white mb-2 z-10">
                    {item.title}
                  </h2>
                  <p className="text-xs font-medium text-zinc-300 line-clamp-2 z-10 relative">
                    {item.desc}
                  </p>
                  
                  {/* Dynamic background progress bar overlay */}
                  <div className="absolute inset-0 overflow-hidden -z-10 max-h-full max-w-full">
                    <span
                      className="absolute left-0 top-0 bottom-0 bg-purple-600/25"
                      style={{
                        width: fillWidth,
                        transition: "width 0.05s linear",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
export default ProgressiveCarouselTemplate;

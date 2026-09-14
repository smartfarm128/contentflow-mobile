import type { HtmlTemplateProps } from "../types";
import { cn } from "../../lib/cn";

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular?: boolean;
  accent: string;
  rotation?: number;
}

export function PricingContainerTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Choose Your Perfect Plan");

  // Determine state toggle algebraically
  const isYearly = progress >= 0.5;

  const plan1Name = String(values.plan1Name ?? "Starter");
  const plan1MonthlyPrice = Number(values.plan1MonthlyPrice ?? 29);
  const plan1YearlyPrice = Number(values.plan1YearlyPrice ?? 290);
  const plan1Features = String(values.plan1Features ?? "1 User,10 Projects,5GB Storage,Basic Support")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);
  const plan1Accent = String(values.plan1Accent ?? "bg-rose-500");

  const plan2Name = String(values.plan2Name ?? "Pro");
  const plan2MonthlyPrice = Number(values.plan2MonthlyPrice ?? 99);
  const plan2YearlyPrice = Number(values.plan2YearlyPrice ?? 990);
  const plan2Features = String(values.plan2Features ?? "5 Users,50 Projects,100GB Storage,Priority Support")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);
  const plan2Accent = String(values.plan2Accent ?? "bg-blue-500");

  const plan3Name = String(values.plan3Name ?? "Enterprise");
  const plan3MonthlyPrice = Number(values.plan3MonthlyPrice ?? 199);
  const plan3YearlyPrice = Number(values.plan3YearlyPrice ?? 1990);
  const plan3Features = String(values.plan3Features ?? "Unlimited Users,100+ Projects,1TB Storage,24/7 Support")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);
  const plan3Accent = String(values.plan3Accent ?? "bg-purple-500");

  const plans: PricingPlan[] = [
    {
      name: plan1Name,
      monthlyPrice: plan1MonthlyPrice,
      yearlyPrice: plan1YearlyPrice,
      features: plan1Features,
      isPopular: false,
      accent: plan1Accent,
      rotation: -2,
    },
    {
      name: plan2Name,
      monthlyPrice: plan2MonthlyPrice,
      yearlyPrice: plan2YearlyPrice,
      features: plan2Features,
      isPopular: true,
      accent: plan2Accent,
      rotation: 1,
    },
    {
      name: plan3Name,
      monthlyPrice: plan3MonthlyPrice,
      yearlyPrice: plan3YearlyPrice,
      features: plan3Features,
      isPopular: false,
      accent: plan3Accent,
      rotation: 2,
    },
  ];

  // Staggered card entry or hover tilt based on progress
  let tiltX = 0;
  let tiltY = 0;
  if (progress > 0.1 && progress < 0.9) {
    const pNorm = (progress - 0.1) / 0.8;
    tiltX = Math.sin(pNorm * Math.PI * 2) * 5;
    tiltY = Math.cos(pNorm * Math.PI * 2) * 5;
  }

  const scale = Math.min(width, height) / 1080;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f4f4f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Neobrutalist background grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "1000px",
          transform: `scale(${scale * 1.5})`,
          transformOrigin: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-800 bg-white px-8 py-4 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] inline-block">
            {title}
          </h1>
        </div>

        {/* Custom Toggle Switch */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <span className={`font-black text-sm uppercase ${!isYearly ? 'text-black' : 'text-slate-400'}`}>Monthly</span>
          <div className="w-16 h-8 flex items-center bg-white rounded-full p-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div
              className="w-6 h-6 bg-slate-900 rounded-full transition-transform duration-200"
              style={{
                transform: isYearly ? "translateX(32px)" : "translateX(0px)",
              }}
            />
          </div>
          <span className={`font-black text-sm uppercase ${isYearly ? 'text-black' : 'text-slate-400'}`}>Yearly</span>
          {isYearly && (
            <span className="text-green-600 font-extrabold text-xs bg-green-100 border-2 border-green-600 px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              SAVE 20%
            </span>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-3 gap-6 w-full">
          {plans.map((plan, index) => {
            const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                style={{
                  transform: `rotate(${plan.rotation ?? 0}deg) translate3d(${tiltX * (index - 1)}px, ${tiltY * (index - 1)}px, 0)`,
                  transition: "transform 0.1s ease",
                }}
                className="relative bg-white rounded-xl p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <span className={cn("absolute -top-4 left-6 px-3 py-1 text-white font-black rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px]", plan.accent)}>
                    POPULAR
                  </span>
                )}

                {/* Price tag */}
                <div className={cn("absolute -top-4 -right-4 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-white", plan.accent)}>
                  <span className="text-sm font-black">${currentPrice}</span>
                  <span className="text-[8px] font-bold">/{isYearly ? 'yr' : 'mo'}</span>
                </div>

                <h3 className="text-lg font-black text-black mb-4">{plan.name}</h3>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      <span className={cn("w-4 h-4 rounded flex items-center justify-center text-[10px] text-white font-black border border-black", plan.accent)}>
                        ✓
                      </span>
                      <span className="text-xs font-bold text-slate-800">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className={cn("w-full py-2.5 rounded-lg text-white font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all", plan.accent)}>
                  GET STARTED
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PricingContainerTemplate;

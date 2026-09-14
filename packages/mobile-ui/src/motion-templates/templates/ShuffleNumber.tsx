"use client";

import { useMemo } from "react";
import NumberFlow, { useCanAnimate } from "@number-flow/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "../../lib/cn";
import type { HtmlTemplateProps } from "../types";

const MotionNumberFlow = motion.create(NumberFlow);
const MotionArrowUp = motion.create(ArrowUp);

const numbers = [124.23, 41.75, 2125.95];
const diffs = [0.0564, -0.114, 0.0029];

export function ShuffleNumberTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 3.0);

  const stateIndex = useMemo(() => {
    return Math.floor((time / cycleDuration) % numbers.length);
  }, [time, cycleDuration]);

  const value = numbers[stateIndex] ?? 0;
  const diff = diffs[stateIndex] ?? 0;
  const canAnimate = useCanAnimate();

  return (
    <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-950 text-white rounded-2xl border border-zinc-800">
      <span className="flex items-center justify-center gap-2">
        <NumberFlow
          value={value}
          className="text-5xl font-semibold"
          format={{ style: "currency", currency: "USD" }}
        />
        <motion.span
          className={cn(
            diff > 0 ? "bg-emerald-400" : "bg-red-500",
            "inline-flex items-center px-[0.3em] text-white transition-colors duration-300"
          )}
          style={{ borderRadius: 999 }}
          layout={canAnimate}
          transition={{ layout: { duration: 0.9, bounce: 0, type: "spring" } }}
        >
          <MotionArrowUp
            className="mr-0.5 size-[0.75em]"
            absoluteStrokeWidth
            strokeWidth={3}
            transition={{
              rotate: { type: "spring", duration: 0.5, bounce: 0 },
            }}
            animate={{ rotate: diff > 0 ? 0 : -180 }}
            initial={false}
          />
          <MotionNumberFlow
            value={diff}
            className="font-semibold"
            format={{ style: "percent", maximumFractionDigits: 2 }}
            layout={canAnimate}
            layoutRoot={canAnimate}
          />
        </motion.span>
      </span>
    </div>
  );
}

export default ShuffleNumberTemplate;

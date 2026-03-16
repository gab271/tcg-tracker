"use client";

import { useState, useEffect } from "react";

/** Animates a number from 0 to `end` over `duration` seconds using easeOutCubic. */
export function useCountUp(end: number, duration = 2): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(end * easeProgress);
      if (progress < 1) animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return count;
}

"use client";

import { useEffect, useId, useRef } from "react";

export function BrandSignalAnimated({ className = "" }: { className?: string }) {
  const sigRef = useRef<SVGPathElement>(null);
  const travelRef = useRef<SVGCircleElement>(null);
  const endRef = useRef<SVGCircleElement>(null);
  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    const sig = sigRef.current;
    const travel = travelRef.current;
    const end = endRef.current;
    if (!sig || !travel || !end) return;

    let raf = 0;
    let drawTimer: ReturnType<typeof setTimeout> | undefined;
    let loopTimer: ReturnType<typeof setTimeout> | undefined;

    function play() {
      const signal = sigRef.current;
      const traveler = travelRef.current;
      const endpoint = endRef.current;
      if (!signal || !traveler || !endpoint) return;

      if (raf) cancelAnimationFrame(raf);
      if (drawTimer) clearTimeout(drawTimer);
      if (loopTimer) clearTimeout(loopTimer);

      const pathEl = signal;
      const travelerEl = traveler;
      const len = pathEl.getTotalLength();
      traveler.setAttribute("opacity", "0");
      endpoint.style.transition = "none";
      endpoint.style.transform = "scale(0.3)";
      endpoint.style.opacity = "0";

      signal.style.transition = "none";
      signal.style.strokeDasharray = `${len}`;
      signal.style.strokeDashoffset = `${len}`;
      signal.getBoundingClientRect();

      const dur = 2200;
      signal.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.4,0,.2,1)`;
      signal.style.strokeDashoffset = "0";

      drawTimer = setTimeout(() => {
        endpoint.style.transition = "transform .4s cubic-bezier(.2,.8,.2,1), opacity .4s";
        endpoint.style.transform = "scale(1)";
        endpoint.style.opacity = "1";
      }, dur - 120);

      loopTimer = setTimeout(() => {
        traveler.setAttribute("opacity", "1");
        const period = 2600;
        let start: number | null = null;

        function step(ts: number) {
          if (start === null) start = ts;
          const progress = ((ts - start) % period) / period;
          const point = pathEl.getPointAtLength(progress * len);
          travelerEl.setAttribute("cx", point.x.toFixed(1));
          travelerEl.setAttribute("cy", point.y.toFixed(1));

          const fade =
            progress < 0.06
              ? progress / 0.06
              : progress > 0.94
                ? (1 - progress) / 0.06
                : 1;
          travelerEl.setAttribute(
            "opacity",
            Math.max(0, Math.min(1, fade)).toFixed(2)
          );
          raf = requestAnimationFrame(step);
        }

        raf = requestAnimationFrame(step);
      }, dur + 260);
    }

    play();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (drawTimer) clearTimeout(drawTimer);
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, []);

  return (
    <svg
      viewBox="0 0 430.1 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="146"
          y1="0"
          x2="522"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FF6B47" />
          <stop offset="0.42" stopColor="#8A6CFF" />
          <stop offset="0.72" stopColor="#6C8BFF" />
          <stop offset="1" stopColor="#27D3E0" />
        </linearGradient>
      </defs>
      <g transform="translate(-81.73 -26.44) scale(0.8885)">
        <line
          x1="152"
          y1="140"
          x2="516"
          y2="140"
          stroke="#2B2A31"
          strokeWidth="1"
        />
        <path
          ref={sigRef}
          d="M146 140 L210 140 L218 110 L226 156 L234 140 L250 140 L250 122 L290 122 L290 158 L330 158 L330 122 L370 122 L370 140 L385 140 Q405 120 425 140 Q445 160 465 140 Q485 120 505 140 L522 140"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.93"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="250" cy="140" r="3.38" fill="#8A6CFF" />
        <circle cx="385" cy="140" r="3.38" fill="#8A6CFF" />
        <circle ref={endRef} cx="522" cy="140" r="5.06" fill="#8A6CFF" />
        <circle ref={travelRef} cx="146" cy="140" r="4.5" fill="#fff" opacity="0" />
      </g>
    </svg>
  );
}

"use client";
import { useRef } from "react";
import { motion } from "motion/react";
import DottedMap from "dotted-map";

export default function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
}) {
  const svgRef = useRef(null);

  const map = new DottedMap({ height: 60, grid: "diagonal" });

  const svgMap = map.getSVG({
    radius: 0.22,
    color: "#FFFFFF40",
    innerColor: "#FFFFFF40",
    shape: "circle",
  });

  const projectPoint = (lat, lng) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (start, end) => {
    const p1 = projectPoint(start.lat, start.lng);
    const p2 = projectPoint(end.lat, end.lng);
    const midX = (p1.x + p2.x) / 2;
    const midY = Math.min(p1.y, p2.y) - 50;
    return `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
  };

  return (
    <div className="w-full aspect-[2/1] dark:bg-black bg-black rounded-lg relative font-sans overflow-hidden flex items-center justify-center">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="400"
        width="800"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(dot.start, dot.end)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1.5"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 * i,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 1,
                  ease: "easeOut",
                }}
              />
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r="3"
                fill={lineColor}
              />
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r="3"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="3"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r="3"
                fill={lineColor}
              />
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r="3"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="3"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
        <defs>
          <linearGradient
            id="path-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

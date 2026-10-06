import { useId } from "react";

export interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  /** Draws the soft area under the line. */
  area?: boolean;
}

/** Tiny trend line for stat tiles. Pure SVG: no chart library, no re-render cost. */
export const Sparkline = ({
  data,
  color = "var(--brand-500)",
  width = 132,
  height = 34,
  area = true,
}: SparklineProps) => {
  const gradientId = useId();
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - 3 - ((value - min) / span) * (height - 8),
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      {area ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gradientId})`} />
        </>
      ) : null}
      <path d={line} stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.6" fill={color} />
    </svg>
  );
};

export default Sparkline;

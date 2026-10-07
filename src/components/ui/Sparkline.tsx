import { useId } from "react";

export interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  /** Draws the flat band under the line. The console has no gradients. */
  area?: boolean;
}

/**
 * Tiny trend line for stat tiles. Pure SVG: no chart library, no re-render cost.
 *
 * The band under the line is a flat wash at one opacity rather than a fade:
 * gradients are out of the product, and a single stepped shape reads better at
 * the size these are drawn anyway, where a fade would only ever be two or three
 * pixels of grey.
 */
export const Sparkline = ({
  data,
  color = "var(--brand-500)",
  width = 132,
  height = 34,
  area = true,
}: SparklineProps) => {
  const bandId = useId();
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
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="sparkline"
    >
      {area ? (
        <>
          <defs>
            <clipPath id={bandId}>
              <path d={`${line} L${width},${height} L0,${height} Z`} />
            </clipPath>
          </defs>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill={color}
            opacity="0.14"
            clipPath={`url(#${bandId})`}
          />
        </>
      ) : null}
      <path d={line} stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.6" fill={color} />
    </svg>
  );
};

export default Sparkline;

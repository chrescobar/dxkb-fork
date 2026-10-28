import type { CSSProperties } from "react";
import { ringPath, type TrackDrawing } from "@/lib/circular-viewer/drawing";

function TrackMarks({ drawing }: { drawing: TrackDrawing }) {
  const { body } = drawing;
  if (body.kind === "pending") {
    return <path d={ringPath(drawing.ring)} className="fill-muted motion-safe:animate-pulse" />;
  }
  if (body.kind === "failed") {
    return <path d={ringPath(drawing.ring)} className="fill-destructive/20" />;
  }
  if (body.kind === "labels") {
    return (
      <g
        className="fill-(--tick-color) stroke-(--tick-color)"
        style={{ "--tick-color": drawing.foreground ?? "var(--muted-foreground)" } as CSSProperties}
      >
        {body.ticks.map((tick, index) => (
          <g key={index}>
            <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
            {tick.label && (
              <text
                x={tick.label.x}
                y={tick.label.y}
                transform={`rotate(${String(tick.label.rotate)} ${String(tick.label.x)} ${String(tick.label.y)})`}
                textAnchor={tick.label.anchor}
                dominantBaseline="central"
                stroke="none"
                className="text-3xs"
              >
                {tick.label.text}
              </text>
            )}
          </g>
        ))}
      </g>
    );
  }
  // A layer with a dark color keeps its color as the attribute, which the light
  // theme and an export (it drops `dark:` classes) use; a dark theme's class wins over it.
  return (
    <>
      {body.layers.map((layer, index) => {
        const dark =
          layer.darkColor === null ? undefined : ({ "--dark-color": layer.darkColor } as CSSProperties);
        return drawing.paint === "stroke" ? (
          <path
            key={index}
            d={layer.d}
            fill="none"
            stroke={layer.color ?? "#000000"}
            strokeWidth={0.5}
            className={dark ? "dark:stroke-(--dark-color)" : undefined}
            style={dark}
          />
        ) : (
          <path
            key={index}
            d={layer.d}
            fill={layer.color ?? "#0000FF"}
            className={dark ? "dark:fill-(--dark-color)" : undefined}
            style={dark}
          />
        );
      })}
    </>
  );
}

/** One track's ring. Hidden tracks keep their ring, as in legacy, so the others do not move. */
export function CircularTrackLayer({ drawing }: { drawing: TrackDrawing }) {
  const { ring, body } = drawing;
  const state = body.kind === "pending" ? "pending" : body.kind === "failed" ? "error" : "ready";
  return (
    <g
      data-track={drawing.id}
      data-state={state}
      data-inner-radius={ring.innerRadius.toFixed(1)}
      data-outer-radius={ring.outerRadius.toFixed(1)}
      display={drawing.visible ? undefined : "none"}
    >
      {drawing.background !== null && drawing.backgroundPath !== "" && (
        <path d={drawing.backgroundPath} fill={drawing.background} />
      )}
      {drawing.grid.map((radius, index) => (
        <circle key={index} r={radius} fill="none" stroke={index === 1 ? "#666666" : "#AAAAAA"} strokeDasharray="1 3" />
      ))}
      <TrackMarks drawing={drawing} />
    </g>
  );
}

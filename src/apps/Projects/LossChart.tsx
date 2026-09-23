import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { LossPoint } from '../../types/content';
import styles from './LossChart.module.css';

interface LossChartProps {
  points: readonly LossPoint[];
  caption: string;
  ariaLabel: string;
}

// Plot geometry in viewBox units.
const W = 560;
const H = 220;
const PAD = { top: 16, right: 44, bottom: 34, left: 44 };
const Y_TICKS = [2.0, 2.1, 2.2, 2.3] as const;
const Y_DOMAIN: readonly [number, number] = [1.98, 2.34];
const X_TICKS = [0, 2000, 4000, 6000] as const;
const X_DOMAIN: readonly [number, number] = [0, 6000];

const x = (step: number): number => PAD.left + ((step - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * (W - PAD.left - PAD.right);
const y = (loss: number): number => PAD.top + (1 - (loss - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * (H - PAD.top - PAD.bottom);

const fmtStep = (step: number): string => step.toLocaleString('en-GB');

/** Single-series line chart of SFT validation loss, with hover/keyboard inspection and a table view. */
export function LossChart({ points, caption, ariaLabel }: LossChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.step).toFixed(1)},${y(p.loss).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const activePoint = active !== null ? points[active] : undefined;

  const nearest = (event: PointerEvent<SVGRectElement>): number => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return 0;
    const vx = ((event.clientX - box.left) / box.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.step) - vx) < Math.abs(x(points[best]?.step ?? 0) - vx)) best = i;
    });
    return best;
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    setActive((i) => Math.min(points.length - 1, Math.max(0, (i ?? (delta > 0 ? -1 : points.length)) + delta)));
  };

  return (
    <figure className={styles.figure}>
      <div className={styles.plot}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${ariaLabel}. Use the left and right arrow keys to read each point.`}
          aria-describedby={tableId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line className={styles.grid} x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
              <text className={styles.tick} x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                {tick.toFixed(1)}
              </text>
            </g>
          ))}
          {X_TICKS.map((tick) => (
            <text key={tick} className={styles.tick} x={x(tick)} y={H - PAD.bottom + 16} textAnchor="middle">
              {fmtStep(tick)}
            </text>
          ))}
          <text className={styles.axisLabel} x={(PAD.left + W - PAD.right) / 2} y={H - 4} textAnchor="middle">
            optimizer step
          </text>

          {activePoint && (
            <line className={styles.crosshair} x1={x(activePoint.step)} x2={x(activePoint.step)} y1={PAD.top} y2={H - PAD.bottom} />
          )}

          <path className={styles.line} d={path} />
          {points.map((p, i) => (
            <circle key={p.step} className={styles.dot} data-active={i === active} cx={x(p.step)} cy={y(p.loss)} r={i === active ? 5.5 : 4} />
          ))}

          {last && (
            <text className={styles.endLabel} x={x(last.step) + 10} y={y(last.loss)} dominantBaseline="middle">
              {last.loss.toFixed(2)}
            </text>
          )}

          {/* Hit area larger than the marks. */}
          <rect
            className={styles.hit}
            x={PAD.left - 12}
            y={PAD.top}
            width={W - PAD.left - PAD.right + 24}
            height={H - PAD.top - PAD.bottom}
            onPointerMove={(event) => setActive(nearest(event))}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {activePoint && (
          <div
            className={styles.tooltip}
            style={{ left: `${(x(activePoint.step) / W) * 100}%`, top: `${(y(activePoint.loss) / H) * 100}%` }}
            role="status"
          >
            <span className={styles.tooltipTitle}>Step {fmtStep(activePoint.step)}</span>
            <span>
              <span className={styles.key} aria-hidden="true" />
              Loss <strong>{activePoint.loss.toFixed(4)}</strong>
            </span>
            <span className={styles.muted}>Perplexity {activePoint.ppl.toFixed(3)}</span>
          </div>
        )}
      </div>

      <figcaption className={styles.caption}>{caption}</figcaption>

      <details className={styles.details}>
        <summary>Show data table</summary>
        <table id={tableId} className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Validation loss</th>
              <th scope="col">Perplexity</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.step}>
                <td>{fmtStep(p.step)}</td>
                <td>{p.loss.toFixed(4)}</td>
                <td>{p.ppl.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

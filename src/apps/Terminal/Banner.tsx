import { BANNER } from './commands';
import styles from './Terminal.module.css';

const HALVES: Record<string, readonly [top: boolean, bottom: boolean]> = {
  '▀': [true, false],
  '▄': [false, true],
  '█': [true, true],
};

// Split each banner row into its block-character art and the text after it.
const ART_WIDTH = Math.max(...BANNER.map((row) => [...row].findLastIndex((ch) => ch in HALVES) + 1));
const TEXT_COLUMN = Math.min(...BANNER.map((row) => row.slice(ART_WIDTH).search(/\S/)).filter((i) => i >= 0)) + ART_WIDTH;

const cells = BANNER.flatMap((row, y) =>
  [...row.slice(0, ART_WIDTH)].flatMap((ch, x) => {
    const [top, bottom] = HALVES[ch] ?? [false, false];
    return [...(top ? [{ x, y: y * 2 }] : []), ...(bottom ? [{ x, y: y * 2 + 1 }] : [])];
  }),
);

/**
 * The ~/.zshrc banner. kitty draws block characters itself so they tile
 * seamlessly; font glyphs leave hairline gaps, so the art is drawn as a grid.
 */
export function Banner() {
  return (
    <div className={styles.banner} style={{ gridTemplateColumns: `${TEXT_COLUMN}ch 1fr`, gridTemplateRows: `repeat(${BANNER.length}, 1.3em)` }}>
      <svg
        className={styles.bannerArt}
        viewBox={`0 0 ${ART_WIDTH} ${BANNER.length * 2}`}
        preserveAspectRatio="none"
        style={{ width: `${ART_WIDTH}ch`, gridRow: `1 / span ${BANNER.length}` }}
        aria-hidden="true"
      >
        {cells.map(({ x, y }) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
      </svg>
      {BANNER.map((row, i) => (
        <span key={i} style={{ gridColumn: 2, gridRow: i + 1 }}>
          {row.slice(TEXT_COLUMN)}
        </span>
      ))}
    </div>
  );
}

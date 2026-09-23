import type { TerminalScreen } from '../../types/content';
import styles from './UbumeScreen.module.css';

interface UbumeScreenProps {
  screen: TerminalScreen;
  compact: boolean;
  caption: string;
}

/** Ubume's startup screen, redrawn from the data rather than shown as a screenshot. */
export function UbumeScreen({ screen, compact, caption }: UbumeScreenProps) {
  return (
    <figure className={styles.figure}>
      <div className={styles.screen} data-compact={compact} role="img" aria-label={`Ubume startup screen: ${screen.meta.join(', ')}`}>
        <div className={styles.head}>
          <pre className={styles.logo} aria-hidden="true">
            {screen.logo.map((row, i) => (
              <span key={i} className={styles[`tone${screen.logoTone[i] ?? 1}`]}>
                {row}
                {'\n'}
              </span>
            ))}
          </pre>
          <div className={styles.meta} aria-hidden="true">
            {screen.meta.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
        <div className={styles.composer} aria-hidden="true">
          <span className={styles.prompt}>{screen.prompt}</span>
          <span className={styles.placeholder}>{screen.placeholder}</span>
        </div>
        <div className={styles.footer} aria-hidden="true">
          <span>{screen.footerLeft}</span>
          <span>{screen.footerRight}</span>
        </div>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

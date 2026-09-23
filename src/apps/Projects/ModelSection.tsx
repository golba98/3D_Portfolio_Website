import { codexa } from '../../data/model';
import ui from '../shared/ui.module.css';
import { LossChart } from './LossChart';
import styles from './Projects.module.css';

/** The Codexa training run: architecture, counters, the loss curve and its caveat. */
export function ModelSection() {
  return (
    <section className={ui.section} aria-labelledby="model-heading">
      <p className={ui.eyebrow}>Model</p>
      <h3 id="model-heading" className={ui.h2}>
        {codexa.heading}
      </h3>
      <p className={ui.lede}>{codexa.lede}</p>

      <ul className={styles.stats} aria-label="Training run">
        {codexa.counters.map((counter) => (
          <li key={counter.label} className={styles.stat}>
            <span className={styles.statValue}>
              {counter.display} <span className={styles.statUnit}>{counter.unit}</span>
            </span>
            <span className={styles.statLabel}>{counter.label}</span>
          </li>
        ))}
      </ul>

      <div className={ui.section}>
        <h4 className={ui.h3}>Conversational SFT validation loss</h4>
        <LossChart points={codexa.loss} caption={codexa.lossCaption} ariaLabel={codexa.lossAriaLabel} />
      </div>

      <div className={ui.section}>
        <h4 className={ui.h3}>Architecture</h4>
        <dl className={`${ui.list} ${styles.spec}`} aria-label={`Model architecture from ${codexa.specSource}`}>
          {codexa.spec.map((row) => (
            <div key={row.label} className={styles.specRow}>
              <dt className={ui.muted}>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className={`${ui.small} ${styles.source}`}>Source: {codexa.specSource}</p>
      </div>

      <p className={`${ui.card} ${styles.caveat}`}>
        <strong>{codexa.caveatLabel}</strong> {codexa.caveat}
      </p>
    </section>
  );
}

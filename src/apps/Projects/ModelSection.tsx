import { codexa } from '../../data/model';
import ui from '../shared/ui.module.css';
import { LossChart } from './LossChart';
import styles from './Projects.module.css';

/** The Codexa training run: architecture, counters, the loss curve and its caveat. */
export function ModelSection() {
  return (
    <section className={ui.section} aria-labelledby="model-heading">
      <h3 id="model-heading" className={ui.groupTitle}>
        {codexa.heading}
      </h3>
      <p className={ui.groupDescription}>{codexa.lede}</p>

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

      {codexa.loss && codexa.loss.length > 1 && (
        <div className={ui.section}>
          <h4 className={ui.groupTitle}>Validation loss</h4>
          <LossChart points={codexa.loss} caption={codexa.lossCaption ?? ''} ariaLabel={codexa.lossAriaLabel ?? 'Validation loss'} />
        </div>
      )}
      <p className={ui.small}><a href="https://github.com/golba98/Codexa-LLM-v3-PyTorch-250M/blob/main/reports/training/evidence/base-500m-report.json" target="_blank" rel="noreferrer">Recorded v3 base-run results</a></p>

      <div className={ui.section}>
        <h4 className={ui.groupTitle}>Architecture</h4>
        <dl className={ui.list} aria-label={`Model architecture from ${codexa.specSource}`}>
          {codexa.spec.map((row) => (
            <div key={row.label} className={styles.specRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className={`${ui.small} ${ui.muted} ${styles.source}`}>Source: {codexa.specSource}</p>
      </div>

      <p className={`${ui.card} ${styles.caveat}`}>
        <strong>{codexa.caveatLabel}</strong> {codexa.caveat}
      </p>
    </section>
  );
}

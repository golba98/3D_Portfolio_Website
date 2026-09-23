import { hardware, knownHardware } from '../../data/hardware';
import { interests } from '../../data/background';
import { siteInfo } from '../../data/site';
import { HeaderBar } from '../../components/adw/HeaderBar';
import { ToolbarView } from '../../components/adw/ToolbarView';
import type { AppProps } from '../../types/apps';
import ui from '../shared/ui.module.css';
import styles from './SystemInfo.module.css';

const PC_INTEREST = interests.find((interest) => interest.startsWith('PC building'));

/** Laid out like GNOME Settings → System → About. */
export default function SystemInfo(_props: AppProps) {
  const specs = [{ label: 'Device Name', value: hardware.hostname }, ...knownHardware()];

  return (
    <ToolbarView top={<HeaderBar title="About" />}>
      <article className={`${ui.page} ${ui.narrow}`}>
        <header className={ui.hero}>
          <div className={styles.mark} aria-hidden="true">
            <span />
          </div>
          <h1 className={ui.h1}>{hardware.hostname}</h1>
          <p className={ui.muted}>
            {hardware.user}@{hardware.hostname}
          </p>
        </header>

        <section className={ui.section} aria-labelledby="sys-hardware">
          <h2 id="sys-hardware" className={ui.groupTitle}>
            System Details
          </h2>
          <dl className={ui.list}>
            {specs.map((spec) => (
              <div key={spec.label} className={ui.property}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
          {PC_INTEREST && (
            <p className={`${ui.small} ${ui.muted} ${styles.note}`}>{PC_INTEREST} is on my CV — the 3D desk on the landing page is my own setup.</p>
          )}
        </section>

        <section className={ui.section} aria-labelledby="sys-site">
          <h2 id="sys-site" className={ui.groupTitle}>
            This Website
          </h2>
          <dl className={ui.list}>
            <div className={ui.property}>
              <dt>Built With</dt>
              <dd>{siteInfo.stack.join(', ')}</dd>
            </div>
            <div className={ui.property}>
              <dt>3D Model</dt>
              <dd>
                {siteInfo.model.description} {siteInfo.model.triangles} triangles.
              </dd>
            </div>
            <div className={ui.property}>
              <dt>Desktop</dt>
              <dd>{siteInfo.sourceNote}</dd>
            </div>
          </dl>
        </section>
      </article>
    </ToolbarView>
  );
}

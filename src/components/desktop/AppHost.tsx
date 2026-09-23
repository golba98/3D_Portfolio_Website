import { Suspense } from 'react';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { getApp } from '../../apps/registry';
import type { AppId, AppProps } from '../../types/apps';
import styles from './AppHost.module.css';

interface AppHostProps extends AppProps {
  appId: AppId;
}

/** Loads one app lazily, isolating its failures from the rest of the desktop. */
export function AppHost({ appId, arg, openApp, setTitle }: AppHostProps) {
  const { component: App, title } = getApp(appId);
  return (
    <ErrorBoundary fallback={<p className={styles.message}>{title} couldn't be opened. Please try again.</p>}>
      <Suspense
        fallback={
          <div className={styles.loading} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            <span className="visually-hidden">Loading {title}…</span>
          </div>
        }
      >
        <App arg={arg} openApp={openApp} setTitle={setTitle} />
      </Suspense>
    </ErrorBoundary>
  );
}

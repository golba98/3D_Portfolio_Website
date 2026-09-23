import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { getApp } from '../../apps/registry';
import { HeaderBar } from '../adw/HeaderBar';
import { ToolbarView } from '../adw/ToolbarView';
import type { AppId, AppProps } from '../../types/apps';
import styles from './AppHost.module.css';

interface AppHostProps extends AppProps {
  appId: AppId;
}

/** Loads one app lazily, isolating its failures from the rest of the desktop. */
export function AppHost({ appId, arg, openApp, setTitle }: AppHostProps) {
  const { component: App, title, chrome } = getApp(appId);
  // Until the app draws its own header bar, draw one so the window can still be moved and closed.
  const frame = (body: ReactNode) => (chrome ? body : <ToolbarView top={<HeaderBar title={title} />}>{body}</ToolbarView>);
  return (
    <ErrorBoundary fallback={frame(<p className={styles.message}>{title} couldn't be opened. Please try again.</p>)}>
      <Suspense
        fallback={frame(
          <div className={styles.loading} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            <span className="visually-hidden">Loading {title}…</span>
          </div>,
        )}
      >
        <App arg={arg} openApp={openApp} setTitle={setTitle} />
      </Suspense>
    </ErrorBoundary>
  );
}

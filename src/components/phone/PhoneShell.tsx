import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, type MotionValue } from 'framer-motion';
import { getApp } from '../../apps/registry';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSwipe } from '../../hooks/useSwipe';
import type { AppId } from '../../types/apps';
import { AppFrameContext, type MobileFrame } from '../adw/frame';
import { AppHost } from '../desktop/AppHost';
import { HomeScreen } from './HomeScreen';
import { handleHistoryPop, openFromDeepLink, usePhone, type RunningApp } from './phoneStore';
import { AppSwitcher } from './AppSwitcher';
import { ControlCentre } from './ControlCentre';
import { SearchSheet } from './SearchSheet';
import { StatusBar } from './StatusBar';
import styles from './PhoneShell.module.css';

interface PhoneShellProps {
  initialApp: AppId | null;
}

/**
 * Small screens get an iPhone instead of a desktop (it's an iPhone on the
 * desk): a status bar that pulls down Control Centre, a home screen of
 * widgets and a dock, full-screen apps that stay running in the background,
 * the home indicator along the bottom, an app switcher, and swipe-from-the-edge
 * to go back.
 */
export function PhoneShell({ initialApp }: PhoneShellProps) {
  const running = usePhone((s) => s.running);
  const active = usePhone((s) => s.active);
  const overlay = usePhone((s) => s.overlay);
  // How far the edge swipe has dragged the open app to the right.
  const edgeX = useMotionValue(0);

  useEffect(() => {
    if (initialApp) openFromDeepLink(initialApp);
    window.addEventListener('popstate', handleHistoryPop);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.defaultPrevented) usePhone.getState().back();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', handleHistoryPop);
      window.removeEventListener('keydown', onKey);
      usePhone.getState().reset();
    };
  }, [initialApp]);

  return (
    <div className={styles.shell} data-phone-shell="" data-app-open={active !== null}>
      <StatusBar />
      <div className={styles.stage}>
        <HomeScreen hidden={active !== null} />
        {running.map((app) => (
          <AppLayer key={`${app.id}-${app.key}`} app={app} visible={active === app.id} edgeX={edgeX} />
        ))}
        {active && <EdgeSwipe offset={edgeX} />}
      </div>
      <HomeBar />
      <AnimatePresence>
        {overlay === 'quick' && <ControlCentre key="quick" />}
        {overlay === 'switcher' && <AppSwitcher key="switcher" />}
        {overlay === 'search' && <SearchSheet key="search" />}
      </AnimatePresence>
    </div>
  );
}

interface AppLayerProps {
  app: RunningApp;
  visible: boolean;
  /** The edge swipe's drag, which the visible app follows. */
  edgeX: MotionValue<number>;
}

/** One running app, full screen. Hidden (not unmounted) while in the background. */
function AppLayer({ app, visible, edgeX }: AppLayerProps) {
  const reducedMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const def = getApp(app.id);
  const { id } = app;

  const frame = useMemo<MobileFrame>(
    () => ({
      kind: 'mobile',
      appTitle: def.title,
      back: () => usePhone.getState().back(),
      registerBack: (handler) => usePhone.getState().registerBack(id, handler),
    }),
    [id, def.title],
  );
  const openApp = useCallback((next: AppId, arg?: string) => usePhone.getState().open(next, arg), []);
  const setTitle = useCallback((title: string) => usePhone.getState().setTitle(id, title), [id]);

  // Grow out of the icon it was launched from, and shrink back into it.
  const origin = app.origin ?? { x: 0.5, y: 0.5 };
  const shrink = reducedMotion ? 1 : 0.3;

  return (
    <motion.section
      ref={section}
      className={styles.app}
      data-platform="ios"
      aria-label={def.title}
      tabIndex={-1}
      inert={!visible}
      style={{ transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`, x: visible ? edgeX : 0 }}
      initial="hidden"
      animate={visible ? 'shown' : 'hidden'}
      variants={{
        shown: { opacity: 1, scale: 1, borderRadius: 0, visibility: 'visible' },
        hidden: { opacity: 0, scale: shrink, borderRadius: 32, transitionEnd: { visibility: 'hidden' } },
      }}
      transition={{ duration: reducedMotion ? 0.15 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      // Hidden layers can't take focus, so it moves in once the app has grown in.
      onAnimationComplete={(definition) => {
        if (definition === 'shown') section.current?.focus({ preventScroll: true });
      }}
    >
      {/* The other apps draw their own (iOS-styled) header bars; the terminal gets a plain title bar. */}
      {def.chrome === 'kitty' && (
        <header className={styles.kittyBar}>
          <h2 className={styles.kittyTitle}>{app.title ?? def.title}</h2>
        </header>
      )}
      <div className={styles.appBody} data-chrome={def.chrome ?? 'adwaita'}>
        <AppFrameContext.Provider value={frame}>
          <AppHost appId={app.id} arg={app.arg} openApp={openApp} setTitle={setTitle} />
        </AppFrameContext.Provider>
      </div>
    </motion.section>
  );
}

/** How far the finger must travel from the left edge to count as Back. */
const BACK_DISTANCE = 90;

/**
 * Swipe in from the left edge to go back, as on an iPhone: the app follows
 * the finger, and past the threshold it goes back a page (or home).
 */
function EdgeSwipe({ offset }: { offset: MotionValue<number> }) {
  const reducedMotion = useReducedMotion();
  const settle = (): void => {
    void animate(offset, 0, { duration: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] });
  };
  const swipe = useSwipe({
    axis: 'x',
    onMove: (value) => offset.set(Math.max(0, value)),
    onEnd: (value, velocity) => {
      settle();
      if (value > BACK_DISTANCE || (value > 24 && velocity > 0.5)) usePhone.getState().back();
    },
    onCancel: settle,
  });

  return <div className={styles.edge} aria-hidden="true" {...swipe} />;
}

/** A long press on the home bar opens the app switcher. */
const LONG_PRESS_MS = 450;

/**
 * The home bar. Flick up (or tap) to go home; drag up and pause before
 * letting go, or long-press, for the app switcher, as on an iPhone.
 */
function HomeBar() {
  const appOpen = usePhone((s) => s.active !== null);
  const [lift, setLift] = useState(0);
  const pressTimer = useRef(0);
  const pressedLong = useRef(false);

  const cancelPress = (): void => window.clearTimeout(pressTimer.current);
  useEffect(() => cancelPress, []);

  const swipe = useSwipe({
    axis: 'y',
    onMove: (value) => {
      cancelPress();
      setLift(Math.min(0, value));
    },
    onEnd: (value, velocity) => {
      setLift(0);
      const { home, setOverlay } = usePhone.getState();
      // A finger that stopped before lifting (no velocity left) wants the switcher.
      if (value < -60 && Math.abs(velocity) < 0.3) setOverlay('switcher');
      else if (value < -24 || velocity < -0.3) home();
    },
    onCancel: () => setLift(0),
  });

  return (
    <div
      className={styles.homeBar}
      data-app-open={appOpen}
      {...swipe}
      onPointerDown={(event) => {
        swipe.onPointerDown(event);
        pressedLong.current = false;
        cancelPress();
        pressTimer.current = window.setTimeout(() => {
          pressedLong.current = true;
          usePhone.getState().setOverlay('switcher');
        }, LONG_PRESS_MS);
      }}
      onPointerUp={(event) => {
        cancelPress();
        swipe.onPointerUp(event);
      }}
      onPointerCancel={(event) => {
        cancelPress();
        swipe.onPointerCancel(event);
      }}
    >
      <button
        type="button"
        className={styles.homeHandle}
        aria-label="Home"
        onClick={() => {
          // The click that ends a long press isn't a tap.
          if (pressedLong.current) return;
          usePhone.getState().home();
        }}
        style={lift ? { transform: `translateY(${Math.max(lift * 0.25, -12)}px)` } : undefined}
      >
        <span aria-hidden="true" />
      </button>
      <button type="button" className={styles.switcherButton} onClick={() => usePhone.getState().setOverlay('switcher')}>
        Show open apps
      </button>
    </div>
  );
}

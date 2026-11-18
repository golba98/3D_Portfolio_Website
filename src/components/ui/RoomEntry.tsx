import { useEffect, useRef, useState } from 'react';
import { profile } from '../../data/profile';
import { useDetectedDevice } from '../../hooks/useEntryDevice';
import { useExperience } from '../../store/experience';
import type { EntryDevice } from '../../types/experience';
import styles from './RoomEntry.module.css';

const dismissedKey = 'portfolio-introduction-dismissed';

export function RoomEntry() {
  const phase = useExperience((s) => s.phase);
  const prompt = useExperience((s) => s.devicePrompt);
  const detected = useDetectedDevice();
  const [intro, setIntro] = useState(() => {
    try {
      return !localStorage.getItem(dismissedKey);
    } catch {
      return true;
    }
  });
  const [menu, setMenu] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const restore = useRef(false);
  const exploring = phase === 'exploring';
  useEffect(() => {
    if (exploring && !prompt && restore.current) {
      toggle.current?.focus({ preventScroll: true });
      restore.current = false;
    }
  }, [exploring, prompt]);

  function dismiss() {
    setIntro(false);
    try {
      localStorage.setItem(dismissedKey, '1');
    } catch {
      /* Session state still works. */
    }
    toggle.current?.focus();
  }
  function enter(device: EntryDevice) {
    const scene = useExperience.getState();
    if (device === detected) scene.enterDevice(device, false);
    else scene.askToEnter(device);
  }
  function roomAction(action: () => void) {
    restore.current = true;
    setMenu(false);
    action();
  }

  if (!['loading', 'intro', 'exploring'].includes(phase) || prompt) return null;
  return (
    <section
      className={styles.entry}
      aria-label="Portfolio"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && menu) {
          e.stopPropagation();
          setMenu(false);
          toggle.current?.focus();
        }
      }}
    >
      {intro && (
        <div className={styles.identity}>
          <div>
            <span>{profile.role} · Eastern Cape</span>
            <h1>{profile.name}</h1>
          </div>
          <button type="button" onClick={dismiss} aria-label="Dismiss introduction">
            ×
          </button>
          <p>{profile.headline.join(' ')}</p>
        </div>
      )}
      <div className={styles.actions}>
        <a className={styles.primary} href="#/desktop/projects">
          View projects <span aria-hidden="true">↗</span>
        </a>
        <button
          ref={toggle}
          type="button"
          aria-expanded={menu}
          aria-controls="room-options"
          onClick={() => setMenu(!menu)}
        >
          Portfolio <span aria-hidden="true">{menu ? '⌃' : '⌄'}</span>
        </button>
      </div>
      <nav id="room-options" hidden={!menu} aria-label="Portfolio destinations">
        <div className={styles.links}>
          <a href="#/desktop/about">About Jordan</a>
          <a href={profile.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a href={profile.resumeUrl} download>
            Download CV (PDF)
          </a>
          <a href="#/desktop/contact">Contact</a>
        </div>
        {exploring && (
          <div className={styles.links}>
            <button onClick={() => roomAction(() => enter('monitor'))}>Enter monitor</button>
            <button onClick={() => roomAction(() => enter('phone'))}>Enter phone</button>
            <button onClick={() => roomAction(useExperience.getState().openBoard)}>Draw on board</button>
            <button onClick={() => roomAction(useExperience.getState().inspectShelf)}>Inspect bottom shelf</button>
          </div>
        )}
      </nav>
    </section>
  );
}

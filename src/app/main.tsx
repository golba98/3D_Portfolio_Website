import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Inter is the typeface GNOME's Adwaita Sans is built on; one variable file covers every weight.
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '../styles/tokens.css';
import '../styles/global.css';
import { App } from './App';

// A redeploy deletes the previous build's hashed chunks, so a tab opened before
// it fails to lazy-load the desktop or an app. Reload once to pick up the new
// build; the timestamp stops a reload loop if the chunk is genuinely unreachable.
window.addEventListener('vite:preloadError', (event) => {
  const RELOAD_KEY = 'chunk-reload-at';
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

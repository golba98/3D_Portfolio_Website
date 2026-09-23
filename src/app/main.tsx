import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Inter is the typeface GNOME's Adwaita Sans is built on; one variable file covers every weight.
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '../styles/tokens.css';
import '../styles/global.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { formatPath, HOME_PATH } from '../../data/filesystem';
import type { AppProps } from '../../types/apps';
import type { FsPath } from '../../types/filesystem';
import { COMMANDS, complete, tokenize, WELCOME, type OutputLine, type ShellContext } from './commands';
import { Banner } from './Banner';
import styles from './Terminal.module.css';

interface Entry {
  id: number;
  /** Prompt + command, or command output. */
  kind: 'input' | 'output';
  cwd?: FsPath;
  /** Exit status of the previous command, which the prompt shows. */
  status?: number;
  line: OutputLine;
}

const MAX_ENTRIES = 600;

let entryId = 0;
const makeEntries = (kind: Entry['kind'], rows: OutputLine[], cwd?: FsPath, status?: number): Entry[] =>
  rows.map((line) => ({ id: entryId++, kind, cwd, status, line }));

/** zsh's `%1~`: `~` at home, otherwise the last path segment. */
const shortPath = (cwd: FsPath): string => {
  const full = formatPath(cwd);
  return full === '~' || full === '/' ? full : full.slice(full.lastIndexOf('/') + 1);
};

const failed = (output: OutputLine[]): boolean =>
  output.some((line) => line.some((segment) => typeof segment !== 'string' && segment.tone === 'error'));

/** The prompt from my ~/.zshrc: `OK ~ > `, or `ERR 127 ~ > ` after a failure. */
function Prompt({ cwd, status }: { cwd: FsPath; status: number }) {
  return (
    <span className={styles.prompt} aria-hidden="true">
      {status === 0 ? <span className={styles.ok}>OK</span> : <span className={styles.err}>ERR {status}</span>}{' '}
      <span className={styles.path}>{shortPath(cwd)}</span> &gt;&nbsp;
    </span>
  );
}

function Line({ line }: { line: OutputLine }) {
  return (
    <>
      {line.map((segment, i) => {
        if (typeof segment === 'string') return <span key={i}>{segment}</span>;
        if (segment.href) {
          const external = /^https?:/.test(segment.href);
          return (
            <a key={i} className={styles.link} href={segment.href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
              {segment.text}
            </a>
          );
        }
        return (
          <span key={i} className={segment.tone ? styles[segment.tone] : undefined}>
            {segment.text}
          </span>
        );
      })}
    </>
  );
}

export default function Terminal({ openApp, setTitle }: AppProps) {
  const [entries, setEntries] = useState<Entry[]>(() => makeEntries('output', WELCOME));
  const [cwd, setCwd] = useState<FsPath>(HOME_PATH);
  const [status, setStatus] = useState(0);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [openedAt] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [entries]);

  // kitty shows the shell's directory in the title bar.
  useEffect(() => {
    setTitle?.(`❯ ${shortPath(cwd)}`);
  }, [cwd, setTitle]);

  const append = (rows: Entry[]): void => setEntries((prev) => [...prev, ...rows].slice(-MAX_ENTRIES));
  // My ~/.zshrc's clear() redraws the banner after clearing, so the top section stays.
  const clearScreen = (): void => setEntries(makeEntries('output', WELCOME));

  const run = (raw: string): void => {
    const command = raw.trim();
    const echo = makeEntries('input', [[raw]], cwd, status);
    if (!command) {
      append(echo);
      return;
    }
    const [name = '', ...args] = tokenize(command);
    const nextHistory = [...history, command];
    setHistory(nextHistory);

    let cleared = false;
    let nextCwd = cwd;
    const ctx: ShellContext = {
      cwd,
      setCwd: (path) => {
        nextCwd = path;
      },
      history: nextHistory,
      openApp,
      clear: () => {
        cleared = true;
      },
      uptime: () => (Date.now() - openedAt) / 1000,
    };

    const handler = COMMANDS[name];
    const output = handler ? handler.run(args, ctx) : [[{ text: `zsh: command not found: ${name}`, tone: 'error' as const }]];
    setStatus(handler ? (failed(output) ? 1 : 0) : 127);
    setCwd(nextCwd);
    if (cleared) {
      clearScreen();
    } else {
      append([...echo, ...makeEntries('output', output)]);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      run(input);
      setInput('');
      setHistoryIndex(null);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const index = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(history[index] ?? '');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) return;
      const index = historyIndex + 1;
      if (index >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(index);
        setInput(history[index] ?? '');
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const result = complete(input, cwd);
      setInput(result.value);
      if (result.options.length > 0) {
        append([...makeEntries('input', [[input]], cwd, status), ...makeEntries('output', [[result.options.join('  ')]])]);
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      clearScreen();
    } else if (event.key === 'c' && event.ctrlKey && !window.getSelection()?.toString()) {
      event.preventDefault();
      append(makeEntries('input', [[`${input}^C`]], cwd, status));
      setInput('');
    }
  };

  return (
    // Clicking anywhere in the terminal focuses the prompt (unless selecting text).
    <div
      className={styles.terminal}
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus();
      }}
    >
      <div className={styles.log} role="log" aria-live="polite" aria-label="Terminal output">
        <Banner />
        {entries.map((entry) => (
          <div key={entry.id} className={styles.row}>
            {entry.kind === 'input' && entry.cwd && <Prompt cwd={entry.cwd} status={entry.status ?? 0} />}
            <Line line={entry.line} />
          </div>
        ))}
      </div>
      <div className={styles.inputRow}>
        <Prompt cwd={cwd} status={status} />
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setHistoryIndex(null);
          }}
          onKeyDown={onKeyDown}
          aria-label={`Command input, current directory ${formatPath(cwd)}`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}

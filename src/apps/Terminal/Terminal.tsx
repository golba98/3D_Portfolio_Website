import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { formatPath, HOME_PATH } from '../../data/filesystem';
import { useMediaQuery } from '../../hooks/useMediaQuery';
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

/** One-tap commands for touch screens, where typing into a shell is a chore. */
const QUICK_COMMANDS = ['help', 'about', 'projects', 'skills', 'neofetch', 'ls', 'contact', 'clear'] as const;

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

/** Characters per line: JetBrains Mono's advance is 0.6em. */
function measureColumns(element: HTMLElement | null): number {
  if (!element) return 80;
  const style = getComputedStyle(element);
  const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  return Math.floor(width / (parseFloat(style.fontSize) * 0.6));
}

export default function Terminal({ openApp, setTitle }: AppProps) {
  const [entries, setEntries] = useState<Entry[]>(() => makeEntries('output', WELCOME));
  const [cwd, setCwd] = useState<FsPath>(HOME_PATH);
  const [status, setStatus] = useState(0);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [openedAt] = useState(() => Date.now());
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // On a phone the on-screen keyboard only opens when asked for, and chips do the typing.
  const touch = useMediaQuery('(pointer: coarse)');

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
      columns: measureColumns(terminalRef.current),
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

  const historyStep = (direction: -1 | 1): void => {
    if (direction === -1) {
      if (history.length === 0) return;
      const index = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(history[index] ?? '');
      return;
    }
    if (historyIndex === null) return;
    const index = historyIndex + 1;
    if (index >= history.length) {
      setHistoryIndex(null);
      setInput('');
    } else {
      setHistoryIndex(index);
      setInput(history[index] ?? '');
    }
  };

  const completeInput = (): void => {
    const result = complete(input, cwd);
    setInput(result.value);
    if (result.options.length > 0) {
      append([...makeEntries('input', [[input]], cwd, status), ...makeEntries('output', [[result.options.join('  ')]])]);
    }
  };

  const submit = (command: string): void => {
    run(command);
    setInput('');
    setHistoryIndex(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit(input);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      historyStep(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      historyStep(1);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      completeInput();
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
    // Clicking anywhere in the terminal focuses the prompt (unless selecting text,
    // or on a touch screen, where that would throw up the keyboard on every tap).
    <div
      ref={terminalRef}
      className={styles.terminal}
      data-touch={touch}
      onClick={() => {
        if (!touch && !window.getSelection()?.toString()) inputRef.current?.focus();
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
      <div className={styles.inputRow} onClick={() => inputRef.current?.focus()}>
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
          enterKeyHint="send"
          autoFocus={!touch}
        />
      </div>
      {touch && (
        <div className={styles.keys} role="toolbar" aria-label="Quick commands">
          {QUICK_COMMANDS.map((command) => (
            <button key={command} type="button" className={styles.key} onClick={() => submit(command)}>
              {command}
            </button>
          ))}
          <span className={styles.keySeparator} aria-hidden="true" />
          <button type="button" className={styles.key} aria-label="Previous command" onClick={() => historyStep(-1)}>
            ↑
          </button>
          <button type="button" className={styles.key} aria-label="Complete" onClick={completeInput}>
            ⇥
          </button>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

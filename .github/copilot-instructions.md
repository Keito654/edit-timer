## AI coding agent guide for this repo (edit-timer)

This is a VS Code extension that measures per-file editing time. It’s bundled with esbuild to `dist/extension.js` and uses a simple global timer loop (1s) to refresh UI.

### Architecture (big picture)

- Entry point: `src/extension.ts`
  - Registers commands, status bars, tree view, and webviews.
  - Starts a 1s interval to refresh the tree view and status bar while tracking is on.
  - Keeps a VS Code context key `editTimer.isTracking` in sync with store state (used by `package.json` menu “when” clauses).
- State management: `src/app/store.ts` with `zustand/vanilla` combining three slices (files not shown here but referenced across UI):
  - `fileTimeTracker` (time per file; selectors used to compute totals)
  - `isTracking` (boolean flag)
  - `excludeFile` (Set of excluded `fsPath`s)
  - `immer.enableMapSet()` is enabled; maps/sets are used in state.
- Selectors/utilities used across UI:
  - `getTotalTime(state, { now })` and `getTime(state, { now, fsPath })` from `src/features/time-tracking/selector`.
  - `formatTime(ms)` from `src/utils.ts` for rendering time strings.
- UI surfaces:
  - Explorer tree view `timeTrackerView`: `src/ui/treeDataProvider.ts` (shows total time and active files).
  - Status bar timer: `src/ui/timerStatusBar.ts` (right-aligned, shows total | current-file time, icon reflects tracking).
  - Exclude status bar: `src/ui/excludeFileStatusBar.ts` (toggles excluded/tracked for current file).
  - Floating timer WebView: `src/ui/floatingTimeWebView.ts` (lightweight live timer panel beside editor).
  - Time card WebView: `src/ui/timeCardWebView.ts` (generates an SVG “card” of totals/top files).

### Design principles (project-specific)

- Functional-first: Components and utilities are written in a functional style (pure functions where possible, immutable updates). Avoid hidden state in UI code; pass values explicitly.
- Flux-like with Zustand: State flows one-way via `store` (Zustand vanilla). UI dispatches actions; selectors derive view data. Do not mutate state directly from UI.
- Business logic in slices: Put domain logic (time accumulation, switching, pause/resume, exclude) in each feature’s `slice.ts` and expose actions/selectors from there. Keep UI files thin (read state, call actions, render).

### Commands and context keys

Defined in `package.json` → `contributes.commands` and used throughout `src/extension.ts`:

- `editTimer.toggle` / `editTimer.pause` / `editTimer.resume` toggle tracking; ALWAYS update context `editTimer.isTracking` after state changes.
- `editTimer.refreshView` triggers tree refresh.
- `editTimer.openPanel` focuses the explorer view hosting `timeTrackerView`.
- `editTimer.generateTimeCard` opens time card preview webview.
- `editTimer.showFloatingTimer` opens floating timer webview.
- `editTimer.toggleExclude` opens quick-pick flow to exclude/include files; after changes, refresh the view and restart timer for the active editor if present.

### State/actions contracts (as used in code)

Actions are invoked from UI with explicit timestamps (pass `Date.now()`):

- `startTimer({ now, fsPath })`, `switchTimer({ now, fsPath })`, `stopTimer({ now })`
- `switchTracking({ now, fsPath })`, `pause({ now })`, `resume({ now, fsPath })`, `reset()`
- `switchExclude(filePath: string)`; excluded files live in `store.getState().excludeFiles: Set<string>`
  Selectors return milliseconds; pass `now` to include in-flight durations:
- `getTotalTime(state, { now })`, `getTime(state, { now, fsPath })`
  Formatting:
- `formatTime(ms | null)` from `src/utils.ts` is the canonical renderer (HH:MM:SS) — do not reinvent.

Example (pattern used across UI):

```ts
const state = store.getState();
const now = Date.now();
const total = formatTime(getTotalTime(state, { now }));
const current = activeFsPath
  ? formatTime(getTime(state, { now, fsPath: activeFsPath }))
  : "--:--:--";
```

### Refresh model (why it looks this way)

- Instead of store subscriptions, the extension uses a single `setInterval(..., 1000)` to refresh the tree and status bar when tracking. Webviews also run their own 1s loop while visible. Follow this cadence for consistency when adding UI.
- On editor changes (`onDidChangeActiveTextEditor`), timers are switched or stopped; then UI is re-rendered.
- Keep `editTimer.isTracking` context synchronized whenever tracking state changes to maintain correct menu visibility.

### Build, run, and dev workflow

- Install deps: `pnpm install`
- Dev build (watch):
  - VS Code task: `watch` (runs `watch:tsc` and `watch:esbuild` in parallel)
  - Or terminal: `pnpm run watch`
- Lint/types: `pnpm run lint`, `pnpm run check-types`
- Production bundle: `pnpm run package` → outputs `dist/extension.js`
- Launch Extension Host: F5 in VS Code (no custom `launch.json` required for basic run)

### Adding features safely

- Use existing selectors and `formatTime` for any time math/formatting.
- Always pass `{ now: Date.now() }` into actions/selectors to avoid drift.
- After toggling tracking or exclude state, refresh view and (if applicable) restart/stop timers consistently with current editor.
- When adding commands/UI, update `package.json` contributes and leverage the `editTimer.isTracking` context for menu `when` clauses.
- For webviews, post messages to update and clean up intervals/timeouts on dispose (see both webview files for the pattern).

## AI coding agent guide for this repo (edit-timer)## AI coding agent guide for t### Design principles (project-specific)

This is a VS Code extension that measures per-file editing time. It's bundled with esbuild to `dist/extension.js` and uses a simple global timer loop (1s) to refresh UI.- Functional-first: Components and utilities are written in a functional style (pure functions where possible, immutable updates). Avoid hidden state in UI code; pass values explicitly.

- Flux-like with Zustand: State flows one-way via `store` (Zustand vanilla). UI dispatches actions; selectors derive view data. Do not mutate state directly from UI.

### Architecture (big picture)- Business logic in slices: Put domain logic (time accumulation, switching, pause/resume, exclude) in each feature's `slice.ts` and expose actions/selectors from there. Keep UI files thin (read state, call actions, render).

- Integration layer pattern: Extension initialization is decomposed into modules (`registerCommands`, `registerEditorEvents`, `persistence`) that accept dependencies via function parameters, enabling testability and clear separation of concerns.epo (edit-timer)

- Entry point: `src/extension.ts`
  - Delegates to integration modules: `registerCommands`, `registerEditorEvents`, and persistence manager.This is a VS Code extension that measures per-file editing time. It's bundled with esbuild to `dist/extension.js` and uses a simple global timer loop (1s) to refresh UI.

  - Starts a global 1s interval timer to refresh tree view and status bar while tracking is on.

  - Keeps VS Code context key `editTimer.isTracking` synchronized with store state (used by `package.json` menu "when" clauses).### Architecture (big picture)

- State management: `src/store/index.ts` with `zustand/vanilla` combining three feature slices:
  - `fileTimeTracker` (time per file; Map<FsPath, Timer> with selectors for totals)- Entry point: `src/extension.ts`

  - `isTracking` (boolean flag) - Delegates to integration modules: `registerCommands`, `registerEditorEvents`, and persistence manager.

  - `excludeFiles` (Set of excluded `fsPath`s) - Starts a global 1s interval timer to refresh tree view and status bar while tracking is on.

  - `immer.enableMapSet()` is enabled; Maps/Sets are used in state. - Keeps VS Code context key `editTimer.isTracking` synchronized with store state (used by `package.json` menu "when" clauses).

- Selectors/utilities used across UI:- State management: `src/store/index.ts` with `zustand/vanilla` combining three feature slices:
  - `getTotalTime(state, { now })` and `getTime(state, { now, fsPath })` from `src/features/time-tracking/selector`. - `fileTimeTracker` (time per file; Map<FsPath, Timer> with selectors for totals)

  - `formatTime(ms)` from `src/utils.ts` for rendering time strings. - `isTracking` (boolean flag)

- Integration layer (`src/integration/`): - `excludeFiles` (Set of excluded `fsPath`s)
  - `registerCommands.ts`: Command registration with dependency injection pattern. - `immer.enableMapSet()` is enabled; Maps/Sets are used in state.

  - `registerEditorEvents.ts`: Editor change events handling.- Selectors/utilities used across UI:

  - `persistence.ts`: Workspace state save/load with automatic periodic saves. - `getTotalTime(state, { now })` and `getTime(state, { now, fsPath })` from `src/features/time-tracking/selector`.

- UI surfaces (`src/integration/views/`): - `formatTime(ms)` from `src/utils.ts` for rendering time strings.
  - Explorer tree view `timeTrackerView`: `treeDataProvider.ts` (shows total time and active files).- Integration layer (`src/integration/`):

  - Status bar timer: `timerStatusBar.ts` (right-aligned, shows total | current-file time, icon reflects tracking). - `registerCommands.ts`: Command registration with dependency injection pattern.

  - Exclude status bar: `excludeFileStatusBar.ts` (toggles excluded/tracked for current file). - `registerEditorEvents.ts`: Editor change events handling.

  - Floating timer WebView: `floatingTimeWebView.ts` (lightweight live timer panel beside editor). - `persistence.ts`: Workspace state save/load with automatic periodic saves.

  - Time card WebView: `timeCardWebView.ts` (generates an SVG "card" of totals/top files).- UI surfaces (`src/integration/views/`):

  - Exclude file dialog: `excludeFileDialog.ts` (quick-pick interface for file exclusion). - Explorer tree view `timeTrackerView`: `treeDataProvider.ts` (shows total time and active files).

  - Status bar timer: `timerStatusBar.ts` (right-aligned, shows total | current-file time, icon reflects tracking).

### Design principles (project-specific) - Exclude status bar: `excludeFileStatusBar.ts` (toggles excluded/tracked for current file).

- Floating timer WebView: `floatingTimeWebView.ts` (lightweight live timer panel beside editor).

- Functional-first: Components and utilities are written in a functional style (pure functions where possible, immutable updates). Avoid hidden state in UI code; pass values explicitly. - Time card WebView: `timeCardWebView.ts` (generates an SVG "card" of totals/top files).

- Flux-like with Zustand: State flows one-way via `store` (Zustand vanilla). UI dispatches actions; selectors derive view data. Do not mutate state directly from UI. - Exclude file dialog: `excludeFileDialog.ts` (quick-pick interface for file exclusion).

- Business logic in slices: Put domain logic (time accumulation, switching, pause/resume, exclude) in each feature's `slice.ts` and expose actions/selectors from there. Keep UI files thin (read state, call actions, render).

- Integration layer pattern: Extension initialization is decomposed into modules (`registerCommands`, `registerEditorEvents`, `persistence`) that accept dependencies via function parameters, enabling testability and clear separation of concerns.### Design principles (project-specific)

### Commands and context keys- Functional-first: Components and utilities are written in a functional style (pure functions where possible, immutable updates). Avoid hidden state in UI code; pass values explicitly.

- Flux-like with Zustand: State flows one-way via `store` (Zustand vanilla). UI dispatches actions; selectors derive view data. Do not mutate state directly from UI.

Defined in `package.json` → `contributes.commands` and used throughout `src/integration/registerCommands.ts`:- Business logic in slices: Put domain logic (time accumulation, switching, pause/resume, exclude) in each feature’s `slice.ts` and expose actions/selectors from there. Keep UI files thin (read state, call actions, render).

- `editTimer.toggle` / `editTimer.pause` / `editTimer.resume` toggle tracking; ALWAYS update context `editTimer.isTracking` after state changes.### Commands and context keys

- `editTimer.refreshView` triggers tree refresh.

- `editTimer.openPanel` focuses the explorer view hosting `timeTrackerView`.Defined in `package.json` → `contributes.commands` and used throughout `src/integration/registerCommands.ts`:

- `editTimer.generateTimeCard` opens time card preview webview.

- `editTimer.showFloatingTimer` opens floating timer webview.- `editTimer.toggle` / `editTimer.pause` / `editTimer.resume` toggle tracking; ALWAYS update context `editTimer.isTracking` after state changes.

- `editTimer.toggleExclude` opens quick-pick flow to exclude/include files; after changes, refresh view and restart timer for active editor if present.- `editTimer.refreshView` triggers tree refresh.

- `editTimer.reset` / `editTimer.saveData` for manual data management.- `editTimer.openPanel` focuses the explorer view hosting `timeTrackerView`.

- `editTimer.generateTimeCard` opens time card preview webview.

### State/actions contracts (as used in code)- `editTimer.showFloatingTimer` opens floating timer webview.

- `editTimer.toggleExclude` opens quick-pick flow to exclude/include files; after changes, refresh view and restart timer for active editor if present.

Actions are invoked from UI with explicit timestamps (pass `Date.now()`):- `editTimer.reset` / `editTimer.saveData` for manual data management.

- `startTimer({ now, fsPath })`, `switchTimer({ now, fsPath })`, `stopTimer({ now })`### State/actions contracts (as used in code)

- `switchTracking({ now, fsPath })`, `pause({ now })`, `resume({ now, fsPath })`, `reset()`

- `switchExclude(filePath: string)`; excluded files live in `store.getState().excludeFiles: Set<string>`Actions are invoked from UI with explicit timestamps (pass `Date.now()`):

  Selectors return milliseconds; pass `now` to include in-flight durations:

- `getTotalTime(state, { now })`, `getTime(state, { now, fsPath })`- `startTimer({ now, fsPath })`, `switchTimer({ now, fsPath })`, `stopTimer({ now })`

  Formatting:- `switchTracking({ now, fsPath })`, `pause({ now })`, `resume({ now, fsPath })`, `reset()`

- `formatTime(ms | null)` from `src/utils.ts` is the canonical renderer (HH:MM:SS) — do not reinvent.- `switchExclude(filePath: string)`; excluded files live in `store.getState().excludeFiles: Set<string>`

  Selectors return milliseconds; pass `now` to include in-flight durations:

Example (pattern used across UI):- `getTotalTime(state, { now })`, `getTime(state, { now, fsPath })`

Formatting:

```ts- `formatTime(ms | null)`from`src/utils.ts` is the canonical renderer (HH:MM:SS) — do not reinvent.

const state = store.getState();

const now = Date.now();Example (pattern used across UI):

const total = formatTime(getTotalTime(state, { now }));

const current = activeFsPath```ts

? formatTime(getTime(state, { now, fsPath: activeFsPath }))const state = store.getState();

: "--:--:--";const now = Date.now();

````const total = formatTime(getTotalTime(state, { now }));

const current = activeFsPath

### Refresh model (why it looks this way)  ? formatTime(getTime(state, { now, fsPath: activeFsPath }))

  : "--:--:--";

- Instead of store subscriptions, the extension uses a single `setInterval(..., 1000)` to refresh the tree and status bar when tracking. Webviews also run their own 1s loop while visible. Follow this cadence for consistency when adding UI.```

- On editor changes (`onDidChangeActiveTextEditor`), timers are switched or stopped; then UI is re-rendered.

- Keep `editTimer.isTracking` context synchronized whenever tracking state changes to maintain correct menu visibility.### Refresh model (why it looks this way)



### Build, run, and dev workflow- Instead of store subscriptions, the extension uses a single `setInterval(..., 1000)` to refresh the tree and status bar when tracking. Webviews also run their own 1s loop while visible. Follow this cadence for consistency when adding UI.

- On editor changes (`onDidChangeActiveTextEditor`), timers are switched or stopped; then UI is re-rendered.

- Install deps: `pnpm install`- Keep `editTimer.isTracking` context synchronized whenever tracking state changes to maintain correct menu visibility.

- Dev build (watch):

  - VS Code task: `watch` (runs `watch:tsc` and `watch:esbuild` in parallel)### Build, run, and dev workflow

  - Or terminal: `pnpm run watch`

- Lint/types: `pnpm run lint`, `pnpm run check-types`- Install deps: `pnpm install`

- Production bundle: `pnpm run package` → outputs `dist/extension.js`- Dev build (watch):

- Launch Extension Host: F5 in VS Code (no custom `launch.json` required for basic run)  - VS Code task: `watch` (runs `watch:tsc` and `watch:esbuild` in parallel)

  - Or terminal: `pnpm run watch`

### Adding features safely- Lint/types: `pnpm run lint`, `pnpm run check-types`

- Production bundle: `pnpm run package` → outputs `dist/extension.js`

- Use existing selectors and `formatTime` for any time math/formatting.- Launch Extension Host: F5 in VS Code (no custom `launch.json` required for basic run)

- Always pass `{ now: Date.now() }` into actions/selectors to avoid drift.

- After toggling tracking or exclude state, refresh view and (if applicable) restart/stop timers consistently with current editor.### Adding features safely

- When adding commands/UI, update `package.json` contributes and leverage the `editTimer.isTracking` context for menu `when` clauses.

- For webviews, post messages to update and clean up intervals/timeouts on dispose (see both webview files for the pattern).- Use existing selectors and `formatTime` for any time math/formatting.
- Always pass `{ now: Date.now() }` into actions/selectors to avoid drift.
- After toggling tracking or exclude state, refresh view and (if applicable) restart/stop timers consistently with current editor.
- When adding commands/UI, update `package.json` contributes and leverage the `editTimer.isTracking` context for menu `when` clauses.
- For webviews, post messages to update and clean up intervals/timeouts on dispose (see both webview files for the pattern).
````

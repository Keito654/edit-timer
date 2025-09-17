# Edit Timer - Core Architecture Details

## State Flow & Data Pattern

### Store Structure
```typescript
// Zustand vanilla store with 3 slices
type GlobalStore = 
  FileTimeTracker &  // Map<FsPath, Timer> + selectors
  IsTracking &       // boolean + toggle actions
  ExcludeFileSlice;  // Set<string> + exclude actions
```

### Timer Data Model
```typescript
interface Timer {
  startTime: number;
  accumulated: number;
  isActive: boolean;
}
```

### Key Selectors
- `getTotalTime(state, { now })`: Total time across all files
- `getTime(state, { now, fsPath })`: Time for specific file
- `formatTime(ms)`: Time display format conversion (HH:MM:SS)

## Integration Modules

### Command Registration Pattern
```typescript
// Dependency injection pattern for testability
registerCommands(context, {
  timer: { start, stop },
  statusBars: { timerStatusBar, excludeFileStatusBar },
  treeProvider,
  persistence: { saveNow }
});
```

### Editor Events Handling
- `onDidChangeActiveTextEditor`: Timer operations on file switching
- Flow: Editor change → Timer switch → UI update

### Persistence Pattern
- Automatic workspace state saving
- Periodic persistence (interval-based)
- Manual control via initialize/saveNow methods

## UI Components

### Global Timer (1-second interval)
- Synchronized updates for tree view and status bar
- Only active during tracking
- Unified refresh via `setInterval(..., 1000)`

### WebView Components
- `floatingTimeWebView`: Lightweight floating timer
- `timeCardWebView`: SVG format time card generation
- Self-updating with independent 1-second timers

### Context Key Management
- `editTimer.isTracking`: Used in package.json "when" clauses
- Synchronized updates on state changes are critical

## Design Patterns Applied

### Slice Pattern
Each feature slice includes:
- State type definition
- Actions (reducers)
- Create function for store integration

### Functional Architecture
- Unidirectional flow: UI → Actions → State → Selectors → UI
- Side effect isolation (timers, persistence, UI updates)
- Pure functions for calculation logic
# Edit Timer - Project Overview

## Purpose
Edit Timer is a VS Code extension that measures and tracks editing time per file. It helps developers visualize their work time at the file level and supports work efficiency analysis.

## Key Features
- Per-file editing time measurement
- Display of total time and active file time
- File exclusion functionality
- Pause/resume tracking
- Floating timer display
- Time card generation (SVG format)
- Tree view time display
- Status bar integration

## Architecture Overview
This project emphasizes feature separation and testability:

### Entry Point
- `src/extension.ts`: Main entry point for VS Code extension
- Lifecycle management via activate/deactivate functions

### State Management
- Uses Zustand vanilla store
- Composed of 3 feature slices:
  - `fileTimeTracker`: Per-file time management (Map<FsPath, Timer>)
  - `isTracking`: Tracking state (boolean)
  - `excludeFiles`: Excluded file management (Set<string>)

### Feature Slices Pattern
Each feature is managed by independent slices (`slice.ts`):
- `features/time-tracking/`: Time measurement logic
- `features/tracking-state/`: Tracking state management
- `features/file-exclusion/`: File exclusion functionality

### Integration Layer
- `integration/registerCommands.ts`: Command registration
- `integration/registerEditorEvents.ts`: Editor event handling
- `integration/persistence.ts`: Data persistence
- `integration/views/`: UI component collection

### Design Principles
1. **Functional-first**: Prioritize pure functions, immutable updates
2. **Flux-like pattern**: Unidirectional data flow
3. **Dependency Injection**: Focus on testability
4. **Business Logic in Slices**: Centralize domain logic in slices
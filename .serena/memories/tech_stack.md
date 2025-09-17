# Edit Timer - Tech Stack

## Primary Technologies
- **TypeScript**: Type-safe JavaScript with strict typing
- **VS Code Extension API**: Extension development framework
- **Zustand (vanilla)**: Lightweight state management library
- **Immer**: Immutable state updates (Map/Set support enabled)

## Build Tools
- **esbuild**: Fast bundler (outputs to `dist/extension.js`)
- **TypeScript Compiler**: Type checking (`--noEmit`)
- **pnpm**: Package manager
- **npm-run-all**: Parallel task execution

## Development Tools
- **ESLint**: Code quality checking (TypeScript support)
- **Prettier**: Code formatter
- **lefthook**: Git hooks management
- **Vitest**: Testing framework (configured but currently unused)

## Runtime Dependencies
- **ts-stopwatch**: Time measurement utility

## Target Environment
- **Target**: ES2022
- **Module**: Node16
- **Platform**: VS Code Extension Host

## File Structure
```
src/
├── extension.ts          # Main entry point
├── globalTimer.ts        # Global timer management
├── types.ts             # Type definitions
├── utils.ts             # Utility functions
├── store/
│   └── index.ts         # Zustand store configuration
├── features/            # Feature slices
│   ├── time-tracking/
│   ├── tracking-state/
│   └── file-exclusion/
└── integration/         # Integration layer
    ├── persistence.ts
    ├── registerCommands.ts
    ├── registerEditorEvents.ts
    └── views/           # UI components
```
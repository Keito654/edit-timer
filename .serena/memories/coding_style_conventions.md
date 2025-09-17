# Edit Timer - Coding Style & Conventions

## Language & Type System
- **TypeScript strict mode**: Strict type checking
- **ESLint + TypeScript**: TypeScript-specific lint configuration
- **Prettier**: Consistent code formatting

## Functional Programming Principles
- **Pure Functions**: Prioritize side-effect-free functions
- **Immutable Updates**: Use Immer for immutable state updates
- **Explicit Dependencies**: Pass dependencies explicitly

## State Management Patterns
- **Zustand Vanilla Store**: State management without React dependency
- **Slice Pattern**: Separate slices by feature
- **Action/Selector Pattern**: Clear separation of actions and selectors

## Naming Conventions
- **Functions**: camelCase (`startTimer`, `getTotalTime`)
- **Types/Interfaces**: PascalCase (`Timer`, `FileTimeTracker`)
- **Constants**: camelCase for immutable values
- **File Names**: kebab-case (`time-tracking`, `exclude-file`)

## Code Organization
- **Feature-based Structure**: Organize by feature directories
- **Integration Layer**: Separate UI/external API integration
- **Dependency Injection**: Use dependency injection for testability

## State Update Pattern
```typescript
// Always pass timestamp when calling actions
const now = Date.now();
store.getState().startTimer({ now, fsPath });

// Also pass now when using selectors
const totalTime = getTotalTime(state, { now });
```

## Error Handling
- Explicit error handling
- Proper handling of VS Code API errors
- User-facing message internationalization (Japanese comments used)

## Documentation
- **Japanese Comments**: For business logic explanation
- **TypeScript Types**: Self-documenting through types
- **README**: English overview description

## Testing Patterns (Prepared)
- Vitest configured (currently unused)
- Testability ensured through dependency injection pattern
- Focus on pure function unit testing
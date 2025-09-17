# Edit Timer - Task Completion Checklist

## Commands to Run After Implementation

### 1. Code Quality Check
```bash
# Type checking
pnpm run check-types

# Lint checking (with auto-fix)
pnpm run lint

# Code formatting
pnpm run format
```

### 2. Build Verification
```bash
# Development build (run all steps)
pnpm run compile

# Production build verification (for important changes)
pnpm run package
```

### 3. Functional Testing
- Launch Extension Host with F5
- Test core functionality:
  - Timer start/stop
  - Time switching when changing files
  - Tree view display
  - Status bar display

### 4. Git Hooks Compliance
- lefthook pre-commit hooks will execute
- Automatic checks before commit

## Checkpoint Items

### State Management
- Are `Date.now()` timestamps properly passed during state changes?
- Is `editTimer.isTracking` context key synchronized?
- Are UI updates and timer restarts properly handled?

### UI Consistency
- Consistent display between status bar and tree view
- Unified time formatting (use `formatTime()`)
- Consistent 1-second update timing

### Performance
- No unnecessary file reads?
- No memory leaks (event listeners, timers)?
- Check build output file size

### Error Cases
- Handle cases when files don't exist
- Handle inactive editor scenarios
- Proper excluded file handling

## Pre-Release Checklist
1. Update CHANGELOG.md
2. Update package.json version
3. Verify production build functionality
4. Regression testing of core features
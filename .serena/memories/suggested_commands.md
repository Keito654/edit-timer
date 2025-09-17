# Edit Timer - Suggested Commands

## Development Commands

### Setup
```bash
# Install dependencies
pnpm install
```

### Development Build (Recommended)
```bash
# Watch mode (TypeScript + esbuild parallel execution)
pnpm run watch

# Or use VS Code task
# Cmd+Shift+P → "Tasks: Run Task" → "watch"
```

### Individual Watch Commands
```bash
# TypeScript type checking (watch mode)
pnpm run watch:tsc

# esbuild bundling (watch mode)
pnpm run watch:esbuild

# Test watching (planned for future use)
pnpm run watch-tests
```

## Quality Assurance Commands

### Linting & Formatting
```bash
# ESLint code checking & auto-fix
pnpm run lint

# Prettier code formatting
pnpm run format

# Type checking only
pnpm run check-types
```

### Testing
```bash
# Pre-test preparation (compile + lint)
pnpm run pretest

# Test compilation
pnpm run compile-tests
```

## Build Commands

### Development Build
```bash
# Development build (type check + lint + bundle)
pnpm run compile
```

### Production Build
```bash
# Production package creation
pnpm run package
```

## Extension Development

### VS Code Extension Host Launch
- Press F5 or launch from Run and Debug view
- Test extension in new VS Code window

### Debugging
- No `launch.json` required (works with default configuration)
- Source map support included

## Recommended Workflow
1. Start watch mode with `pnpm run watch`
2. Launch Extension Host with F5
3. Code changes → Auto build → Extension Host reload
4. Final check with `pnpm run lint` when work is complete
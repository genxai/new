# AGENTS.md

## Commands

- **Dev**: `npm run dev` (runs frontend + Convex backend)
- **Build/Check**: `npm run check` (typecheck, lint, format, tests)
- **Test**: `vitest run` or `vitest run filename.spec.ts` for single test
- **Lint**: `npm run lint` (TypeScript + ESLint)
- **Format**: `npm run format` (Prettier)

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS + React Router 7
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Better Auth with Convex integration
- **Structure**: `/src` (frontend), `/convex` (backend functions), `/shared` (shared types)

## Code Style

- **Imports**: Use `@/` alias for src imports, import order: external → @/ → relative
- **Types**: Strict TypeScript, Zod for validation, explicit any allowed
- **Naming**: camelCase for vars/functions, PascalCase for components
- **Files**: kebab-case for files, PascalCase for React components
- **Formatting**: Prettier with no semicolons, 2 spaces
- **Error handling**: Use Error objects, validate with Zod

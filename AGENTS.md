# Poinyta — Agent Guide

React Native 0.81 + Expo SDK 54 app. Local-first personal dashboard (tasks, notes, finances, wishlist, goals, weather) with optional n8n sync bridge.

## Commands

| Command | What |
|---|---|
| `npm start` | `expo start` — dev server |
| `npm run android` | `expo run:android` |
| `npm run ios` | `expo run:ios` |
| `npm run web` | `expo start --web` |
| `npm run typecheck` | `tsc --noEmit` — only static check available |
| `npx eas build --platform android --profile preview` | APK build (internal) |
| `node api/server.js` | start sync bridge (from `api/` dir) |

**No lint, no test, no CI/CD, no pre-commit hooks exist.** The typecheck command is the only verification gate.

## Architecture

- **Routing**: `expo-router` file-based. Screens are `app/*.tsx` (tabs). Layout in `app/_layout.tsx`.
- **Data flow**: screens → `hooks/*.ts` → `lib/storage/*.ts` → `lib/storage/db.ts` (SQLite singleton with WAL). Screens never call SQLite directly.
- **Theme system**: `lib/theme/` directory — `colors.ts`, `context.ts`, `provider.tsx`, `hooks.ts`, `presets/` (catalog data). Barrel at `lib/theme/index.ts`. Shim `lib/theme.tsx` re-exports barrel for backward compat.
- **Sync bridge**: `api/server.js` (Express) listens on `PORT` (default 3001), requires `POINYTA_API_KEY` env var. Auth via `Authorization: Bearer` header. Persists to `pending.json` (non-transactional).
- **Custom native module**: `NativeModules.SmsReader` (Android) for SMS-based expense detection.
- **Push notifications**: not implemented. `app_notifications` table is purely in-app local.

## UI / Visual Conventions (from `.github/copilot-instructions.md`)

- **No emojis anywhere.** Use `Ionicons` from `@expo/vector-icons` exclusively.
- **Colors**: always via `useTheme()` from `lib/theme/`. Never hardcode hex.
- **Styles**: `function getStyles(colors: ThemeColors)` factory inside each component file. Never `StyleSheet.create` at module level.
- **No shadows** (`elevation`, `shadowColor`, etc.). Use `borderWidth: 1` with `colors.border`.
- **`borderRadius`** between 10–16 (max 16). No gradients, no saturated colors outside palette.
- **Headers** handled by expo-router `Tabs` config in `_layout.tsx`. Screens don't render custom headers.
- Tokens: `primary`, `surface`, `background`, `border`, `textPrimary`, `textSecondary`, `success`, `error`, `warning`.

## Data Storage

- **SQLite** (WAL mode): all entity data — tasks, notes, transactions, wish items, goals, settings.
- **AsyncStorage**: theme mode key `poinyta_theme_mode` only.
- **SecureStore**: sync API key (`poinyta_sync_key_secure`). Sync URL lives in SQLite `settings` table.
- All types in `lib/storage/types.ts`. IDs via `generateId()` in `lib/storage/helpers.ts`.
- Destructive actions (`clearAllData`) require `Alert.alert` confirmation.

## Known Weaknesses (documented in `readmedev.md`)

- **No transactions around multi-write operations** (`addGoalStep`, `setCategoriesForType`, `syncFromN8n`). Crashes can cause partial updates.
- **`awardPoints`** read-modify-write is not atomic — concurrent toggles lose points silently.
- **`syncFromN8n`** inserts then deletes per-item; crash between operations duplicates data on re-sync.
- **`classifySmsMessages`** deduplicates by day+rounded amount, not by message hash — two same-day purchases of equal value collapse into one.
- **`generateId`** can collide under burst inserts; `crypto.randomUUID()` preferred for new code.
- **`app_notifications`** has no purge — grows unbounded.
- **`getGoals`** runs N+1 queries (one per goal for steps).
- **`useHomeData`** silences all errors with empty `catch {}`.
- **Bridge**: timing-attack-vulnerable API key comparison (`===`), non-transactional file-based queue (`pending.json`), no HTTPS enforcement.
- **`fetchLinkMetadata`** depends on third-party `noembed.com` with no SLA.

## Code Documentation

- **Inline `//` comments, never JSDoc `/** */`.** Explique el *por qué* y el flujo lógico, no el *qué* (el código ya lo dice).
- Solo comente funciones internas o no obvias. Funciones exportadas simples (`getTasks`, `addTransaction`) no requieren comentario.
- En español, tono conciso. Una o dos líneas como máximo.
- Si una función tiene efectos secundarios no evidentes (escritura a storage, navegación, timers), documéntelos.

## Environment

- `.env.example` shows `POINYTA_API_KEY` for the bridge. Runtime env in `api/server.js`.
- `newArchEnabled: true` in `app.json` (Fabric/TurboModules). The `PermissionsAndroid` dialog workaround (close modal, 500ms delay, reopen) exists in `app/finance.tsx:706`.
- Expo SDK 54 → Hermes engine, `crypto.randomUUID()` available.

## Existing Agent Personas (`.github/agents/`)

- **Son**: UX/UI redesign — reorganize screens, improve info hierarchy, layout restructuring. Not for bug fixes.
- **Thomas**: Visual bug fixes — wrong colors, broken layouts, missing borders, icon issues. Not for business logic refactors.

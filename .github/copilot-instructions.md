# Poinyta — Project Guidelines

## Project Overview

Personal finance and productivity app built with **Expo + React Native + TypeScript** using file-based routing via `expo-router`.

Main features: expense/income tracking, tasks, notes.

## Stack

- Expo ~54 / expo-router ~6
- React Native 0.81
- TypeScript (strict)
- AsyncStorage for persistence (`@react-native-async-storage/async-storage`)
- `@expo/vector-icons` (Ionicons only)

## File Structure

```
app/            # expo-router screens (tabs)
components/     # shared UI components
lib/
  types.ts      # all shared TypeScript types
  storage.ts    # all AsyncStorage read/write logic
  theme.tsx     # color tokens, ThemeProvider, useTheme(), useThemeMode()
assets/         # static assets
```

## Visual & UI Rules

- **No emojis** anywhere in the UI — not in text, labels, placeholders, or comments.
- Use `Ionicons` for all icons; do not introduce other icon sets.
- Always use `useTheme()` from `lib/theme.ts` for colors — never hardcode hex values.
- Styles are defined as `function getStyles(colors: ThemeColors)` inside the same file, called at the top of the component. Do not use global `const styles = StyleSheet.create(...)`.
- Cards and inputs use `borderWidth: 1` with `colors.border` instead of shadows.
- Rounded corners: `borderRadius` 10–16. Do not go above 16.
- All screens must have `backgroundColor: colors.background` on the root container.
- The header bar is handled by expo-router's `Tabs` config in `_layout.tsx` — do not render custom headers inside screens.

## Color Palette & Theme

Defined in `lib/theme.tsx`. Light and dark variants switch automatically or manually.

- `useTheme()` → returns the active `ThemeColors` object.
- `useThemeMode()` → returns `{ mode, isDark, setMode }` to read or change the theme.
- The app is wrapped in `<ThemeProvider>` inside `app/_layout.tsx`. Do not add another provider.
- Stored preference key: `poinyta_theme_mode` (`"light"` | `"dark"` | `"system"`).

Key tokens: `primary`, `surface`, `background`, `border`, `textPrimary`, `textSecondary`, `success`, `error`, `warning`.

## Data Layer

- All storage logic lives in `lib/storage.ts`. Screens must not call `AsyncStorage` directly.
- All types live in `lib/types.ts`. Do not declare local types that belong globally.
- IDs are generated with the `generateId()` helper inside `storage.ts`.
- Dates are stored as ISO strings (`new Date().toISOString()`).

## Component Conventions

- One default export per file.
- Props types are declared inline as `type Props = { ... }` above the component.
- Use `useFocusEffect` + `useCallback` to reload data when a tab becomes active.
- `KeyboardAvoidingView` is required on screens with text inputs.

## Navigation

- `expo-router` file-based routing. Do not use `react-navigation` APIs directly.
- Use `useRouter()` for programmatic navigation (`router.push`, `router.replace`).
- Tabs are declared in `app/_layout.tsx` only.

## Code Style

- No inline comments unless explaining non-obvious logic.
- No `console.log` in committed code.
- Prefer `useCallback` for functions passed to `useFocusEffect`.
- Format numbers with `toLocaleString("es", ...)` for display.
- Destructive actions (delete, clear data) require `Alert.alert` confirmation.

## Documentacion de Funciones (Espanol)

- Documentar en espanol con JSDoc las funciones exportadas y cualquier funcion interna con logica no obvia.
- Formato minimo recomendado por funcion:

```ts
/**
 * Explica que hace la funcion y por que existe.
 * @param nombreParametro Descripcion corta y concreta.
 * @returns Valor retornado y su significado.
 */
```

- Cuando aplique, incluir efectos secundarios (por ejemplo: escritura en storage, navegacion o timers).
- Evitar comentarios redundantes de linea a linea; preferir bloques cortos y utiles.
- Al cambiar una firma o comportamiento, actualizar su documentacion en el mismo cambio.

## Do Not

- Add emojis anywhere.
- Hardcode user-facing strings with hardcoded names (use the stored `userName`).
- Add new dependencies without discussing first.
- Use `StyleSheet.create` at module level — use the `getStyles(colors)` factory pattern.
- Use shadows (`elevation`, `shadowColor`, etc.) — use borders instead.
- Add gradients.
- Use highly saturated or vibrant colors outside the defined palette.

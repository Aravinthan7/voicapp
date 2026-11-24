---
name: frontend-app-architecture
description: VoiceApp frontend structure and wiring - folder layout, React Router v7 routes, protected routes, Axios service layer, auth context, Tailwind v4 setup, and the repo's strict TypeScript settings. Use when adding pages, routes, API calls, context/state, or project configuration in the frontend.
---

# Frontend App Architecture (VoiceApp)

Complements the generic `react-frontend` skill; this one is specific to this repo. Inspect `frontend/src` before changing anything.

## Strict TypeScript settings already on (tsconfig.app.json)
- `verbatimModuleSyntax`: type-only imports **must** use `import type { X } from ...` (or `import { type X }`).
- `erasableSyntaxOnly`: **no** `enum`, `namespace`, or constructor parameter properties. Use string-literal unions and `as const` objects.
- `noUnusedLocals` / `noUnusedParameters`: remove dead code; prefix intentionally unused params with `_`.
- Run `npm run build` (`tsc -b && vite build`) and `npm run lint` to verify. Both must pass.

## Layout (create folders only when a feature needs them)
```
src/
  components/{common,layout,call}/   reusable UI; no API calls
  pages/                             Login, Register, Dashboard, VoiceProfile, CallRoom (.tsx)
  services/                          api.ts (Axios instance) + one file per domain (authService.ts, callService.ts, voiceProfileService.ts)
  hooks/                             useAuth, useMediaDevices, useCallSocket, ...
  context/                           AuthContext.tsx (+ provider)
  routes/AppRoutes.tsx               route table, ProtectedRoute
  types/                             shared API/domain types
  utils/
```
Path style: relative imports as in the existing code; do not add path aliases without updating both `tsconfig.app.json` and `vite.config.ts`.

## Services layer
- One Axios instance in `services/api.ts`: `baseURL` from `import.meta.env.VITE_API_BASE_URL`, request interceptor adds the access token, response interceptor handles 401 (clear session, redirect to login) once - no retry loops.
- Pages and components never call Axios directly. Service functions return typed data (`Promise<User>`), not `AxiosResponse`.
- Normalize errors in one helper (`getErrorMessage(error: unknown): string`) so UI shows consistent, human-readable messages. Do not leak raw server stack traces.
- **No secrets in the frontend.** Only public config in `VITE_*` vars. STT/translation/TTS provider keys live in the backend only.

## Auth & routing
- `AuthContext` holds `user`, `status: 'loading' | 'authenticated' | 'anonymous'`, `login`, `logout`. Expose via a `useAuth()` hook that throws if used outside the provider.
- `ProtectedRoute` waits for `loading` (show a spinner, not a redirect flash), then redirects anonymous users to `/login` preserving the intended path.
- Routes: `/login`, `/register`, `/` (Dashboard), `/profile/voice`, `/call/:roomId`. The invite link / room code resolves to `/call/:roomId` (or a `/join/:code` resolver) and **requires login**: Phase 1 has no guest access (deferred, scope 5.4), so do not build a public `/join/:token` route or a guest session now. Keep the resolver in one place so it is easy to change. See `saas-workspaces-guest-access`.
- Use `react-router-dom` v7 APIs (`createBrowserRouter`/`RouterProvider` or `<BrowserRouter>` - follow whatever `main.tsx` already uses).
- Token storage is a security decision: see `auth-security-privacy` before choosing localStorage vs httpOnly cookie.

## Tailwind v4
- Already wired: `@tailwindcss/vite` plugin in `vite.config.ts` and `@import 'tailwindcss';` in `index.css`. No `tailwind.config.js` needed; customize through `@theme { ... }` in CSS.
- Do not add a UI library that requires a global provider. Icons: `lucide-react` only.
- `App.css` is Vite template leftovers - prefer Tailwind utilities; don't grow it.

## Forms
Controlled inputs, typed events (`React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`), per-field validation messages, disabled submit while pending, and an `aria-live` region for server errors. Every page needs loading, error and empty states.

## Checklist before finishing a frontend task
- [ ] Types for props, state, API payloads; no `any`.
- [ ] API calls only in `services/`.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] Keyboard and screen-reader usable (see `call-room-ui` for call-specific a11y).
- [ ] Section 16 of `Project_scope.md` updated if a checklist item was completed.

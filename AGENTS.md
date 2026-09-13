# Persian AI Chatbox - Project Context & Agent Instructions

Welcome, AI Agent! If you are reading this, you are working on the **Persian AI Chatbox** project. Please read this document carefully to understand the architecture, core features, and rules of this repository before making any changes.

## 📌 Project Overview
Persian AI Chatbox is a highly polished, full-stack AI platform for Persian-speaking users. Beyond chat, it includes a product store, AI news blog, Telegram bot, and admin tools. The chat UI bridges multiple model providers (Gemini, Groq, OpenAI-compatible, etc.) with real-time streaming, voice, tools, and file/image analysis — all in a strictly RTL, Persian-localized experience.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide + Solar Icons, custom CSS design system (`index.css`).
- **State / Routing**: Zustand stores (`chatStore`, `settingsStore`, `authStore`, `uiStore`); `react-router-dom` routes for chat, store, and blog.
- **Backend**: Express (Node.js) in `server/index.ts` — API proxy, auth, store, news, SEO, Telegram bootstrap.
- **Database**: `libsql` local SQLite at `server/data/chatbox.db`; optional **Turso** embedded replica via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- **Build**: `vite build` for the client; `esbuild` bundles `server/index.ts` → `dist/server.cjs`. Scripts: `dev` (`tsx server/index.ts`), `build`, `start` (`node dist/server.cjs`).
- **Deploy**: Render (`render.yaml`) — Node web service, bind `0.0.0.0`, use `PORT`.
- **PWA**: `vite-plugin-pwa` (RTL/fa-IR manifest). Workbox must keep `/api` NetworkOnly / denylisted — never cache API responses in the service worker.

## ✨ Core Features & Implementation Details

### 1. Persian-First UI & UX
- **Layout**: Strictly Right-to-Left (RTL).
- **Typography**: `Vazirmatn`, `Mikhak`, and `Estedad` font families (hybrid typography).
- **Language**: All UI text, error messages, and placeholders MUST be in fluent Persian.
- **Features**: Persian numerals toggle (`toPersianDigits`); TTS/Speech Recognition for `fa-IR`.

### 2. Chat, Models & Tools
- Multi-provider chat with SSE streaming, smart routing, role-based model profiles (default / coding / vision).
- Tools include web search, Google grounding, image generation, TTS, prompt enhance, and Explore Hub.
- Hybrid intent detection: `/api/chat/detect-intent` plus client heuristics (see `docs/hybrid-intent-routing.md`).
- Client may store BYOK API keys encrypted in localStorage (`src/lib/crypto.ts` + `storage.ts`).
- **Server-Driven Default Profiles (Free Cards)**:
  - Default free models (Qwen, GPT OSS, Gemini Flash) are stored in the SQLite/Turso `default_profiles` table.
  - The Admin manages these profiles dynamically in `AdminModal.tsx` (`activeTab === 'settings'`) with full CRUD and live connection test.
  - **Zero Key Leakage**: The public endpoint `GET /api/default-profiles` returns active system profiles with `apiKey: ''` masked. The server injects the real API key during chat streaming (`/api/chat/stream`) and connection testing (`/api/models/test`).
  - **User Card Isolation**: Client sync via `mergeSystemProfiles` in `src/lib/storage.ts` updates only system default profiles (`isSystemDefault: true` or matching system IDs), strictly preserving any user-created personal custom cards (BYOK) in `settings.providers.custom.profiles`.

### 3. File & Image Handling (Crucial)
- **Images**: Converted to Base64 and resized/compressed via Canvas (max 1200px) *before* saving to state to reduce `localStorage` pressure.
- **Documents & Text**: PDF (up to 10MB), text, code (`.js`, `.py`, etc.), datasets (`.csv`, `.json`). Text is extracted and injected into the prompt.
- **UI Logic**: Non-image files use a `FileText` fallback layout — never render them as `<img>`.

### 4. LocalStorage Quota Management
- Conversation history is stored in `localStorage`.
- **Anti-Quota Exceed System**: `src/lib/storage.ts` → `saveConversations` handles `QuotaExceededError` by stripping Base64 images from older conversations and replacing them with a Persian placeholder. **DO NOT OVERWRITE OR REMOVE THIS LOGIC.**

### 5. Real-time Streaming (SSE)
- Chat streaming lives in `server/routes/chat.ts` (mounted from `server/index.ts`).
- **Important Headers**: Always set `res.setHeader('X-Accel-Buffering', 'no');` so reverse proxies (Nginx, etc.) do not buffer the stream. Removing it causes `Failed to fetch` / timeouts.

### 6. Auth, Store & Admin
- Auth: JWT, email/password, Google OAuth, phone OTP (Kavenegar), SMTP password reset (`server/routes/auth.ts`).
- Store: products, licenses, orders, redeem codes, checkout (including manual card-to-card with Telegram notify) — `server/routes/store.ts` + `src/pages/store/`.
- Admin: product/license/order/news management and default AI profiles CRUD (`server/routes/admin.ts`).
- Default Profiles Endpoints:
  - `GET /api/default-profiles` (Public, sanitized, no API keys)
  - `GET /api/admin/default-profiles` (Admin only)
  - `POST /api/admin/default-profiles` (Admin only, create profile)
  - `PUT /api/admin/default-profiles/:id` (Admin only, update profile)
  - `DELETE /api/admin/default-profiles/:id` (Admin only, delete profile)
- **Turso note**: `db.transaction()` is not supported in embedded-replica mode — avoid transactions or guard them.

### 7. Blog / AI News
- Public blog + tag archives (`/blog`, `/blog/:id`, `/blog/tag/:tagName`).
- Hourly cron (`Asia/Tehran`) in `server/services/newsCron.ts`: RSS failover → Gemini rewrite/tags → DB → optional Telegram channel post.
- Resilient feed fetch (multi-feed, timeouts, headers). Do not break Telegram fallback or schedule.

### 8. Telegram Bot
- Telegraf bot in `server/telegram/bot.ts`: catalog, checkout/receipts, support, channel membership, deep links.
- **Proxy rule (critical)**: If `PROXY_URL` points at localhost/`127.0.0.1`/`::1` and `NODE_ENV === 'production'`, **skip the proxy and connect directly** (Render/cloud-safe). Keep the localhost proxy for local dev. Do not “fix” production by forcing a local proxy.

### 9. SEO & eNamad
- Dynamic `/sitemap.xml` (static routes + blog + tags + store products) and `/robots.txt` in `server/index.ts`.
- Production SPA fallback injects title/description/OG/Twitter/JSON-LD via `renderHtmlWithSeo`. Client SPA updates use `src/lib/seo.ts` (`setPageSeo`).
- Default page title: `دستیار هوشمند | چت با هوش مصنوعی رایگان، فارسی و پیشرفته`.
- **eNamad**: Keep `<meta name="enamad" content="60366138" />` in `index.html` and the trust seal markup in `src/components/Footer.tsx` (including `referrerpolicy="origin"`). Do not remove or casually rewrite verification assets (`60366138.txt` in root/public) unless explicitly asked.

### 10. Dev Server / DB Watch
- Vite middleware mode watches the app but **must ignore** `server/data/**` and `*.db*` files so Turso/SQLite sync does not thrash HMR (`server/index.ts`).

## 🛑 Rules for Future AI Agents
1. **MANDATORY RESEARCH & PLANNING**: Before making ANY code changes or introducing new features, you MUST thoroughly research the existing codebase, read relevant documentation, and verify assumptions (e.g., API constraints, free tier limits). You MUST present a detailed plan, ask clarifying questions, challenge the user's assumptions if necessary, and wait for explicit approval before modifying any files. Do not rush into writing code. Failure to do this risks destroying the project and the user's investment.
2. **Preserve the Build Script**: `server/index.ts` handles API routes, Vite middleware in dev, static + SEO injection in prod. Never break `npm run build` / `start` in `package.json`.
3. **Never Expose API Keys**: All LLM/search/TTS/provider calls MUST route through the Express server. Never call external AI APIs directly from the React frontend (BYOK keys stay encrypted client-side and are sent only to our backend).
4. **No Unrequested Features**: Stick strictly to the user's prompt. Do not add unrequested pages, sidebars, or databases unless explicitly asked.
5. **Styling Approach**: Prefer Tailwind utilities; reuse CSS variables/classes from `index.css`. Do not introduce CSS modules or new external CSS files.
6. **Robust Error Handling**: New API routes/features must fail gracefully with user-friendly **Persian** error messages.
7. **Web Search Global Toggle (KILL-SWITCH)**: `settings.tools.webSearch` is a strict KILL-SWITCH. If disabled, NO web search may occur — even if Smart Routing wants it. Enforcement is in `src/store/chatStore.ts`. Never bypass this.
8. **Markdown Rendering Stability**: When preprocessing `<think>` tags in `MarkdownRenderer.tsx`, wrap reasoning fences with double newlines: `\n\n\`\`\`reasoning\n...\n\`\`\`\n\n`. Otherwise React can crash with nested `<pre>` inside `<p>`.
9. **Telegram Proxy + NODE_ENV**: Preserve production skip of localhost `PROXY_URL`; do not break cloud Telegram broadcasts from `newsCron` / bot.
10. **Turso / SQLite Safety**: Prefer sync-friendly patterns; avoid unsupported transactions; do not delete self-healing replica / orphan `chatbox.db-info` cleanup logic without cause.
11. **eNamad & SEO**: Do not strip enamad meta/seal, sitemap image tags, or server-side meta injection unless the user asks.
12. **PWA `/api`**: Keep API routes out of the service worker cache.
13. **Env awareness**: `server/.env.example` may lag real usage. Important vars include `DEFAULT_GEMINI_KEY` / `GEMINI_API_KEY`, `DEFAULT_GROQ_KEY`, `TURSO_*`, `JWT_SECRET`, `TELEGRAM_*`, `PROXY_URL`, `KAVENEGAR_API_KEY`, `SMTP_*`, `WEBSITE_URL`/`WEB_URL`/`APP_URL`, `NODE_ENV`, `PORT`.
14. **Frontend Monitoring**: Always use the `chrome-devtools-mcp` to monitor console errors and network requests directly when making frontend changes to ensure no hidden client-side errors exist.

## 📂 Key Paths
```
server/index.ts              # Express entry, sitemap, robots, SEO HTML, Vite/prod static
server/routes/chat.ts        # SSE + X-Accel-Buffering
server/routes/{auth,admin,store,news,tools,intent,models}.ts
server/db/database.ts        # libsql + Turso
server/telegram/bot.ts       # Proxy skip in production
server/services/newsCron.ts  # Hourly AI news pipeline
src/store/chatStore.ts       # Web-search kill-switch + smart routing
src/lib/storage.ts           # Quota stripping, defaults, encrypted keys
src/lib/seo.ts               # Client-side SEO updates
src/components/Footer.tsx    # eNamad trust seal
src/components/MarkdownRenderer.tsx
index.html                   # Shell SEO + enamad meta
```

*End of instructions.*

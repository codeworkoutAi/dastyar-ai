# Persian AI Chatbox - Project Context & Agent Instructions

Welcome, AI Agent! If you are reading this, you are working on the **Persian AI Chatbox** project. Please read this document carefully to understand the architecture, core features, and rules of this repository before making any changes.

## 📌 Project Overview
Persian AI Chatbox is a highly polished, full-stack AI platform for Persian-speaking users. Beyond chat, it includes a Pay-As-You-Go wallet balance store, an AI news blog, a Telegram bot, and comprehensive admin tools. The chat UI bridges multiple model providers (Gemini, Groq, OpenAI-compatible, etc.) with real-time streaming, voice, tools, and file/image analysis — all in a strictly RTL, Persian-localized experience.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide + Solar Icons, custom CSS design system (`index.css`).
- **State / Routing**: Zustand stores (`chatStore`, `settingsStore`, `authStore`, `uiStore`); `react-router-dom` routes for chat, store, and blog.
- **Backend**: Express (Node.js) in `server/index.ts` — API proxy, auth, wallet/store, news, SEO, Telegram bootstrap.
- **Database**: `libsql` local SQLite at `server/data/chatbox.db`; optional **Turso** embedded replica via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- **Build**: `vite build` for the client; `esbuild` bundles `server/index.ts` → `dist/server.cjs`. Scripts: `dev` (`tsx server/index.ts`), `build`, `start` (`node dist/server.cjs`).
- **Deploy**: Render (`render.yaml`) — Node web service, bind `0.0.0.0`, use `PORT`.
- **PWA**: `vite-plugin-pwa` (RTL/fa-IR manifest). Workbox must keep `/api` NetworkOnly / denylisted — never cache API responses in the service worker.

---

## ✨ Core Features & Implementation Details

### 1. Persian-First UI & UX
- **Layout**: Strictly Right-to-Left (RTL).
- **Typography**: `Vazirmatn`, `Mikhak`, and `Estedad` font families (hybrid typography). Phone numbers, OTP fields, and numeric inputs MUST use `Vazirmatn` with `dir="ltr"` and Persian-digits formatting (`toPersianDigits`) without using mismatched monospace English fonts.
- **Language**: All UI text, error messages, and placeholders MUST be in fluent Persian.
- **Features**: Persian numerals toggle (`toPersianDigits`); TTS/Speech Recognition for `fa-IR`.

### 2. Six-Card Unified Model Architecture (Single Source of Truth)
The platform operates exclusively on **exactly six stable system profiles** (divided into 3 Free and 3 Paid/Credit models). User BYOK personal profiles are completely eliminated in favor of managed system stability:

- **Base/Fast Models (Lightweight & Cost-Effective, Smart Routing Defaults):**
  1. `free_default`: **دستیار چت و گفتگو** ⬅️ `role: 'default'` | مدل: `gemini-2.5-flash`
  2. `free_coding`: **دستیار برنامه‌نویسی و کد** ⬅️ `role: 'coding'` | مدل: `gemini-2.0-pro-exp-02-05`
  3. `free_vision`: **دستیار بینایی و اسناد** ⬅️ `role: 'vision'` | مدل: `gemini-2.5-flash`
- **Pro/Advanced Models (Pay-As-You-Go / Router.cheap):**
  4. `paid_default`: **دستیار هوشمند کلود** ⬅️ `role: 'paid_default'` | مدل: `claude-sonnet-4-6`
  5. `paid_coding`: **دستیار مهندسی دیپ‌سیک** ⬅️ `role: 'paid_coding'` | مدل: `deepseek-v4-pro`
  6. `paid_vision`: **دستیار اسناد و بینایی جمینای** ⬅️ `role: 'paid_vision'` | مدل: `gemini-3.8-flash`

- **Key Security & Injection**:
  - The public endpoint `GET /api/default-profiles` returns sanitized profile metadata with `apiKey: ''` masked.
  - The Express server securely injects the real provider keys on the backend during chat streaming (`/api/chat/stream`) and model connection testing (`/api/models/test`).
- **Client Cache Synchronization**:
  - Client storage uses `PROFILES_CACHE_VERSION` in `src/lib/storage.ts` to clear obsolete or custom cards and maintain only the 6 standard profiles. Smart routing defaults strictly to the 3 free cards.

### 3. Usage Quotas, Fair Use & Seamless Auto-Switch
- **Mandatory Login Policy (No Guest Chat)**:
  - Users MUST be authenticated before starting a chat session. Guest users attempting to send messages are prompted with the authentication modal (`AuthModal.tsx`).
- **Free Quota (15 Messages per 24-Hour Day)**:
  - Each registered user receives **15 free messages** within a rolling **24-hour cooldown window** (`windowStart` in `free_daily_usage`).
  - Configuration in `site_settings`: `free_daily_limit_user = '15'` and `free_cooldown_hours = '24'`.
- **Accurate 24-Hour Cooldown Timer**:
  - If quota is exhausted and wallet balance is empty, the server returns an exact Persian cooldown counter (`ساعت و دقیقه باقی‌مانده`) based strictly on the 24-hour window until the next refill.
- **Seamless Auto-Switch to Credit**:
  - When a free user exhausts their 15-message quota:
    - **If wallet balance exists**: The stream automatically switches to the corresponding paid profile (`paid_default`, `paid_coding`, or `paid_vision`) without cutting off the user or showing an error.
    - **If wallet balance is empty**: A courteous Persian notice is returned indicating the exact remaining cooldown time (hours/minutes of the 24-hour window) along with a direct action button to top up the wallet (`ErrorCapsule.tsx` with standard `.clay-btn`).

### 4. Explore Hub (Prompt Library Focus)
- The **Explore Hub** (`src/pages/explore/ExploreHub.tsx`) is dedicated exclusively to **prompts, personas, and prompt discovery**.
- It does NOT serve as an alternative model picker or profile manager. Selecting a prompt injects it directly into the active chat session with the appropriate system role.

### 5. File & Image Handling
- **Images**: Converted to Base64 and resized/compressed via Canvas (max 1200px) *before* saving to state to reduce `localStorage` pressure.
- **Documents & Text**: PDF (up to 10MB), text, code (`.js`, `.py`, etc.), datasets (`.csv`, `.json`). Text is extracted and injected into the prompt.
- **UI Logic**: Non-image files use a `FileText` fallback layout — never render them as `<img>`.
- **AI Image Generation Policy**:
  - **In Chat (`ChatBox` / `MessageInput`)**: Strictly PAID and studio-tier using **Google Imagen 3** (`imagen-3`) and **DALL-E 3** (`dalle-3`). Low-quality free models are never used in chat. Deducts directly from user wallet balance (~6,000 to ~8,000 Tomans).
  - **In Image Generation Studio (`ImageGenStudio.tsx`)**: User has full freedom — free engines (`flux`, `sana`, etc.) remain 100% free via Pollinations for test/fun, while studio engines (`imagen-3`, `dalle-3`) deduct from wallet balance using system API keys without requiring personal BYOK keys.

### 6. LocalStorage Quota Management
- Conversation history is stored in `localStorage`.
- **Anti-Quota Exceed System**: `src/lib/storage.ts` → `saveConversations` handles `QuotaExceededError` by stripping Base64 images from older conversations and replacing them with a Persian placeholder. **DO NOT OVERWRITE OR REMOVE THIS LOGIC.**

### 7. Real-time Streaming (SSE)
- Chat streaming lives in `server/routes/chat.ts` (mounted from `server/index.ts`).
- **Important Headers**: Always set `res.setHeader('X-Accel-Buffering', 'no');` so reverse proxies (Nginx, etc.) do not buffer the stream. Removing it causes `Failed to fetch` / timeouts.

### 8. Auth, Pay-As-You-Go Wallet & Admin
- **Auth**: JWT, phone OTP (Kavenegar), Google OAuth, email/password, and SMTP password reset (`server/routes/auth.ts`). `AuthModal.tsx` uses standard design tokens (`clay-modal`, `clay-input`, `clay-btn-primary`) without admin classes.
- **Wallet & Billing**:
  - Subscription packages (Bronze, Silver, Gold) have been replaced by a modern **Pay-As-You-Go** model. Users can top up their wallet with any custom amount (starting from 50,000 Tomans) with lifetime validity and per-token billing.
  - Payment methods include online gateway integration and manual card-to-card with receipt review and Telegram alerts.
  - Financial calculations account for both `chat_usage` and `image_usage` in revenue and treasury consumption.
- **Free Subsidies Monitoring (`free_usage`)**:
  - All free chat turns log exact prompt/completion tokens and estimated USD cost to `wallet_transactions` (`type = 'free_usage'`, amount 0 Toman).
  - Admin Finance Tab (`AdminFinanceTab.tsx`) includes an active KPI card for **سهمیه و یارانه رایگان کاربران** calculating total subsidized messages, tokens, and Toman/USD cost to the platform.
- **Admin**: Profile key management, promo codes, transaction audits, and system configuration (`server/routes/admin.ts`). See the **Admin Panel Security** section in the Strict Rules for the mandatory rules on API-key masking, destructive endpoints, and user deletion.
- **Turso note**: `db.transaction()` is not supported in embedded-replica mode — avoid transactions or guard them.
- **Admin user deletion is a REAL hard delete** (the admin's workflow is creating throwaway test accounts, signing in, then removing them). `DELETE /api/admin/users/:id` removes the user row *and* its dependent rows: `orders`, `wallet_transactions`, `conversations`, `free_daily_usage` (`id = 'user:<id>'`), `free_image_usage`. Do **not** "improve" this into a soft delete/archive — that was tried and reverted. `?archive=true` is available only for the rare case where the financial history must be preserved.

### 9. Blog / AI News
- Public blog + tag archives (`/blog`, `/blog/:id`, `/blog/tag/:tagName`).
- Hourly cron (`Asia/Tehran`) in `server/services/newsCron.ts`: RSS failover → Gemini rewrite/tags → DB → optional Telegram channel post.
- Resilient feed fetch (multi-feed, timeouts, headers). Do not break Telegram fallback or schedule.

### 10. Telegram Bot
- Telegraf bot in `server/telegram/bot.ts`: catalog, checkout/receipts, support, channel membership, deep links.
- **Proxy rule (critical)**: If `PROXY_URL` points at localhost/`127.0.0.1`/`::1` and `NODE_ENV === 'production'`, **skip the proxy and connect directly** (Render/cloud-safe). Keep the localhost proxy for local dev. Do not “fix” production by forcing a local proxy.

### 11. SEO & eNamad
- Dynamic `/sitemap.xml` (static routes + blog + tags + store products) and `/robots.txt` in `server/index.ts`.
- Production SPA fallback injects title/description/OG/Twitter/JSON-LD via `renderHtmlWithSeo`. Client SPA updates use `src/lib/seo.ts` (`setPageSeo`).
- Default page title: `دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته`.
- **eNamad**: Keep `<meta name="enamad" content="60366138" />` in `index.html` and the trust seal markup in `src/components/Footer.tsx` (including `referrerpolicy="origin"`). Do not remove or casually rewrite verification assets (`60366138.txt` in root/public) unless explicitly asked.

---

## 🛑 Strict Rules for AI Agents

1. **MANDATORY RESEARCH & PLANNING**: Before making ANY code changes or introducing new features, you MUST read this `AGENTS.md` file carefully, thoroughly research the existing codebase, read relevant documentation, and verify assumptions. You MUST present a detailed plan, ask clarifying questions, and wait for explicit approval before modifying any files.
2. **Preserve the Build Script**: `server/index.ts` handles API routes, Vite middleware in dev, static + SEO injection in prod. Never break `npm run build` / `start` in `package.json`.
3. **Never Expose API Keys**: All LLM/search/TTS/provider calls MUST route through the Express server. Never call external AI APIs directly from the React frontend.
4. **No Unrequested Features**: Stick strictly to the user's prompt. Do not add unrequested pages, sidebars, or databases unless explicitly asked.
5. **STRICT 3D UI DESIGN ARCHITECTURE (CLAYMORPHISM & NEUMORPHISM DUAL SUPPORT)**:
   - The platform operates with a specialized dual 3D UI design system: **Claymorphism** (`data-ui-style="clay"` / default) and **Neumorphism** (`data-ui-style="neumorphic"`).
   - **DO NOT USE FLAT/CLASSIC OR RAW GENERIC STYLES & NEVER HARDCODE AD-HOC CLASSES**: Never write raw flat Tailwind backgrounds, borders, or generic boxes that bypass the 3D design language.
   - **NO GLOW / HALO ARTIFACTS IN NEUMORPHISM**: In Neumorphic mode, modals and floating cards MUST NOT have white outer glows or heavy light halos against dark backdrops. Floating modals (`.clay-modal`) must use clean dark drop-shadows (`box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.28)`) without bright outward highlights.
   - **NO PUFFY / BULGING CHIPS OR INSET HOLES IN NEUMORPHISM**: Model badges, pill chips, and hero tags in Neumorphism must blend seamlessly and flatly with subtle dual shadows (`--clay-shadow-out` / `--clay-shadow-in`), without plastic bulbous bevels or harsh inset shadows.
   - **ALWAYS USE CORE DESIGN SYSTEM CLASSES**:
     - Outer 3D cards/containers: `.clay-card`, `.clay-card-thick`, `.clay-card-elevated`
     - Sunken inner surfaces: `.clay-surface`, `.clay-surface-inset`
     - 3D tactile buttons: `.clay-btn`, `.clay-btn-thick`, `.clay-btn-primary`, `.clay-icon-btn`
     - Borders and radiuses: `border-subtle`, `border-strong`, `rounded-card`, `rounded-btn`, `rounded-input`
     - Colors and typography: `var(--text-main)`, `var(--text-muted)`, `var(--text-dim)`, `var(--accent-primary)`, `var(--card-bg)`, `var(--input-bg)`
   - **Code Blocks Exception (Unified Seamless Cards)**: In chat code blocks, do NOT nest sunken inner surfaces (`.clay-surface` / `.clay-surface-inset`) inside the card. The code block must be a single, seamless unified `.clay-card` where the code editor area is flush with the card's edges.
   - **Preserve Palette Colors**: When refining Neumorphism or Claymorphism, never alter or replace the curated color palette (blue, emerald, amber/gold, rose, indigo, teal).
6. **Robust Error Handling**: New API routes/features must fail gracefully with user-friendly **Persian** error messages.
7. **Web Search Global Toggle (KILL-SWITCH)**: `settings.tools.webSearch` is a strict KILL-SWITCH. If disabled, NO web search may occur — even if Smart Routing wants it. Enforcement is in `src/store/chatStore.ts`. Never bypass this.
8. **Markdown Rendering Stability**: When preprocessing `<think>` tags in `MarkdownRenderer.tsx`, wrap reasoning fences with double newlines: `\n\n\`\`\`reasoning\n...\n\`\`\`\n\n`. Otherwise React can crash with nested `<pre>` inside `<p>`.
9. **Telegram Proxy + NODE_ENV**: Preserve production skip of localhost `PROXY_URL`; do not break cloud Telegram broadcasts from `newsCron` / bot.
10. **Turso / SQLite Safety**: Prefer sync-friendly patterns; avoid unsupported transactions; do not delete self-healing replica / orphan `chatbox.db-info` cleanup logic without cause.
11. **eNamad & SEO**: Do not strip enamad meta/seal, sitemap image tags, or server-side meta injection unless the user asks.
12. **PWA `/api`**: Keep API routes out of the service worker cache.
13. **Env awareness**: `server/.env.example` may lag real usage. Important vars include `DEFAULT_GEMINI_KEY` / `GEMINI_API_KEY`, `DEFAULT_GROQ_KEY`, `TURSO_*`, `JWT_SECRET`, `TELEGRAM_*`, `PROXY_URL`, `KAVENEGAR_API_KEY`, `SMTP_*`, `WEBSITE_URL`/`WEB_URL`/`APP_URL`, `NODE_ENV`, `PORT`. Also `ALLOW_ADMIN_DB_RESET=true`, which is the only way to re-enable `POST /api/admin/reset-database` in production (see rule 21).
14. **Frontend Monitoring**: Always use the `chrome-devtools-mcp` to monitor console errors and network requests directly when making frontend changes to ensure no hidden client-side errors exist.
15. **Web Grounding Architecture (single live layer)**: The product goal is one thing: let the main model answer from *fresh* web data plus its own knowledge, in one coherent answer. Everything in the retrieval pipeline exists to serve that and nothing more. `server/routes/chat.ts` runs the grounding layers **concurrently** via `Promise.allSettled` and merges the non-empty results:
    - `GoogleGroundingAgent` → the live layer. **No `site:` operator and no allowlist**: Gemini Search Grounding already ranks by relevance, and restricting domains made recall worse. Sources are taken from `groundingSupports` (the spans the engine actually grounded in), not from every returned chunk, and each one carries its supporting snippet. If `groundingSupports` is absent, fall back to all sources rather than dropping every citation.
    - `WikipediaAgent` → free, fast, and the best source for definitional/biographical questions. Guarded by `isTitleRelevant()` (see rule 16).
    - `SpecializedKnowledgeService` → Quran, Ganjoor poetry, cinema, sports, health, botany. Genuinely more precise than web search for those domains; internally parallel and cached.
    - `ToolsAgent.getCurrency` / `getDigikalaProduct` → exact unit-labelled numbers that prose search cannot produce. Run **only** when the intent router selected them, but never *instead of* Grounding.
    - **There is deliberately no `getWeather()`** and no `allowed_domains.json`. Do not reintroduce either: the wttr.in scraper was slower, uncited and a silent failure mode, and the allowlist was the root cause of the irrelevant-source bug (rule 18).
    - Never reintroduce an `else if` chain here. It previously meant a routed tool silently skipped Google Grounding, so the answer was built from stale scraped data with no live lookup.
16. **Wikipedia Relevance Guard**: `searchTitle` used to return `pages[0]` blindly, so "قیمت ارز چنده" was answered with the article "ارز" and injected as «اطلاعات موثق». `searchTitles()` now returns several candidates, each filtered by `isTitleRelevant()`, which requires `min(2, termWords.length)` shared content words after Persian folding (`ي/ی`, `ك/ک`, alef variants, ZWNJ) with stopwords removed. One shared word is **not** enough for a multi-word query. When the guard rejects everything, Wikipedia returns nothing and Grounding carries the answer — that is the intended, safe fallback.
17. **Citation Prompt Discipline**: the `webSearchWrapper` `<instructions>` block is intentionally short (~3 sentences). It previously held 12 numbered rules (~2500 chars) that were patch-work for a bug whose real cause was the allowlist. A long rules block *degrades* model adherence instead of improving it. If citation quality regresses, fix the source injection — do not grow the prompt. Keep these: cite only sources whose evidence is in the context, inline or as a `**منابع:**` line, one entry per outlet, and never invent an unrelated or fabricated link.
18. **Citation Root Cause (historical, do not reintroduce)**: the "irrelevant source" bug was **not** primarily a prompting failure. `GoogleGroundingAgent` used to flatten every category of `server/allowed_domains.json` into one OR-joined `site:` filter, so a foreign-policy question was *forced* to retrieve pages from `tgju.org` (gold/currency) and `coingecko.com`; those pages were injected as `📌 منابع:` and the model faithfully cited the only sources it was given. The allowlist and `searchRelevance.ts` have been deleted. A hand-rolled lexical source filter was tried first and abandoned: it dropped semantically relevant articles that shared no vocabulary with the query (e.g. a Reuters piece titled "واکنش آمریکا به توافق هسته‌ای" for "سیاست خارجی ایران"). `groundingSupports` replaced it because it is the engine's own relevance signal, not a guess.
19. **Runtime Tests Required for Renderer/Util Logic**: `tsc --noEmit` and `vite build` do **not** catch logic bugs in string/regex utilities — a `/g`-flagged regex used with `String.match` returns no capture groups and type-checks fine. The project has vitest (`npm test`, see `src/lib/storage.test.ts` and `src/store/chatStore.test.ts`); add real test files there for new helpers, or exercise them with a throwaway `npx tsx` script (delete it afterwards). Cover the positive case, the negative case, and empty input. Note `vitest.config.ts` pins `include` to `src/**` and `server/**` and excludes `.kilo/**`, because a stale worktree copy was running its own tests against the live database.
20. **Type Scale (non-chat UI)**: `--chat-font-size` is driven by the user slider and is deliberately scoped to the chat only (`MarkdownRenderer`, `.markdown-body`, `MessageInput`, `ChatBox`). Everything else uses the fixed scale in `src/index.css` so a text-size preference can never break the blog, store or landing layout.
    - Tokens `--text-2xs` … `--text-5xl` form a modular scale (ratio 1.200) with a mobile default and a `min-width: 769px` override that steps up only the upper half — enlarging 11px meta text on desktop makes dense UI look loose.
    - Use the semantic classes instead of `text-[13px]`: `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-h4`, `type-body`, `type-secondary`, `type-meta`, `type-badge`, `type-card-title`. Ad-hoc `text-[Npx]` values had drifted into 9/9.5/10/10.5/11/12.5/13 across 31 files; do not add new ones.
    - **The type classes must be declared with `@utility`, not inside `@layer components`.** Tailwind v4 only generates responsive variants for utilities: a class in `@layer components` compiles flat, so `sm:type-meta` would be silently dropped at every breakpoint **with no build error**. Verified in the built CSS. This is the reason `Header.tsx`, `ExportModal.tsx` and `ProductDetailsModal.tsx` can step `type-badge sm:type-meta`.
    - When bulk-rewriting classNames, preserve each file's UTF-8 BOM. `File.WriteAllText` without an explicit `UTF8Encoding($true)` drops it and creates unrelated diff churn on the first line.
    - Persian line heights are deliberately generous (`--leading-relaxed: 1.75`) because of descenders, diacritics and letter stacking.
    - `font-family` **is** intentionally global (`--user-font-family` on `body, button, input, select, textarea`); only sizing is isolated.
21. **Admin Panel Security** (`server/routes/admin.ts`): invariants established by a full audit. Treat these as load-bearing, not stylistic.
    - **Provider API keys are never sent to the browser.** `GET /default-profiles` and the `POST`/`PUT` responses must go through `sanitizeProfile()`, which replaces `apiKey` with a mask and adds `hasApiKey` / `isApiKeyMasked`. The old `SELECT *` leaked every Gemini/Groq/router.cheap key into the browser at runtime, so one XSS or one leaked admin token exposed the whole key pool. Because the client only ever sees the mask, `PUT /default-profiles/:id` treats a submitted value containing the mask marker as "unchanged" and keeps the stored secret - otherwise editing a profile's name would overwrite the real key with the literal mask string. The edit form must therefore start the key field EMPTY and drive its hint from `hasApiKey`.
    - **`reset-database` is guarded server-side, not by the browser.** It requires `{ confirm: 'RESET-DB' }` in the body and is blocked outright in production unless `ALLOW_ADMIN_DB_RESET=true`. The old `window.confirm()` was not a control at all - any direct POST with an admin token skipped it. Keep the `console.warn` audit line *before* the mutations, and keep `wallet_transactions` / `free_daily_usage` in the wipe list (leaving them while zeroing balances produced reports where the finance and analytics tabs disagreed with each other).
    - **User deletion deletes for real.** See section 8. It must explicitly delete dependents because **SQLite does not enforce `ON DELETE CASCADE` without `PRAGMA foreign_keys = ON`, which this project never issues** - the declared cascades on `orders` / `wallet_transactions` / `conversations` are inert, and `free_daily_usage` / `free_image_usage` are not even foreign keys (keyed `user:<id>` / plain `userId`). Deleting only the `users` row silently orphaned real money in the ledger. Licenses are **released back to `available`, never deleted** - they are shop inventory, and unsold keys must survive. Guard: you cannot delete your own account or another admin's.
    - **Rate limiting**: the admin router is mounted as `router.use(requireAuth, requireAdmin, adminRateLimiter)` - limiter *after* auth on purpose, so an unauthenticated flooder cannot exhaust the real admin's IP budget. Heavy read-only reports (`analytics-summary`, `user-usage-summary`) additionally use `adminReportRateLimiter`; `provider-live-balances`, which makes outbound calls to third-party providers, uses `adminExternalQueryRateLimiter`. Never add an admin route without considering which of these applies.
    - **License assignment must validate ownership before mutating.** `POST /orders/:id/assign-license` checks that the requested `licenseId` belongs to the same `productId` and is not already `sold` to another order - and does so *before* releasing the order's previous license, so a rejected request cannot leave the order with no license at all. Blindly trusting the id let one `sold` row be referenced by two orders.
    - **Order approval must not double-credit.** `depositWallet()` and the `UPDATE orders` are separate statements with no transaction between them (see rule 10), so a mid-flight failure used to leave the order `pending` with the credit already applied; re-approving credited a second time. `PUT /orders/:id/status` now skips the deposit when the order is already `success` and returns a `warning` instead.
    - **Never trust a client-supplied path segment.** `POST /site-design/upload-image` allowlists `folder` (a `../../` value previously escaped `public/images` and could write anywhere on disk), allowlists the image extension, and rejects anything over 5MB before decoding - `express.json` is configured at `50mb`, so an unchecked request could allocate ~37MB of Buffer for an invalid image. Follow the existing `allowedKeys` pattern used for `sectionKey`.
    - **`financial-export` must not leak or melt.** It exports only the last 4 digits of `cardPan`, never the full card number; it caps at 10,000 rows because it materialises everything into memory and builds the whole CSV as one JS string; and it prefixes any cell starting with `=`, `+`, `-` or `@` with a quote to neutralise spreadsheet formula injection.
    - **`crypto.randomUUID()`, not `Date.now()`, for generated IDs** (`tx-adm-*`): two wallet operations in the same millisecond collided on the primary key.
    - **Do not trust `Promise.all` over `fetch` for admin saves.** A bare `fetch` only rejects on network failure; 400/401/403/500 resolve normally, so saving finance settings reported success even when every PUT had been rejected and only some keys were written. Check `res.ok` per request. Likewise never leave an empty `catch {}` on a settings load - it silently substituted hardcoded defaults (dollar rate, welcome bonus) for the real values, and the operator's next "save" overwrote production with them.
22. **Timestamps are UTC in the database; render them in Tehran**: `CURRENT_TIMESTAMP` writes `YYYY-MM-DD HH:MM:SS` in **UTC with no zone marker**. Passing that straight to `new Date(str)` is the trap: the engine reads it as **local** time, not UTC, so every timestamp on a UTC host (Render) is shifted by the offset - 3h30m in Iran, in the wrong direction. `src/lib/dateUtils.ts` is the single source of truth: `parseDbDate()` makes "no offset means UTC" explicit, and `formatTehranDate/DateTime/Time()` always pass `timeZone: 'Asia/Tehran'` so the result does not depend on where the code runs. Use these instead of `new Date(x).toLocaleString('fa-IR')` anywhere a DB timestamp is displayed; `Blog.tsx` / `TagArchive.tsx` import `parseDbDate` rather than redefining it. Covered by `src/lib/dateUtils.test.ts`.
    - Note the same hazard in SQL: `date(createdAt)` and `datetime('now')` in the analytics queries bucket by **UTC**, so a chat after ~20:30 UTC lands in the previous day's column for Tehran. If a chart is ever built server-side, use `date(datetime(createdAt, '+3:30 hours'))`; the current client-side charts avoid this because `tehranDateKey()` buckets in Tehran.
23. **Bazaar Android Build Strategy (Single Codebase)**: Never create a separate branch for the Cafe Bazaar application (or any other store). The project must strictly use a **Single Codebase** (Trunk-based development). To create a Bazaar-specific build (which requires hiding payment UIs and bypassing their strict digital goods policies via Remote Config), use Environment Variables (e.g., `VITE_BUILD_TARGET=bazaar`) and conditional rendering. This prevents branch divergence. Additionally, always build Android App Bundles (`.aab`) rather than manual split APKs to let Bazaar handle architecture optimization.

---

## 📂 Key Paths
```
server/index.ts              # Express entry, sitemap, robots, SEO HTML, Vite/prod static
server/routes/chat.ts        # SSE + X-Accel-Buffering + quota & auto-switch
server/routes/{auth,admin,store,news,tools,intent,models}.ts
server/db/database.ts        # libsql + Turso
server/telegram/bot.ts       # Proxy skip in production
server/services/newsCron.ts  # Hourly AI news pipeline
server/middleware/rateLimiter.ts  # aiRouteLimiter + admin/report/external admin limiters
src/store/chatStore.ts       # Web-search kill-switch + smart routing
src/lib/storage.ts           # Quota stripping, defaults, 6-profile sync
src/lib/seo.ts               # Client-side SEO updates
src/components/Footer.tsx    # eNamad trust seal
src/components/MarkdownRenderer.tsx
src/lib/citationUtils.ts     # dedupeCitations(): unique sources in the "منابع:" block
src/pages/explore/ExploreHub.tsx # Prompts & Personas Hub
index.html                   # Shell SEO + enamad meta
```

*End of instructions.*

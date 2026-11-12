# Persian AI Chatbox - Project Context & Agent Instructions

Welcome, AI Agent! If you are reading this, you are working on the **Persian AI Chatbox** project. Please read this document carefully to understand the architecture, core features, and rules of this repository before making any changes.

---

## ⚠️ Layer Zero — Current Strategic Phase (Updated: 2026-11-12)

**This section overrides any conflicting statement below.** If you find a conflict between this section and a lower section, **this section wins**. If a lower section describes a behavior that contradicts this section, treat that section as historical context — not current instruction.

### Phase Status
We are in an SEO + CRO improvement phase. The following changes are approved and implemented:

1. **Unlimited Free-Model Chat + 15-Message Guest Trial** — Guests may send up to **15 free messages** without login (across all 3 free profiles: `free_default`, `free_coding`, `free_vision`). After 15 messages → `AuthModal` opens with a Persian prompt. Guest sessions are **NOT** persisted to `localStorage` while unauthenticated, though an active in-memory guest conversation is preserved when the guest logs in mid-session (`switchUserContext`). **Logged-in users have unlimited free-model chat** (no 15-message daily quota or auto-switch to paid cards). Paid profiles (`paid_*`) and studio paid image engines (`imagen-3`, `dalle-3` with `free_daily_image_limit`) still require login and wallet balance. Anti-spam protection is enforced via per-IP guest limiters (`guestChatRateLimiter`, `guestChatHourLimiter`) and per-userId authenticated limiters (`userChatMinuteLimiter`, `userChatHourLimiter`). This **supersedes** §3's old 15-message user quota and 2-message guest limit.
2. **Homepage title changed** to: `Dastyar AI | دستیار هوش مصنوعی فارسی — چت، کد، اسناد`. This **supersedes** the default title in §11. The old string `دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته` is **preserved** as the homepage `<h2>` and must not be deleted (it currently ranks #7 for a valuable query).
3. **New pages requested** — `/about`, `/contact`, `/ai-assistant`. These are **explicitly requested** by the current phase and do **NOT** violate Rule 4.
4. **No model names in user-facing content** — No model name (Gemini, Claude, DeepSeek, GPT, Mistral) may appear in user-facing text, meta tags, JSON-LD schema, or footer. Model names remain valid **only** in backend code, env vars, DB config, and internal admin UI.
5. **Banned phrases in all content** — «بدون کارت بانکی» (factually false — card-to-card exists) and «بدون فیلترشکن» (not a differentiator). Neither phrase may appear in any user-facing text, meta, schema, or footer.
6. **Image handling (news & blog)** — همه تصاویر خبر و مقاله باید این چرخه را طی کنند:
   - **ذخیره:** فرمت **WebP** در دیتابیس به صورت `data:image/webp;base64,...` (نه JPEG، نه PNG، نه URL منبع خارجی)
   - **پیشفرض:** اگر خبر تصویر ندارد، از `public/default-news-cover.webp` استفاده میشود (نه `NULL`)
   - **نمایش:** در `/blog`، `/blog/:id`، و ادمین پنل — با `<img width={800} height={450} onError={fallback} loading="lazy" />`
   - **ارسال تلگرام:** با `sendPhoto` و **Buffer** (نه URL خارجی — چون تلگرام از IP خودش fetch میکند و ممکن است blocked باشد)
   - **حجم:** هر تصویر WebP حداکثر **۱۰۰KB** (کیفیت ۷۵–۸۲٪، عرض ۸۰۰px)

### Non-Negotiable Invariants (never change, regardless of phase)
These are load-bearing. Do not refactor, rename, or "improve" them without explicit written approval from the owner:

- eNamad meta `60366138` and trust seal markup in `src/components/Footer.tsx`
- `X-Accel-Buffering: no` header in SSE streaming (`server/routes/chat.ts`)
- `PROFILES_CACHE_VERSION` and 6-profile architecture logic (`src/lib/storage.ts`)
- `free_daily_usage`, `free_daily_limit_guest='15'`, `free_cooldown_hours='24'` guest quota & anti-spam rate limiter logic (`server/middleware/rateLimiter.ts`), plus `free_daily_image_limit` (`4` studio paid images)
- Web search kill-switch (`settings.tools.webSearch`) in `src/store/chatStore.ts`
- Telegram proxy skip in production (`server/telegram/bot.ts`)
- Admin API-key masking via `sanitizeProfile()` (`server/routes/admin.ts`)
- `saveConversations` quota handling with Base64 strip (`src/lib/storage.ts`)
- `dateUtils.ts` as single source of truth for Tehran-formatted timestamps
- `crypto.randomUUID()` for generated IDs (not `Date.now()`)

---

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

> [AMENDED 2026-10-26] **Profile Labels Finalized**: The 3 paid profile labels have been renamed to general labels with no model names (Final Decision — Phase 5):
> - `paid_default`: **دستیار چت و گفتگوی پیشرفته** (`role: 'paid_default'`, model: `claude-sonnet-4-6`)
> - `paid_coding`: **دستیار برنامه‌نویسی پیشرفته** (`role: 'paid_coding'`, model: `deepseek-v4-pro`)
> - `paid_vision`: **دستیار اسناد و بینایی پیشرفته** (`role: 'paid_vision'`, model: `gemini-3.8-flash`)
> Roles, internal models, and API keys remain completely untouched. `PROFILES_CACHE_VERSION` bumped to `v9` in `src/lib/storage.ts`.

The platform operates exclusively on **exactly six stable system profiles** (divided into 3 Free and 3 Paid/Credit models). User BYOK personal profiles are completely eliminated in favor of managed system stability:

- **Base/Fast Models (Lightweight & Cost-Effective, Smart Routing Defaults):**
  1. `free_default`: **دستیار چت و گفتگو** ⬅️ `role: 'default'` | مدل: `gemini-3.6-flash`
  2. `free_coding`: **دستیار برنامه‌نویسی و کد** ⬅️ `role: 'coding'` | مدل: `gemini-3.6-flash`
  3. `free_vision`: **دستیار بینایی و اسناد** ⬅️ `role: 'vision'` | مدل: `gemini-3.6-flash`
- **Pro/Advanced Models (Pay-As-You-Go / Router.cheap):**
  4. `paid_default`: **دستیار چت و گفتگوی پیشرفته** ⬅️ `role: 'paid_default'` | مدل: `claude-sonnet-4-6`
  5. `paid_coding`: **دستیار برنامه‌نویسی پیشرفته** ⬅️ `role: 'paid_coding'` | مدل: `deepseek-v4-pro`
  6. `paid_vision`: **دستیار اسناد و بینایی پیشرفته** ⬅️ `role: 'paid_vision'` | مدل: `gemini-3.8-flash`

- **Key Security & Injection**:
  - The public endpoint `GET /api/default-profiles` returns sanitized profile metadata with `apiKey: ''` masked.
  - The Express server securely injects the real provider keys on the backend during chat streaming (`/api/chat/stream`) and model connection testing (`/api/models/test`).
- **Client Cache Synchronization**:
  - Client storage uses `PROFILES_CACHE_VERSION` in `src/lib/storage.ts` to clear obsolete or custom cards and maintain only the 6 standard profiles. Smart routing defaults strictly to the 3 free cards.

### 3. Usage Quotas, Anti-Spam & Paid Credits [AMENDED 2026-11-12]

- **Guest Trial & Unlimited Free-Model Chat**:
  - Guests may send up to **15 free messages** (`free_daily_limit_guest = '15'` in `site_settings`, enforced on client in `MessageInput.tsx` and on server via `free_daily_usage` in `server/routes/chat.ts`) across all 3 free profiles (`free_default`, `free_coding`, `free_vision`).
  - After 15 guest messages, `AuthModal` opens prompting login/registration. When a guest logs in mid-conversation, `switchUserContext` preserves their active in-memory guest conversation.
  - **Logged-in users have unlimited free-model chat** (no daily message limit, no cooldown lock, no forced auto-switch to paid cards). Free-model token usage still logs to `wallet_transactions` (`type = 'free_usage'`, amount 0) for admin cost monitoring.
  - **Anti-Spam Protection**: `/api/chat/stream` enforces `guestChatRateLimiter` (10/min per IP) and `guestChatHourLimiter` (30/hr per IP) for guests, and `userChatMinuteLimiter` (12/min per `userId`) and `userChatHourLimiter` (80/hr per `userId`) for authenticated non-admin users.
  - **Paid Models & Studio Images**: Paid profiles (`paid_default`, `paid_coding`, `paid_vision`) are chosen explicitly by users and deduct from wallet balance. Studio paid image engines (`imagen-3`, `dalle-3`) retain `free_daily_image_limit` (`4`/24h) before charging wallet balance.

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
- **[AMENDED 2026-10-26] Blog strategy direction**: The hourly cron remains active and must not be broken. However, cron output is now labeled as "news" (tag: `news` or `/blog/news`) and is intended to serve as a secondary content channel. The primary blog content channel is hand-written, deep, unique articles (2–3 per week) targeting real user queries. Do not delete or disable the cron. Do not auto-generate deep articles — the owner writes them.

### 10. Telegram Bot
- Telegraf bot in `server/telegram/bot.ts`: catalog, checkout/receipts, support, channel membership, deep links.
- **Proxy rule (critical)**: If `PROXY_URL` points at localhost/`127.0.0.1`/`::1` and `NODE_ENV === 'production'`, **skip the proxy and connect directly** (Render/cloud-safe). Keep the localhost proxy for local dev. Do not "fix" production by forcing a local proxy.

### 11. SEO & eNamad

- Dynamic `/sitemap.xml` (static routes + blog + tags + store products) and `/robots.txt` in `server/index.ts`.
- Production SPA fallback injects title/description/OG/Twitter/JSON-LD via `renderHtmlWithSeo`. Client SPA updates use `src/lib/seo.ts` (`setPageSeo`).

- **Default page title** — [AMENDED 2026-10-26]
  - Old (superseded): `دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته`
  - **New (current)**: `Dastyar AI | دستیار هوش مصنوعی فارسی — چت، کد، اسناد`
  - **Preserve the old string** as the homepage `<h2>`. It currently ranks #7 for a valuable query and must not be deleted. Only the `<title>` tag changes.

- **eNamad**: Keep `<meta name="enamad" content="60366138" />` in `index.html` and the trust seal markup in `src/components/Footer.tsx` (including `referrerpolicy="origin"`). Do not remove or casually rewrite verification assets (`60366138.txt` in root/public) unless explicitly asked.

- **[AMENDED 2026-10-26] SEO Phase Pages**: The following pages are approved and requested by Layer Zero. Building them does NOT violate Rule 4:
  - `/about` — About page (H1: «درباره Dastyar AI»)
  - `/contact` — Contact page (H1: «تماس با Dastyar AI»)
  - `/ai-assistant` — Informational page (H1: «دستیار هوش مصنوعی چیست؟»)
  Each must be registered in the dynamic sitemap, in `renderHtmlWithSeo`, and in `setPageSeo`.

- **[AMENDED 2026-10-26] Keyword intent split**:
  - Homepage targets: «دستیار هوش مصنوعی فارسی»، «دستیار هوشمند» (transactional)
  - `/ai-assistant` targets: «دستیار هوش مصنوعی چیست» (informational)
  - These two H1s must **never** be identical or near-identical.

---

## 🛑 Strict Rules for AI Agents

1. **MANDATORY RESEARCH & PLANNING**: Before making ANY code changes or introducing new features, you MUST read this `AGENTS.md` file carefully, thoroughly research the existing codebase, read relevant documentation, and verify assumptions. You MUST present a detailed plan, ask clarifying questions, and wait for explicit approval before modifying any files.
2. **Preserve the Build Script**: `server/index.ts` handles API routes, Vite middleware in dev, static + SEO injection in prod. Never break `npm run build` / `start` in `package.json`.
3. **Never Expose API Keys**: All LLM/search/TTS/provider calls MUST route through the Express server. Never call external AI APIs directly from the React frontend.
4. **No Unrequested Features**: Stick strictly to the user's prompt. Do not add unrequested pages, sidebars, or databases unless explicitly asked.

   **Clarification [AMENDED 2026-10-26]**: Pages explicitly listed in the "Layer Zero — Current Strategic Phase" section at the top of this file ARE requested. Currently: `/about`, `/contact`, `/ai-assistant`. Do not refuse to build them citing this rule.
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
24. **استراتژی بیلد و انتشار کافه‌بازار (Bazaar Release Strategy & Asset Optimization)**:
    - **دستور بیلد و متغیر محیطی**: بیلد اختصاصی کافه‌بازار منحصراً با دستور `npm run build:bazaar` (یا زنجیره کامل `npm run build:bazaar:sync`) با متغیر محیطی `VITE_BUILD_TARGET=bazaar` تولید می‌شود. در این حالت روت‌های لندینگ‌پیج و فروشگاه وب حذف یا از سایدبار و ناوبری‌ها کاملاً ایزوله و پنهان می‌شوند (`!isBazaar`).
    - **پاکسازی خودکار دارایی‌های وب‌محور (Pruning)**: تصاویر سنگین لندینگ‌پیج (`public/images/gallery/`، `public/images/professions/`، بنرهای وب و تاییدیه موتورهای جستجو) در اپ اندروید کاربردی ندارند. اسکریپت `scripts/prune-android-assets.cjs` بلافاصله پس از سینک کپسیتور و هوک نیتیو Gradle به نام `pruneAndroidAssets` در `android/app/build.gradle` این دارایی‌ها را از مسیر `android/app/src/main/assets/public` پاکسازی می‌کنند. این کار حجم پوشه دارایی‌ها را از ۲۱.۲ مگابایت به ۹.۸ مگابایت و حجم نهایی APK/AAB را به ~۱۵ مگابایت کاهش می‌دهد؛ در حالی که فایل‌های اصلی در ریشه `public/` جهت سرویس‌دهی وب‌سایت کاملاً دست‌نخورده باقی می‌مانند.
    - **بهینه‌سازی Gradle و ProGuard**: در فایل `android/app/build.gradle` تنظیمات `minifyEnabled true` و `shrinkResources true` در بخش `release` فعال هستند. برای جلوگیری از تداخل ابهام‌زدایی، تمامی قوانین نگه‌دارنده پل کپسیتور، متدهای `@android.webkit.JavascriptInterface` و وب‌ویو در `android/app/proguard-rules.pro` تثبیت شده‌اند.
    - **الزام درگاه بازارپی (BazaarPay)**: طبق خط‌مشی‌های سخت‌گیرانه کافه‌بازار برای کالاهای دیجیتال، ارجاع به هرگونه درگاه پرداخت تحت وب (شتاب/زرین‌پال/کارت‌به‌کارت) در نسخه اندروید بازار اکیداً ممنوع است. تمام تراکنش‌ها و افزایش موجودی کاربر در محیط اندروید باید منحصراً و به صورت کاملاً ایزوله از طریق درگاه رسمی بازارپی (BazaarPay) یا کیف‌پول یکپارچه بازار انجام شود.
25. **معماری فونت‌های متغیر و شاخص‌های حیاتی وب موبایل (Variable Fonts & Core Web Vitals)**:
    - **معماری فونت‌های متغیر (Variable Fonts .woff2)**: هرگز پکیج‌های فونت استاتیک چندوزنی یا ایمپورت‌های مکرر فایل‌های استاتیک نظیر `@fontsource/vazirmatn/100.css` تا `900.css` یا `sahel-font/dist/font-face.css` را به پروژه اضافه نکنید. پروژه منحصراً از پکیج‌های رسمی متغیر (`@fontsource-variable/vazirmatn`، `@fontsource-variable/estedad`، `@fontsource-variable/jetbrains-mono`) و فونت اختصاصی `Sahel-VF.woff2` (با دامنه وزن ۱۰۰ تا ۹۰۰) استفاده می‌کند. این کار حجم CSS باندل را بیش از ۸۰٪ سبک کرده و ده‌ها درخواست اضافی شبکه را حذف می‌کند.
    - **حفظ سازگاری اسامی فونت‌ها (Aliases)**: با تعاریف `@font-face` و استک‌های `var(--user-font-family)`، اسامی مرسوم `'Vazirmatn'` و `'Estedad'` بدون پسوند Variable نیز مستقیماً به فایل‌های متغیر وصل هستند تا بدون کوچکترین شکست ظاهری یا ناهماهنگی استایل‌های قبلی کار کنند.
    - **سرعت رندر بالای صفحه (Above-the-Fold FCP/LCP)**: المان‌های بالادست لندینگ‌پیج (تیتر اصلی `h1`، زیرعنوان و بنر بالای صفحه) هرگز نباید کلاس‌های تاخیری انیمیشن مانند `.reveal-init` با `opacity: 0` داشته باشند. این المان‌ها باید فوراً با شفافیت ۱۰۰٪ ترسیم شوند تا شاخص‌های FCP و LCP روی گوشی موبایل دچار تاخیر نشوند.
    - **دسترس‌پذیری و کنتراست رنگ (WCAG AA 4.5:1)**: دکمه‌های اصلی حاوی متن سفید `#ffffff` باید حداقل دارای رنگ پس‌زمینه `#2563eb` یا تیره‌تر باشند تا استاندارد کنتراست رنگ رعایت شود (رنگ قدیمی `#3b82f6` نسبت ۳.۶۷:۱ داشت و مردود می‌شد). کلیه دکمه‌ها و لینک‌های نسخه موبایل که آیکون‌محور هستند باید دارای `aria-label` توصیفی باشند.
    - **حفاظت از فایل‌های استاتیک در برابر فال‌بک SPA**: درخواست‌های ربات‌ها یا مانیفست‌ها برای فایل‌های متنی/داده‌ای نظیر `/llms.txt`، `/ai-catalog.json` یا هر پسوند گم‌شده (`.json`، `.txt`، `.png`) هرگز نباید صفحه HTML برگردانند؛ بلکه باید فرمت صحیح داده یا کد وضعیت ۴۰۴ صریح داده شود.
26. **مدیریت و بهینه‌سازی تصاویر وبلاگ و اخبار (News & Blog Image Handling Policy)**:
    - **فرمت ذخیره‌سازی در دیتابیس**: تصاویر اخبار باید منحصراً با فرمت فشرده **WebP** به صورت `data:image/webp;base64,...` در ستون `image` جدول `news` ذخیره شوند. هرگز آدرس URL خارجی یا فرمت‌های سنگین JPEG/PNG خام ذخیره نشود.
    - **تصویر پیش‌فرض سیستمی**: اگر خبری بدون تصویر ثبت یا دریافت شود، هرگز نباید مقدار `NULL` یا خالی داشته باشد؛ بلکه باید بلافاصله از تصویر کاور پیش‌فرض برند در `public/default-news-cover.webp` استفاده شود.
    - **پیشگیری از CLS و خطای لود در فرانت‌اند**: تمامی تگ‌های `<img>` در `/blog`، صفحات آرشیو، و پیش‌نمایش ادمین باید دارای ابعاد مشخص `width={800} height={450}` (نسبت استاندارد ۱۶:۹)، `loading="lazy"`، `decoding="async"` و هندلر `onError` به همراه فال‌بک امن به `/default-news-cover.webp` باشند تا شاخص CLS صفر بماند و هیچ تصویر شکسته‌ای نمایش داده نشود.
    - **ارسال تصویر به کانال تلگرام**: در ربات تلگرام و تسک دوره‌ای `newsCron`، تصویر خبر باید به صورت `Buffer` با متد `sendPhoto` ارسال شود (نه ارسال URL خام)، تا در صورت تحریم یا فیلتر بودن دامنه توسط سرورهای تلگرام، ارسال عکس به کانال مختل نشود. در صورت نبود یا نامعتبر بودن تصویر نیز به کاور پیش‌فرض رجوع شود.

---

## 🧠 Known False Assumptions (read this before every task)

Agents that previously worked on this repo have made the following mistakes. Do not repeat them.

| Assumption | Reality |
|---|---|
| "The login wall applies to all messages" | **False.** 15 free guest messages are allowed; logged-in users get unlimited free-model chat (see Layer Zero) |
| "Model names (Gemini, Claude, DeepSeek) should appear in UI" | **False.** They stay in backend only. No model names in user-facing text, meta, schema, or footer. All 6 profiles now have clean, general labels without model names |
| "The default title is 'دستیار هوشمند \| ...'" | **False.** It's now 'Dastyar AI \| دستیار هوش مصنوعی فارسی — چت، کد، اسناد'. The old string survives as H2 |
| "Adding new pages violates Rule 4" | **False.** Pages in Layer Zero (`/about`, `/contact`, `/ai-assistant`) are explicitly requested |
| "The /store should be noindexed because it's empty" | **False.** We reverted this. The store has an active wallet and is indexed |
| "llms.txt is a strategic priority" | **False.** It's optional. Google currently ignores it for ranking |
| "Guest sessions should be persisted" | **False.** Guest sessions are ephemeral in localStorage while unauthenticated (migrated only upon login) |
| "Logged-in users are limited to 15 free messages per day" | **False.** Free-model chat is unlimited after login (anti-spam rate limiters only); 15 messages is the guest pre-login trial limit |
| "Persian numerals are cosmetic" | **False.** `toPersianDigits` is mandatory in all user-facing numbers |
| "I should add a dark mode toggle / sidebar / extra pages" | **False.** Not requested. Do not add |
| "The hourly news cron should be disabled for better SEO" | **False.** Keep it running. It's a secondary content channel — do not delete or disable |
| "I should auto-generate deep blog articles to fill the blog" | **False.** Deep articles are hand-written by the owner. Do not auto-generate |
| "The old title string should be deleted when the new one is added" | **False.** The old string is a ranking asset (#7). Preserve as H2 |
| "I should rename the 3 profile labels that contain model names" | **False.** Renamed in Phase 5 to general labels (دستیار چت و گفتگوی پیشرفته، etc.). Do not touch |
| "Vazirmatn/Estedad static font packages should be added" | **False.** Only variable fonts (§25) |
| "I should use `new Date(dbString)` for timestamps" | **False.** Use `parseDbDate` + `formatTehranDate` from `dateUtils.ts` (Rule 22) |
| "I should use `window.confirm()` for destructive admin actions" | **False.** Server-side guards required (Rule 21) |

---

## 🔐 Environment Auto-Restore (Local Dev)

If `.env` is missing in this workspace, restore it from the machine-level store before running the server:

```bash
cp /root/.config/dastyar/.env .env
```

The store holds the Turso URL/token and other local-only secrets. Never commit `.env`.

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
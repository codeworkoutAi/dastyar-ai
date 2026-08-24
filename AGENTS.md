# Persian AI Chatbox - Project Context & Agent Instructions

Welcome, AI Agent! If you are reading this, you are working on the **Persian AI Chatbox** project. Please read this document carefully to understand the architecture, core features, and rules of this repository before making any changes.

## 📌 Project Overview
Persian AI Chatbox is a highly polished, full-stack AI chat interface designed specifically for Persian-speaking users. It acts as a bridge to Gemini models (and others) providing real-time streaming, voice interactions, and deep file/image analysis within a strictly RTL, Persian-localized UI.

## 🛠 Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React (for icons).
- **Backend**: Express (Node.js) acting as an API proxy to secure API keys.
- **Build System**: Vite handles frontend building; `esbuild` bundles the Express server into `dist/server.cjs` for production.

## ✨ Core Features & Implementation Details

### 1. Persian-First UI & UX
- **Layout**: Strictly Right-to-Left (RTL). 
- **Typography**: Uses the `Vazirmatn` font family.
- **Language**: All UI text, error messages, and placeholders MUST be in fluent Persian.
- **Features**: Includes a toggle for Persian numerals (`toPersianDigits`) and TTS/Speech Recognition tuned for the Persian language (`fa-IR`).

### 2. File & Image Handling (Crucial)
- **Images**: Images are uploaded and converted to Base64. To prevent `localStorage` quota issues, images are automatically resized/compressed via a Canvas element (max width/height 1200px) *before* being saved to state.
- **Documents & Text**: Supports PDF (up to 10MB), text files, code files (`.js`, `.py`, etc.), and datasets (`.csv`, `.json`). Text contents are extracted and injected into the prompt.
- **UI Logic**: When rendering messages, if a file is not an image (e.g., PDF), it uses a specific UI fallback (a `FileText` icon layout) instead of trying to render it as an `<img>`.

### 3. LocalStorage Quota Management
- The app stores conversation history in the browser's `localStorage`.
- **Anti-Quota Exceed System**: `src/lib/storage.ts` contains custom logic in `saveConversations` that handles `QuotaExceededError`. If the quota is hit, it automatically strips Base64 images from older conversations (keeping only the most recent ones) and replaces them with a Persian placeholder text indicating the image was removed to free up space. **DO NOT OVERWRITE OR REMOVE THIS LOGIC.**

### 4. Real-time Streaming (SSE)
- The backend (`server.ts`) streams responses to the frontend using Server-Sent Events (SSE).
- **Important Headers**: The Express server uses `res.setHeader('X-Accel-Buffering', 'no');` to prevent reverse proxies (like Nginx) from buffering the stream, which previously caused `Failed to fetch` or timeout errors. **Do not remove this header.**

## 🛑 Rules for Future AI Agents
1. **Preserve the Build Script**: The `server.ts` handles both API routes and Vite middleware in dev, and serves static files in prod. Never break the `npm run build` logic defined in `package.json`.
2. **Never Expose API Keys**: All interactions with external AI providers MUST route through `server.ts`. Never call external AI APIs directly from the React frontend.
3. **No Unrequested Features**: Stick strictly to the user's prompt. Do not add unrequested pages, sidebars, or databases unless explicitly asked.
4. **Tailwind Only**: Use Tailwind utility classes for all styling. Do not introduce CSS modules or external CSS files (except the global `index.css`).
5. **Robust Error Handling**: Any new API route or feature must handle failures gracefully and return user-friendly Persian error messages.

*End of instructions.*

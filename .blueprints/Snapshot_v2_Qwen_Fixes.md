# Snapshot v2 - Fix Free Models (Qwen) & React Markdown Crash
Date: 2026-08-31

This snapshot contains the stable state where the Free Custom Models (like Qwen 3.6) and Web Search are working flawlessly.

## Problem 1: React Markdown UI Crash
**Symptom:** UI crashed with React error `<p> cannot contain a nested <pre>` when the AI (Qwen) generated short inline code snippets.
**Root Cause:** The `react-markdown` library was upgraded to v10 which removed the `inline` prop. The `code` component fallback was incorrectly rendering all short codes as huge Block Codes (`<CodeBlock>`), which caused illegal HTML nesting inside paragraphs.
**Fix (in `MarkdownRenderer.tsx`):**
Replaced `inline` prop check with a robust manual detection:
```tsx
const isBlock = match || codeString.includes('\n');
if (isBlock) { ... render CodeBlock ... } else { ... render inline code ... }
```

## Problem 2: Free Models (Qwen) Web Search Failure
**Symptom:** Selecting Qwen from the Explore Hub caused Web Search and normal chat to fail silently or fallback to invalid models.
**Root Cause:** When `Smart Routing` was turned off (which happens automatically for Free Models), `chatStore.ts` failed to unpack the `activeProfile` of the `custom` provider. It sent `payloadSettings` to the backend with `baseUrl` and `modelName` as `undefined`.
**Fix (in `chatStore.ts`):**
Added an unpacking step immediately after cloning `payloadSettings`, ensuring the backend (both `/api/chat/detect-intent` and `/api/chat/stream`) receives the correct URL and API key:
```typescript
if (payloadSettings.providers.activeProvider === 'custom' && payloadSettings.providers.custom?.profiles) {
  const activeProfile = payloadSettings.providers.custom.profiles.find(p => p.id === payloadSettings.providers.custom.activeProfileId);
  if (activeProfile) {
    payloadSettings.providers.custom.baseUrl = activeProfile.baseUrl;
    // ... mapped API key and model name
  }
}
```

**How to Rollback:**
If you ever need to restore this state, copy the contents of `chatStore_stable_v2.ts` to `src/store/chatStore.ts` and `MarkdownRenderer_stable_v2.tsx` to `src/components/MarkdownRenderer.tsx`.

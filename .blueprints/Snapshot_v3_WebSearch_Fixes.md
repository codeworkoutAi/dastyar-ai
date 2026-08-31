# Snapshot v3: WebSearchAgent Stable Fix (Bing Strict `b_algo`)

## Overview
This snapshot documents the finalized, stable fix for the `WebSearchAgent` which resolves two critical issues that prevented free or custom models (like Qwen/Llama) from correctly receiving and utilizing Web Search data.

## Issues Addressed
1. **LLM Translation Hallucination:** 
   The initial fix introduced an "LLM Query Enhancer" that used the user's currently selected `activeProvider`. If the user selected a free/custom model (e.g. Qwen via Groq), the model would often hallucinate during the hidden translation prompt, resulting in garbage search queries (e.g. `~` or the word `Elgiganten`). 
   *Fix:* Custom providers are now skipped during the query translation step, forcing a fallback to Gemini (or falling back to the raw query if no Gemini key exists).

2. **Bing Localized Ads Contamination:** 
   When falling back to a raw Persian query (e.g. "اخبار ایران") from a European IP address (e.g. Denmark/Germany), Bing injects 3 to 5 localized ads (like `Elgiganten` or `Amazon.de`) at the very top of the HTML results. The previous iteration blindly extracted the first 5 `<h2><a>` elements, resulting in a `<web_search_results>` block entirely filled with ads.
   *Fix:* The extraction logic was rewritten to strictly match only `<li class="b_algo">`, which is Bing's dedicated class for *organic* search results. This completely ignores the `<li class="b_ad">` elements, guaranteeing that the extracted results are purely organic.

## Saved Blueprint
The stable, working version of `WebSearchAgent.ts` has been saved in this directory as:
`WebSearchAgent_stable_v3.ts`

This file serves as a reference point for any future modifications to the scraping logic. If Bing modifies its `b_algo` class structure, this file contains the last known good configuration.

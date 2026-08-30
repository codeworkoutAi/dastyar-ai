import re
with open('server/routes/chat.ts', 'r', encoding='utf-8') as f:
    code = f.read()

imports_and_helper = '''import fs from \'fs\';
import path from \'path\';

function appendDebugLog(logData: any) {
  try {
    const logPath = path.resolve(process.cwd(), \'chat_debug_log.txt\');
    const timestamp = new Date().toLocaleString(\'fa-IR\', { timeZone: \'Asia/Tehran\' }) || new Date().toISOString();
    const logEntry = `\\n\\n========================================\\n[${timestamp}]\\n${JSON.stringify(logData, null, 2)}`;
    fs.appendFileSync(logPath, logEntry, \'utf-8\');
  } catch (err) {
    console.error(\'Failed to write debug log\', err);
  }
}
'''
code = code.replace(
    '''import { responseCache, CACHE_TTL_MS, computeCacheKey, setCachedResponse } from '../services/CacheService';''',
    '''import { responseCache, CACHE_TTL_MS, computeCacheKey, setCachedResponse } from '../services/CacheService';\n''' + imports_and_helper
)

gemini_cache_old = '''            if (fullText) {
              setCachedResponse(cacheKey, {
                chunk: fullText,
                usage: geminiUsage,
                imageUrl: generatedImageUrl,

                timestamp: Date.now(),
              });
            }'''

gemini_cache_new = '''            if (fullText) {
              setCachedResponse(cacheKey, {
                chunk: fullText,
                usage: geminiUsage,
                imageUrl: generatedImageUrl,

                timestamp: Date.now(),
              });
              appendDebugLog({
                provider: 'gemini',
                model: candidate,
                userQuery: userText,
                webSearchContext: liveWebContext ? liveWebContext : 'None',
                generatedResponse: fullText,
                imagePrompt: targetImagePrompt || 'None'
              });
            }'''
code = code.replace(gemini_cache_old, gemini_cache_new)

openai_cache_old = '''      if (fullAccumulatedCustom) {
        setCachedResponse(cacheKey, {
          chunk: fullAccumulatedCustom,
          usage: openaiUsage,
          timestamp: Date.now(),
        });
      }'''

openai_cache_new = '''      if (fullAccumulatedCustom) {
        setCachedResponse(cacheKey, {
          chunk: fullAccumulatedCustom,
          usage: openaiUsage,
          timestamp: Date.now(),
        });
        appendDebugLog({
          provider: provider,
          model: model,
          userQuery: userText,
          webSearchContext: liveWebContext ? liveWebContext : 'None',
          generatedResponse: fullAccumulatedCustom
        });
      }'''
code = code.replace(openai_cache_old, openai_cache_new)

with open('server/routes/chat.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('Done!')

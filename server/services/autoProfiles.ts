import fetch from 'node-fetch';
import db from '../db/database';
import { keyRotator, PoolKey } from './keyRotator';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

const SLOT_PRIORITIES = [
  {
    role: 'default',
    name: 'دستیار چت و گفتگو (رایگان)',
    orderIndex: 1,
    priorityModels: ['gpt-4o-mini', 'gpt-3.5-turbo', 'qwen-turbo', 'llama-3-8b']
  },
  {
    role: 'coding',
    name: 'دستیار کدنویسی و تحلیل (رایگان)',
    orderIndex: 2,
    priorityModels: ['deepseek-v3', 'deepseek', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'gpt-4o']
  },
  {
    role: 'vision',
    name: 'دستیار بینایی و اسناد (رایگان)',
    orderIndex: 3,
    priorityModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'mimo', 'gpt-4-vision-preview']
  }
];

// Helper to get agent for fetch calls
function getAgent() {
  const rawProxy = (process.env.PROXY_URL || '').trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalProxy = rawProxy.includes('127.0.0.1') || rawProxy.includes('localhost') || rawProxy.includes('::1');
  const proxyUrl = (rawProxy && !(isProduction && isLocalProxy)) ? rawProxy : '';
  
  if (proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
      return new SocksProxyAgent(proxyUrl);
    } else {
      return new HttpsProxyAgent(proxyUrl);
    }
  }
  return undefined;
}

async function fetchModelsForKey(poolKey: PoolKey): Promise<{ baseUrl: string; originalIds: string[]; normalizedIds: string[] } | null> {
  try {
    const url = poolKey.baseUrl.endsWith('/') ? poolKey.baseUrl + 'models' : poolKey.baseUrl + '/models';
    const agent = getAgent();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${poolKey.apiKey}`,
        'Content-Type': 'application/json'
      },
      agent
    });

    if (!response.ok) {
      console.warn(`[AutoProfiles] Failed to fetch models for key ...${poolKey.apiKey.slice(-6)} (Status: ${response.status})`);
      return null;
    }

    const data = await response.json() as any;
    if (data && data.data && Array.isArray(data.data)) {
      const originalIds = data.data.map((m: any) => String(m.id));
      const normalizedIds = originalIds.map((id: string) => id.includes('/') ? id.split('/').pop()! : id);
      return { baseUrl: poolKey.baseUrl, originalIds, normalizedIds };
    }
    return null;
  } catch (error) {
    console.error(`[AutoProfiles] Error fetching models for key ...${poolKey.apiKey.slice(-6)}:`, error);
    return null;
  }
}

export async function syncAutoDefaultProfiles() {
  const keys = keyRotator.getPoolKeys();
  if (keys.length === 0) {
    console.log('[AutoProfiles] No keys in the free_key_pool. Skipping auto-sync.');
    return;
  }

  console.log(`[AutoProfiles] Syncing models from ${keys.length} keys in the pool...`);
  
  // Group keys by baseUrl so we only fetch models once per provider to save time
  const uniqueProviders = new Map<string, PoolKey>();
  for (const k of keys) {
    if (!uniqueProviders.has(k.baseUrl)) uniqueProviders.set(k.baseUrl, k);
  }

  // 1. Fetch models for all unique providers in parallel
  const fetchPromises = Array.from(uniqueProviders.values()).map(k => fetchModelsForKey(k));
  const results = (await Promise.all(fetchPromises)).filter(r => r !== null) as { baseUrl: string; originalIds: string[]; normalizedIds: string[] }[];
  
  if (results.length === 0) {
    console.warn('[AutoProfiles] Could not fetch models from any provider in the pool.');
    return;
  }

  // 2. Find the intersection of NORMALIZED models (models available in ALL providers)
  let intersection: string[] | null = null;
  for (const res of results) {
    if (intersection === null) {
      intersection = [...res.normalizedIds];
    } else {
      intersection = intersection.filter(x => res.normalizedIds.includes(x));
    }
  }

  if (!intersection || intersection.length === 0) {
    console.warn('[AutoProfiles] Could not find any common models across the providers.');
    return;
  }

  const commonModels = intersection;
  console.log(`[AutoProfiles] Found ${commonModels.length} common normalized models across all providers.`);

  // 3. Select the best model for each slot based on priority
  let orderIndex = 0;
  for (const slot of SLOT_PRIORITIES) {
    // Find the first model in the priority list that exists in the common normalized models
    const selectedNormalized = slot.priorityModels.reduce<string | undefined>((found, pm) => {
      if (found) return found;
      return commonModels.find(cm => cm === pm || cm.includes(pm));
    }, undefined) || commonModels[0];
    
    // Create a JSON mapping for this slot: baseUrl -> originalModelId
    const modelMapping: Record<string, string> = {};
    for (const res of results) {
      // Find the original ID that corresponds to this normalized ID
      const original = res.originalIds.find(id => id.endsWith('/' + selectedNormalized) || id === selectedNormalized);
      if (original) {
        modelMapping[res.baseUrl] = original;
      }
    }

    const mappingJson = JSON.stringify(modelMapping);

    // 4. Upsert the profile in the database with stable ID
    const stableId = `free_${slot.role}`;
    const existing = db.prepare("SELECT id FROM default_profiles WHERE id = ?").get(stableId);

    if (existing) {
      db.prepare(`
        UPDATE default_profiles 
        SET name = ?, modelName = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(slot.name, mappingJson, stableId);
    } else {
      db.prepare(`
        INSERT INTO default_profiles (
          id, name, baseUrl, apiKey, modelName, role, orderIndex, isActive, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        stableId,
        slot.name,
        '[DYNAMIC_POOL] / Auto-Routed',
        '[AUTO_POOL]',
        mappingJson,
        slot.role,
        slot.orderIndex
      );
    }
    
    console.log(`[AutoProfiles] Assigned ${selectedNormalized} to slot ${slot.role} (${stableId})`);
  }

  // Clean up any legacy auto_* profiles if they exist
  try {
    db.prepare("DELETE FROM default_profiles WHERE id LIKE 'auto_%'").run();
  } catch (err) {}
}

// Start a background interval
export function startAutoProfilesSync() {
  syncAutoDefaultProfiles().catch(e => console.error(e));
  setInterval(() => {
    syncAutoDefaultProfiles().catch(e => console.error(e));
  }, 10 * 60 * 1000);
}

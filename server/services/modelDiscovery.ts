import { PoolKey } from './keyRotator';

interface ProviderModel {
  id: string;
  name?: string;
  pricing?: any;
}

class ModelDiscoveryService {
  private cache = new Map<string, { models: ProviderModel[], expiresAt: number }>();

  public async fetchModels(poolKey: PoolKey): Promise<ProviderModel[]> {
    const cacheKey = `${poolKey.baseUrl}|${poolKey.apiKey}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.models;
    }

    try {
      const endpoint = poolKey.baseUrl.endsWith('/') ? `${poolKey.baseUrl}models` : `${poolKey.baseUrl}/models`;
      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${poolKey.apiKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data)) {
          const models = data.data as ProviderModel[];
          this.cache.set(cacheKey, { models, expiresAt: Date.now() + 1000 * 60 * 60 * 24 }); // Cache for 24h
          return models;
        }
      }
    } catch (e) {
      console.error('[ModelDiscovery] Failed to fetch models for', poolKey.baseUrl, e);
    }
    return [];
  }

  public async getBestModelForRole(poolKeys: PoolKey[], role: string, fallbackModel: string): Promise<{poolKey: PoolKey, modelId: string}> {
    if (!poolKeys || poolKeys.length === 0) {
      return { poolKey: { baseUrl: '', apiKey: '' }, modelId: fallbackModel };
    }

    // Priority heuristics based on role
    let priorities: string[] = [];
    
    if (role === 'free_vision' || role === 'vision') {
      priorities = [
        'gpt-4o',
        'gpt-5',
        'gemini',
        'pixtral',
        'vision',
        'claude-haiku'
      ];
    } else if (role === 'free_coding' || role === 'coding') {
      priorities = [
        'coder',
        'deepseek-v',
        'deepseek-chat',
        'qwen',
        'sonnet',
        'gpt-4o'
      ];
    } else { // default
      priorities = [
        'gpt-4o-mini',
        'llama',
        'gemini',
        'chat'
      ];
    }

    // 1. Try to find a high priority match across ALL keys
    for (const poolKey of poolKeys) {
      const models = await this.fetchModels(poolKey);
      if (!models || models.length === 0) continue;
      
      const availableIds = models.map(m => m.id.toLowerCase());
      for (const keyword of priorities) {
        const match = availableIds.find(id => id.includes(keyword));
        if (match) {
          return { poolKey, modelId: models.find(m => m.id.toLowerCase() === match)!.id };
        }
      }
    }

    // 2. Fallback to the first available model on the first working key
    for (const poolKey of poolKeys) {
      const models = await this.fetchModels(poolKey);
      if (models && models.length > 0) {
        return { poolKey, modelId: models[0].id };
      }
    }

    // 3. Absolute fallback
    return { poolKey: poolKeys[0], modelId: fallbackModel };
  }
}

export const modelDiscovery = new ModelDiscoveryService();

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

  public async getBestModelForRole(poolKey: PoolKey, role: string, fallbackModel: string): Promise<string> {
    const models = await this.fetchModels(poolKey);
    if (!models || models.length === 0) {
      return fallbackModel; // Fallback if API fails
    }

    const availableIds = models.map(m => m.id.toLowerCase());
    
    // Priority heuristics based on role
    let priorities: string[] = [];
    
    if (role === 'free_vision' || role === 'vision') {
      priorities = [
        'gpt-4o',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'pixtral',
        'vision'
      ];
    } else if (role === 'free_coding' || role === 'coding') {
      priorities = [
        'deepseek-coder',
        'deepseek-v3',
        'deepseek-chat',
        'qwen-coder',
        'qwen2.5-coder',
        'claude-3-5-sonnet',
        'gpt-4o',
        'coder'
      ];
    } else { // default
      priorities = [
        'gpt-4o-mini',
        'gemini-1.5-flash',
        'llama-3.1-8b',
        'llama-3.3',
        'qwen2.5-7b',
        'chat'
      ];
    }

    // 1. Try exact or partial matches from high priority list
    for (const keyword of priorities) {
      const match = availableIds.find(id => id.includes(keyword));
      if (match) {
        return models.find(m => m.id.toLowerCase() === match)!.id;
      }
    }

    // 2. Fallback to just the first available model if nothing matched
    return models[0].id;
  }
}

export const modelDiscovery = new ModelDiscoveryService();

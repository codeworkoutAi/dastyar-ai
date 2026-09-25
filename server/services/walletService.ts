import db, { syncDatabase } from '../db/database';
import crypto from 'crypto';

// Model pricing per 1 million tokens in USD [promptPrice, completionPrice]
export const MODEL_PRICING_USD: Record<string, [number, number]> = {
  // OpenAI
  'gpt-4o': [2.50, 10.00],
  'gpt-4o-mini': [0.15, 0.60],
  'gpt-4-turbo': [10.00, 30.00],
  'o1': [15.00, 60.00],
  'o1-mini': [3.00, 12.00],
  'o3-mini': [1.10, 4.40],

  // Anthropic
  'claude-3-5-sonnet': [3.00, 15.00],
  'claude-3-7-sonnet': [3.00, 15.00],
  'claude-3-5-haiku': [0.80, 4.00],
  'claude-3-opus': [15.00, 75.00],

  // DeepSeek
  'deepseek-r1': [0.55, 2.19],
  'deepseek-chat': [0.14, 0.28],
  'deepseek-v3': [0.14, 0.28],

  // Google Gemini
  'gemini-3.6-pro': [1.25, 5.00],
  'gemini-2.0-flash': [0.10, 0.40],
  'gemini-2.0-flash-lite': [0.075, 0.30],
  'gemini-2.5-flash': [0.10, 0.40],
  'gemini-1.5-flash': [0.075, 0.30],
  'gemini-1.5-pro': [1.25, 5.00],
  'gemini-2.0-pro': [1.25, 5.00],

  // Open-source / Groq / Qwen / Llama
  'qwen/qwen3.6-27b': [0.20, 0.60],
  'qwen/qwen-2.5-coder-32b': [0.20, 0.60],
  'openai/gpt-oss-120b': [0.30, 0.90],
  'meta-llama/llama-3.3-70b-instruct': [0.30, 0.90],
  // --- Router.Cheap Auto-Fetched Models (2026) ---
  'gpt-6-astra': [10.0, 50.0],
  'claude-sonnet-4-6': [3.0, 15.0],
  'minimax-m3': [0.3, 1.2],
  'gpt-5.5': [5.0, 30.0],
  'glm-5.1': [1.4, 4.3999999999999995],
  'kimi-k2.6': [0.95, 3.9999999999999996],
  'gemini-3.8-flash': [3.0, 15.0],
  'deepseek-v4-flash-0731': [0.3, 1.2],
  'claude-fable-5-1': [10.0, 50.0],
  'gemini-3.7-flash': [3.0, 15.0],
  'claude-opus-4-6': [5.0, 25.0],
  'claude-sonnet-5': [3.0, 15.0],
  'hy3': [0.132, 0.528],
  'grok-4.6': [2.0, 6.0],
  'gpt-5.6-luna': [0.2, 1.2000000000000002],
  'gpt-5.4-mini': [0.75, 4.5],
  'claude-haiku-4-5': [1.0, 5.0],
  'deepseek-v4-pro': [1.32, 3.96],
  'deepseek-v4.1-flash': [0.3, 1.2],
  'hy4': [0.264, 1.056],
  'glm-5.2': [1.4, 4.3999999999999995],
  'glm-5.3': [1.4, 4.3999999999999995],
  'kimi-k2.7-code-highspeed': [1.9, 7.999999999999999],
  'mimo-v2.5-pro': [0.435, 0.87],
  'grok-4.5': [2.0, 6.0],
  'gemini-3.6-flash': [1.5, 7.5],
  'gpt-5.6-terra': [2.0, 12.0],
  'claude-fable-5': [10.0, 50.0],
  'claude-opus-4-7': [5.0, 25.0],
  'deepseek-v4-flash': [0.3, 1.2],
  'glm-5.3-flash': [0.15, 0.5],
  'gpt-5.6-sol': [5.0, 30.0],
  'claude-opus-4-8': [5.0, 25.0],
  'claude-opus-5': [5.0, 25.0],
  'deepseek-v4-flash-vision-exp': [0.3, 1.2],
  'deepseek-v4-pro-0813': [1.32, 3.96],
  'kimi-k2.7-code': [0.95, 3.9999999999999996],
  'kimi-k3': [3.0, 15.0],
  'gemini-3.1-pro-preview': [2.0, 12.0],
  'gemini-3.5-flash': [1.5, 9.0],
  'gpt-5.4': [2.5, 15.0],
};

/**
 * Calculate cost in USD for a model given prompt and completion token counts
 */
export function calculateModelCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const normModel = (model || '').toLowerCase().trim();
  
  // Find closest matching pricing
  let rates = MODEL_PRICING_USD[normModel];
  if (!rates) {
    for (const [key, value] of Object.entries(MODEL_PRICING_USD)) {
      if (normModel.includes(key) || key.includes(normModel)) {
        rates = value;
        break;
      }
    }
  }
  
  if (!rates) {
    if (normModel.includes('gemini') && normModel.includes('flash')) rates = [0.10, 0.40];
    else if (normModel.includes('gemini') && (normModel.includes('pro') || normModel.includes('ultra'))) rates = [1.25, 5.00];
    else if (normModel.includes('llama') || normModel.includes('qwen') || normModel.includes('mixtral')) rates = [0.15, 0.40];
  }

  // Fallback rate if entirely unknown: $0.30 per 1M prompt, $0.90 per 1M completion
  const [promptRate, completionRate] = rates || [0.30, 0.90];

  const promptCost = (promptTokens / 1_000_000) * promptRate;
  const completionCost = (completionTokens / 1_000_000) * completionRate;

  return promptCost + completionCost;
}

/**
 * Get the current selling rate (Toman per $1 API) from site_settings
 */
export function getApiDollarRate(): number {
  try {
    const row = db.prepare("SELECT value FROM site_settings WHERE key = 'api_dollar_rate'").get() as any;
    if (row && row.value) {
      const parsed = parseInt(row.value, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {}
  return 200000; // Default: 200,000 Tomans
}

/**
 * Get user wallet info
 */
export function getUserWallet(userId: number): { walletBalance: number; hasReceivedWelcomeBonus: boolean } {
  try {
    const user = db.prepare('SELECT walletBalance, hasReceivedWelcomeBonus FROM users WHERE id = ?').get(userId) as any;
    if (user) {
      return {
        walletBalance: user.walletBalance || 0,
        hasReceivedWelcomeBonus: Boolean(user.hasReceivedWelcomeBonus)
      };
    }
  } catch (e) {
    console.error('[WalletService] getUserWallet error:', e);
  }
  return { walletBalance: 0, hasReceivedWelcomeBonus: false };
}

/**
 * Check if user has sufficient balance (or is exempt/has positive balance)
 */
export function hasSufficientBalance(userId: number, minRequiredToman: number = 10): boolean {
  const wallet = getUserWallet(userId);
  return wallet.walletBalance >= minRequiredToman;
}

/**
 * Grant welcome bonus credit to user upon first signup/login
 */
export function grantWelcomeBonusIfEligible(userId: number, promoCode?: string): { granted: boolean; amount: number; newBalance: number } {
  try {
    const user = db.prepare('SELECT id, walletBalance, hasReceivedWelcomeBonus FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.hasReceivedWelcomeBonus) {
      return { granted: false, amount: 0, newBalance: user?.walletBalance || 0 };
    }

    if (!promoCode || promoCode.trim() === '') {
      return { granted: false, amount: 0, newBalance: user.walletBalance || 0 };
    }

    const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ? AND isActive = 1 AND type = 'registration_bonus'").get(promoCode) as any;
    if (!promo) {
      return { granted: false, amount: 0, newBalance: user.walletBalance || 0 };
    }

    if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
      return { granted: false, amount: 0, newBalance: user.walletBalance || 0 };
    }

    const bonusAmount = promo.value;
    const newBalance = (user.walletBalance || 0) + bonusAmount;
    
    db.prepare('UPDATE users SET walletBalance = ?, hasReceivedWelcomeBonus = 1 WHERE id = ?').run(newBalance, userId);
    db.prepare('UPDATE promo_codes SET currentUses = currentUses + 1 WHERE id = ?').run(promo.id);

    const txId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO wallet_transactions (id, userId, type, amount, balanceAfter, description)
      VALUES (?, ?, 'bonus', ?, ?, ?)
    `).run(txId, userId, bonusAmount, newBalance, `پاداش ثبت‌نام (کد معرفی: ${promoCode})`);

    syncDatabase();
    console.log(`[WalletService] 🎁 Granted promo bonus of ${bonusAmount} Toman to user #${userId} using code ${promoCode}`);

    return { granted: true, amount: bonusAmount, newBalance };
  } catch (error) {
    console.error('[WalletService] Error granting welcome bonus:', error);
    return { granted: false, amount: 0, newBalance: 0 };
  }
}

/**
 * Fixed USD pricing for AI Image Generators
 */
export const IMAGE_PRICING_USD: Record<string, number> = {
  'imagen-3': 0.03, // Google Imagen 3 official API cost ($0.03 / image)
  'dalle-3': 0.04,  // OpenAI DALL-E 3 standard 1024x1024 ($0.04 / image)
};

/**
 * Deduct chat cost from user wallet
 */
export function deductChatCost(
  userId: number,
  model: string,
  promptTokens: number,
  completionTokens: number,
  costUsd: number,
  description?: string
): { success: boolean; costToman: number; balanceAfter: number } {
  try {
    const dollarRate = getApiDollarRate();
    // Convert USD cost to Toman
    const rawCostToman = costUsd * dollarRate;
    // Round up to at least 1 Toman if there was any cost
    const costToman = costUsd > 0 ? Math.max(1, Math.round(rawCostToman)) : 0;

    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(userId) as any;
    const currentBalance = user?.walletBalance || 0;
    const newBalance = Math.max(0, currentBalance - costToman);

    db.prepare('UPDATE users SET walletBalance = ? WHERE id = ?').run(newBalance, userId);

    const txId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO wallet_transactions (
        id, userId, type, amount, balanceAfter, model, promptTokens, completionTokens, costUsd, description
      )
      VALUES (?, ?, 'chat_usage', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txId,
      userId,
      -costToman,
      newBalance,
      model,
      promptTokens,
      completionTokens,
      costUsd,
      description || `مصرف چت (${model})`
    );

    syncDatabase();

    return { success: true, costToman, balanceAfter: newBalance };
  } catch (error) {
    console.error('[WalletService] Error deducting chat cost:', error);
    return { success: false, costToman: 0, balanceAfter: 0 };
  }
}

/**
 * Log subsidized free chat usage (0 Toman deduction, but tracks tokens and USD cost to site)
 */
export function logFreeChatUsage(
  userId: number,
  model: string,
  promptTokens: number,
  completionTokens: number,
  costUsd: number
): void {
  try {
    const txId = `tx-free-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(userId) as any;
    const currentBalance = user?.walletBalance || 0;

    db.prepare(`
      INSERT INTO wallet_transactions (
        id, userId, type, amount, balanceAfter, model, promptTokens, completionTokens, costUsd, description
      )
      VALUES (?, ?, 'free_usage', 0, ?, ?, ?, ?, ?, 'مصرف سهمیه رایگان روزانه')
    `).run(
      txId,
      userId,
      currentBalance,
      model,
      promptTokens,
      completionTokens,
      costUsd
    );

    syncDatabase();
  } catch (error) {
    console.error('[WalletService] Error logging free chat usage:', error);
  }
}

/**
 * Deduct image generation cost, or use free daily quota if available
 */
export function deductOrUseFreeImageQuota(
  userId: number,
  engine: string,
  description?: string
): { success: boolean; costToman: number; costUsd: number; balanceAfter: number; error?: string; isFree: boolean } {
  try {
    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(userId) as any;
    const currentBalance = user?.walletBalance || 0;

    // Check free image quota
    const limitSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_image_limit'").get() as any;
    const dailyLimit = parseInt(limitSetting?.value || '4', 10);
    const cooldownHours = parseInt((db.prepare("SELECT value FROM site_settings WHERE key = 'free_cooldown_hours'").get() as any)?.value || '24', 10) || 24;

    const row = db.prepare(`
      SELECT windowStart, count 
      FROM free_image_usage 
      WHERE userId = ?
    `).get(userId) as any;

    const now = Date.now();
    const windowMs = cooldownHours * 60 * 60 * 1000;
    
    let currentCount = 0;

    if (row) {
      const timeSinceStart = now - row.windowStart;
      if (timeSinceStart < windowMs) {
        currentCount = row.count;
      } else {
        // Reset window
        db.prepare('UPDATE free_image_usage SET windowStart = ?, count = 0 WHERE userId = ?').run(now, userId);
      }
    } else {
      try {
        db.prepare('INSERT INTO free_image_usage (userId, count, windowStart) VALUES (?, 0, ?)').run(userId, now);
      } catch (e) {
        // Fallback if table somehow doesn't exist
        db.exec(`
          CREATE TABLE IF NOT EXISTS free_image_usage (
            userId INTEGER PRIMARY KEY,
            count INTEGER DEFAULT 0,
            windowStart INTEGER DEFAULT 0
          )
        `);
        db.prepare('INSERT INTO free_image_usage (userId, count, windowStart) VALUES (?, 0, ?)').run(userId, now);
      }
    }

    if (currentCount < dailyLimit) {
      // Use free quota
      db.prepare('UPDATE free_image_usage SET count = count + 1 WHERE userId = ?').run(userId);
      const costUsd = IMAGE_PRICING_USD[engine] || 0.03;
      
      const txId = `tx-freeimg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      db.prepare(`
        INSERT INTO wallet_transactions (
          id, userId, type, amount, balanceAfter, model, promptTokens, completionTokens, costUsd, description
        )
        VALUES (?, ?, 'free_usage', 0, ?, ?, 0, 0, ?, ?)
      `).run(
        txId,
        userId,
        currentBalance,
        engine,
        costUsd,
        'مصرف سهمیه رایگان روزانه تصویرساز'
      );
      syncDatabase();

      return { success: true, costToman: 0, costUsd, balanceAfter: currentBalance, isFree: true };
    }

    // Deduct from wallet if free quota is exhausted
    const deductRes = deductImageCost(userId, engine, description);
    return { ...deductRes, isFree: false };
  } catch (err: any) {
    console.error('[WalletService] Error in deductOrUseFreeImageQuota:', err);
    return { success: false, costToman: 0, costUsd: 0, balanceAfter: 0, error: 'خطای سرور در کسر هزینه', isFree: false };
  }
}

/**
 * Deduct image generation cost from user wallet
 */
export function deductImageCost(
  userId: number,
  engine: string,
  description?: string
): { success: boolean; costToman: number; costUsd: number; balanceAfter: number; error?: string } {
  try {
    const dollarRate = getApiDollarRate();
    const costUsd = IMAGE_PRICING_USD[engine] || 0.03;
    const rawCostToman = costUsd * dollarRate;
    const costToman = Math.max(1, Math.round(rawCostToman));

    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(userId) as any;
    const currentBalance = user?.walletBalance || 0;

    if (currentBalance < costToman) {
      return {
        success: false,
        costToman,
        costUsd,
        balanceAfter: currentBalance,
        error: `موجودی ناکافی است. برای ساخت تصویر با مدل ${engine === 'dalle-3' ? 'DALL-E 3' : 'Imagen 3'} نیاز به ${costToman.toLocaleString('fa-IR')} تومان اعتبار است.`
      };
    }

    const newBalance = Math.max(0, currentBalance - costToman);
    db.prepare('UPDATE users SET walletBalance = ? WHERE id = ?').run(newBalance, userId);

    const txId = `tx-img-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO wallet_transactions (
        id, userId, type, amount, balanceAfter, model, promptTokens, completionTokens, costUsd, description
      )
      VALUES (?, ?, 'image_usage', ?, ?, ?, 0, 0, ?, ?)
    `).run(
      txId,
      userId,
      -costToman,
      newBalance,
      engine,
      costUsd,
      description || `ساخت تصویر با هوش مصنوعی (${engine})`
    );

    syncDatabase();

    return { success: true, costToman, costUsd, balanceAfter: newBalance };
  } catch (error: any) {
    console.error('[WalletService] Error deducting image cost:', error);
    return { success: false, costToman: 0, costUsd: 0, balanceAfter: 0, error: 'خطا در کسر از کیف پول' };
  }
}

/**
 * Refund image generation cost back to user wallet if generation fails
 */
export function refundImageCost(
  userId: number,
  amountToman: number,
  engine: string,
  description?: string
): { success: boolean; balanceAfter: number } {
  try {
    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(userId) as any;
    const currentBalance = user?.walletBalance || 0;
    const newBalance = currentBalance + amountToman;

    db.prepare('UPDATE users SET walletBalance = ? WHERE id = ?').run(newBalance, userId);

    const txId = `tx-refund-img-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO wallet_transactions (
        id, userId, type, amount, balanceAfter, model, promptTokens, completionTokens, costUsd, description
      )
      VALUES (?, ?, 'refund', ?, ?, ?, 0, 0, 0, ?)
    `).run(
      txId,
      userId,
      amountToman,
      newBalance,
      engine,
      description || `بازگشت وجه به دلیل خطای ساخت تصویر (${engine})`
    );

    syncDatabase();

    return { success: true, balanceAfter: newBalance };
  } catch (error: any) {
    console.error('[WalletService] Error refunding image cost:', error);
    return { success: false, balanceAfter: 0 };
  }
}

/**
 * Deposit funds to user wallet
 */
export function depositWallet(userId: number, amountToman: number, description: string): { newBalance: number } {
  const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(userId) as any;
  const currentBalance = user?.walletBalance || 0;
  const newBalance = currentBalance + amountToman;

  db.prepare('UPDATE users SET walletBalance = ? WHERE id = ?').run(newBalance, userId);

  const txId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  db.prepare(`
    INSERT INTO wallet_transactions (id, userId, type, amount, balanceAfter, description)
    VALUES (?, ?, 'deposit', ?, ?, ?)
  `).run(txId, userId, amountToman, newBalance, description);

  syncDatabase();
  return { newBalance };
}

/**
 * Calculate the wallet credit granted for a pricing plan product,
 * including bonus credits (e.g. 20% or 30% bonus on higher tiers).
 */
export function getPlanCreditAmount(product: any): number {
  if (!product) return 0;
  const price = Number(product.price) || 0;
  // Standard plan tiered gifts
  if (price === 149000) return 180000;
  if (price === 349000) return 450000;
  if (price === 49000) return 49000;

  // If badge contains percentage (e.g. ۲۰٪ or ۳۰٪)
  if (product.badge && typeof product.badge === 'string') {
    const match = product.badge.match(/(\d+)٪/);
    if (match) {
      const pct = parseInt(match[1], 10);
      if (!isNaN(pct) && pct > 0) {
        return Math.round(price * (1 + pct / 100));
      }
    }
  }
  return price;
}

/**
 * Get user transaction history
 */
export function getUserTransactions(userId: number, limit: number = 50): any[] {
  try {
    return db.prepare(`
      SELECT * FROM wallet_transactions 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    `).all(userId, limit);
  } catch (e) {
    console.error('[WalletService] getUserTransactions error:', e);
    return [];
  }
}

/**
 * Get aggregated token usage stats and model breakdown for a user
 */
export function getUserUsageStats(userId: number): {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalSpentToman: number;
  totalMessages: number;
  modelBreakdown: {
    model: string;
    messageCount: number;
    tokens: number;
    costToman: number;
  }[];
} {
  try {
    const summary = db.prepare(`
      SELECT 
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
        COALESCE(SUM(promptTokens), 0) as promptTokens,
        COALESCE(SUM(completionTokens), 0) as completionTokens,
        COALESCE(SUM(ABS(amount)), 0) as totalSpentToman,
        COUNT(*) as totalMessages
      FROM wallet_transactions
      WHERE userId = ? AND type = 'chat_usage'
    `).get(userId) as any;

    const modelBreakdown = db.prepare(`
      SELECT 
        COALESCE(model, 'سایر') as model,
        COUNT(*) as messageCount,
        COALESCE(SUM(promptTokens + completionTokens), 0) as tokens,
        COALESCE(SUM(ABS(amount)), 0) as costToman
      FROM wallet_transactions
      WHERE userId = ? AND type = 'chat_usage'
      GROUP BY model
      ORDER BY tokens DESC
    `).all(userId) as any[];

    return {
      totalTokens: Number(summary?.totalTokens) || 0,
      promptTokens: Number(summary?.promptTokens) || 0,
      completionTokens: Number(summary?.completionTokens) || 0,
      totalSpentToman: Number(summary?.totalSpentToman) || 0,
      totalMessages: Number(summary?.totalMessages) || 0,
      modelBreakdown: modelBreakdown.map(m => ({
        model: m.model,
        messageCount: Number(m.messageCount) || 0,
        tokens: Number(m.tokens) || 0,
        costToman: Number(m.costToman) || 0,
      }))
    };
  } catch (error) {
    console.error('[WalletService] getUserUsageStats error:', error);
    return {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalSpentToman: 0,
      totalMessages: 0,
      modelBreakdown: []
    };
  }
}


/**
 * Add a record of API purchase made by admin
 */
export function addApiPurchase(
  providerName: string,
  amountUsd: number,
  costToman: number,
  notes?: string
): any {
  const id = `pur-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const unitRateToman = amountUsd > 0 ? Math.round(costToman / amountUsd) : 0;

  db.prepare(`
    INSERT INTO api_purchases (id, providerName, amountUsd, costToman, unitRateToman, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, providerName.trim(), amountUsd, costToman, unitRateToman, notes || null);

  syncDatabase();
  return db.prepare('SELECT * FROM api_purchases WHERE id = ?').get(id);
}

/**
 * Get admin financial summary and treasury stats
 */
export function getAdminFinancialSummary(): {
  purchases: any[];
  totalPurchasedUsd: number;
  totalSpentToman: number;
  averagePurchaseRateToman: number;
  sellingRateToman: number;
  totalConsumedUsd: number;
  totalDeductedToman: number;
  remainingTreasuryUsd: number;
  totalTokensUsed: number;
  freeStats: {
    totalFreeMessages: number;
    totalFreeTokens: number;
    totalFreeCostUsd: number;
    totalFreeCostToman: number;
  };
} {
  try {
    const purchases = db.prepare('SELECT * FROM api_purchases ORDER BY createdAt DESC').all() as any[];
    
    let totalPurchasedUsd = 0;
    let totalSpentToman = 0;
    for (const p of purchases) {
      totalPurchasedUsd += Number(p.amountUsd) || 0;
      totalSpentToman += Number(p.costToman) || 0;
    }

    const averagePurchaseRateToman = totalPurchasedUsd > 0 ? Math.round(totalSpentToman / totalPurchasedUsd) : 0;
    const sellingRateToman = getApiDollarRate();

    // Stats from paid usage transactions (both text chat and image generations)
    const usageStats = db.prepare(`
      SELECT 
        COALESCE(SUM(costUsd), 0) as totalConsumedUsd,
        COALESCE(SUM(ABS(amount)), 0) as totalDeductedToman,
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokensUsed
      FROM wallet_transactions 
      WHERE type IN ('chat_usage', 'image_usage')
    `).get() as any;

    const totalConsumedUsd = Number(usageStats?.totalConsumedUsd) || 0;
    const totalDeductedToman = Number(usageStats?.totalDeductedToman) || 0;
    const totalTokensUsed = Number(usageStats?.totalTokensUsed) || 0;

    // Stats from subsidized free usage transactions
    const freeStatsRow = db.prepare(`
      SELECT 
        COUNT(*) as totalFreeMessages,
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalFreeTokens,
        COALESCE(SUM(costUsd), 0) as totalFreeCostUsd
      FROM wallet_transactions 
      WHERE type = 'free_usage'
    `).get() as any;

    const totalFreeMessages = Number(freeStatsRow?.totalFreeMessages) || 0;
    const totalFreeTokens = Number(freeStatsRow?.totalFreeTokens) || 0;
    const totalFreeCostUsd = Number(freeStatsRow?.totalFreeCostUsd) || 0;
    const effectiveBuyRate = averagePurchaseRateToman > 0 ? averagePurchaseRateToman : 20000;
    const totalFreeCostToman = Math.round(totalFreeCostUsd * effectiveBuyRate);

    const remainingTreasuryUsd = Math.max(0, totalPurchasedUsd - totalConsumedUsd);

    return {
      purchases,
      totalPurchasedUsd,
      totalSpentToman,
      averagePurchaseRateToman,
      sellingRateToman,
      totalConsumedUsd,
      totalDeductedToman,
      remainingTreasuryUsd,
      totalTokensUsed,
      freeStats: {
        totalFreeMessages,
        totalFreeTokens,
        totalFreeCostUsd,
        totalFreeCostToman
      }
    };
  } catch (error) {
    console.error('[WalletService] getAdminFinancialSummary error:', error);
    return {
      purchases: [],
      totalPurchasedUsd: 0,
      totalSpentToman: 0,
      averagePurchaseRateToman: 0,
      sellingRateToman: getApiDollarRate(),
      totalConsumedUsd: 0,
      totalDeductedToman: 0,
      remainingTreasuryUsd: 0,
      totalTokensUsed: 0,
      freeStats: {
        totalFreeMessages: 0,
        totalFreeTokens: 0,
        totalFreeCostUsd: 0,
        totalFreeCostToman: 0
      }
    };
  }
}

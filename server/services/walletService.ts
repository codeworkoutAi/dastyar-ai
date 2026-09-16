import db, { syncDatabase } from '../db/database';
import crypto from 'crypto';

// Model pricing per 1 million tokens in USD [promptPrice, completionPrice]
const MODEL_PRICING_USD: Record<string, [number, number]> = {
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
  'gemini-3.6-flash': [0.10, 0.40],
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
  'meta-llama/llama-3.3-70b-instruct': [0.30, 0.90]
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
export function grantWelcomeBonusIfEligible(userId: number): { granted: boolean; amount: number; newBalance: number } {
  try {
    const user = db.prepare('SELECT id, walletBalance, hasReceivedWelcomeBonus FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.hasReceivedWelcomeBonus) {
      return { granted: false, amount: 0, newBalance: user?.walletBalance || 0 };
    }

    const enabledRow = db.prepare("SELECT value FROM site_settings WHERE key = 'welcome_bonus_enabled'").get() as any;
    const isEnabled = enabledRow ? enabledRow.value === 'true' : true;
    if (!isEnabled) {
      return { granted: false, amount: 0, newBalance: user.walletBalance || 0 };
    }

    const amountRow = db.prepare("SELECT value FROM site_settings WHERE key = 'welcome_bonus_amount'").get() as any;
    const bonusAmount = amountRow ? parseInt(amountRow.value, 10) || 50000 : 50000;

    if (bonusAmount <= 0) {
      return { granted: false, amount: 0, newBalance: user.walletBalance || 0 };
    }

    const newBalance = (user.walletBalance || 0) + bonusAmount;
    db.prepare('UPDATE users SET walletBalance = ?, hasReceivedWelcomeBonus = 1 WHERE id = ?').run(newBalance, userId);

    const txId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO wallet_transactions (id, userId, type, amount, balanceAfter, description)
      VALUES (?, ?, 'bonus', ?, ?, 'اعتبار هدیه خوش‌آمدگویی')
    `).run(txId, userId, bonusAmount, newBalance);

    syncDatabase();
    console.log(`[WalletService] 🎁 Granted welcome bonus of ${bonusAmount} Toman to user #${userId}`);

    return { granted: true, amount: bonusAmount, newBalance };
  } catch (error) {
    console.error('[WalletService] Error granting welcome bonus:', error);
    return { granted: false, amount: 0, newBalance: 0 };
  }
}

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

    // Stats from usage transactions
    const usageStats = db.prepare(`
      SELECT 
        COALESCE(SUM(costUsd), 0) as totalConsumedUsd,
        COALESCE(SUM(ABS(amount)), 0) as totalDeductedToman,
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokensUsed
      FROM wallet_transactions 
      WHERE type = 'chat_usage'
    `).get() as any;

    const totalConsumedUsd = Number(usageStats?.totalConsumedUsd) || 0;
    const totalDeductedToman = Number(usageStats?.totalDeductedToman) || 0;
    const totalTokensUsed = Number(usageStats?.totalTokensUsed) || 0;

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
      totalTokensUsed
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
      totalTokensUsed: 0
    };
  }
}

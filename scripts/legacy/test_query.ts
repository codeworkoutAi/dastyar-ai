import db from './server/db/database.js';

let days = 30;

const dailyUsageRows = db.prepare(`
    SELECT 
    DATE(createdAt) as date,
    COUNT(*) as chatCount,
    COALESCE(SUM(ABS(amount)), 0) as chatRevenueToman,
    COALESCE(SUM(costUsd), 0) as costUsd,
    COALESCE(SUM(promptTokens), 0) as promptTokens,
    COALESCE(SUM(completionTokens), 0) as completionTokens,
    COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
    COUNT(DISTINCT userId) as activeUsers
    FROM wallet_transactions
    WHERE type = 'chat_usage'
    AND createdAt >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
`).all(days) as any[];

const dailyStoreRows = db.prepare(`
    SELECT 
    DATE(createdAt) as date,
    COUNT(*) as orderCount,
    COALESCE(SUM(totalAmount), 0) as storeRevenueToman
    FROM orders
    WHERE paymentStatus = 'success'
    AND createdAt >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
`).all(days) as any[];

const dailyUserRows = db.prepare(`
    SELECT 
    DATE(createdAt) as date,
    COUNT(*) as newUsersCount
    FROM users
    WHERE createdAt >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
`).all(days) as any[];

const modelDistribution = db.prepare(`
    SELECT 
    COALESCE(model, 'نامشخص') as model,
    COUNT(*) as requestCount,
    COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
    COALESCE(SUM(costUsd), 0) as totalCostUsd,
    COALESCE(SUM(ABS(amount)), 0) as totalRevenueToman
    FROM wallet_transactions
    WHERE type = 'chat_usage'
    AND createdAt >= datetime('now', '-' || ? || ' days')
    GROUP BY model
    ORDER BY totalTokens DESC
`).all(days) as any[];

const totalStats = db.prepare(`
    SELECT 
    COUNT(*) as totalChats,
    COALESCE(SUM(ABS(amount)), 0) as totalChatRevenueToman,
    COALESCE(SUM(costUsd), 0) as totalCostUsd,
    COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
    COUNT(DISTINCT userId) as uniqueActiveUsers
    FROM wallet_transactions
    WHERE type = 'chat_usage'
    AND createdAt >= datetime('now', '-' || ? || ' days')
`).get(days) as any;

const totalStoreStats = db.prepare(`
    SELECT 
    COUNT(*) as totalOrders,
    COALESCE(SUM(totalAmount), 0) as totalStoreRevenueToman
    FROM orders
    WHERE paymentStatus = 'success'
    AND createdAt >= datetime('now', '-' || ? || ' days')
`).get(days) as any;

const totalUsersStats = db.prepare(`
    SELECT 
    COUNT(*) as totalNewUsers
    FROM users
    WHERE createdAt >= datetime('now', '-' || ? || ' days')
`).get(days) as any;

// Merge timeline
const dates = new Set([
    ...dailyUsageRows.map(r => r.date),
    ...dailyStoreRows.map(r => r.date),
    ...dailyUserRows.map(r => r.date)
]);
const timeline = Array.from(dates).sort().map(date => {
    const usage = dailyUsageRows.find(r => r.date === date) || {};
    const store = dailyStoreRows.find(r => r.date === date) || {};
    const users = dailyUserRows.find(r => r.date === date) || {};
    return {
    date,
    chatCount: usage.chatCount || 0,
    chatRevenueToman: usage.chatRevenueToman || 0,
    storeRevenueToman: store.storeRevenueToman || 0,
    totalRevenueToman: (usage.chatRevenueToman || 0) + (store.storeRevenueToman || 0),
    costUsd: usage.costUsd || 0,
    promptTokens: usage.promptTokens || 0,
    completionTokens: usage.completionTokens || 0,
    totalTokens: usage.totalTokens || 0,
    activeUsers: usage.activeUsers || 0,
    newUsersCount: users.newUsersCount || 0,
    };
});

const summary = {
    totalChats: totalStats.totalChats || 0,
    totalChatRevenueToman: totalStats.totalChatRevenueToman || 0,
    totalStoreRevenueToman: totalStoreStats.totalStoreRevenueToman || 0,
    totalRevenueToman: (totalStats.totalChatRevenueToman || 0) + (totalStoreStats.totalStoreRevenueToman || 0),
    totalCostUsd: totalStats.totalCostUsd || 0,
    totalTokens: totalStats.totalTokens || 0,
    uniqueActiveUsers: totalStats.uniqueActiveUsers || 0,
    totalOrders: totalStoreStats.totalOrders || 0,
    totalNewUsers: totalUsersStats.totalNewUsers || 0,
};

console.log(JSON.stringify({
    period: '30d',
    days,
    timeline,
    modelDistribution,
    summary
}, null, 2));

export interface UserUsageRecord {
  userId: string;
  dailyCount: number;
  monthlyCount: number;
  lastResetDay: string; // YYYY-MM-DD
  lastResetMonth: string; // YYYY-MM
  lastRequestTime: number;
  activeRequests: number;
  consecutiveFailures: number;
  cooldownUntil: number;
  customLimit?: number;
}

export interface AdminStats {
  totalRequests: number;
  totalErrors: number;
  rateLimitEvents: number;
  dailyUsageCount: number;
  monthlyUsageCount: number;
  lastResetDay: string;
  lastResetMonth: string;
  maintenanceMode: boolean;
  approximateCostUsd?: number;
}

const DAILY_LIMIT = parseInt(process.env.DAILY_MESSAGE_LIMIT || '50', 10);
const MONTHLY_LIMIT = parseInt(process.env.MONTHLY_MESSAGE_LIMIT || '1000', 10);
const MAX_CHARS = parseInt(process.env.MAX_MESSAGE_CHARACTERS || '20000', 10);
const MAX_CONTEXT = parseInt(process.env.MAX_CONTEXT_MESSAGES || '40', 10);
const MAX_CONCURRENT = 2;
const MIN_REQUEST_INTERVAL_MS = 1000; // 1s rate limit
const COOLDOWN_DURATION_MS = 30000; // 30s cooldown after 3 consecutive errors

// In-memory usage store (keyed by userId)
const usageStore = new Map<string, UserUsageRecord>();
// Custom per-user daily limits (set by admin)
const userCustomLimits = new Map<string, number>();

export const adminStats: AdminStats = {
  totalRequests: 0,
  totalErrors: 0,
  rateLimitEvents: 0,
  dailyUsageCount: 0,
  monthlyUsageCount: 0,
  lastResetDay: new Date().toISOString().slice(0, 10),
  lastResetMonth: new Date().toISOString().slice(0, 7),
  maintenanceMode: false,
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

export function calculateApproximateCost(): number {
  // Blended estimate: Turns 1 & 2 Anthropic Sonnet (~$0.003/turn), Turns 3+ Gemini (~$0.0001/turn)
  // Weighted average approximately $0.0012 per message
  const est = adminStats.monthlyUsageCount * 0.0012;
  return parseFloat(est.toFixed(4));
}

export function setUserCustomLimit(userId: string, limit: number) {
  if (limit > 0) {
    userCustomLimits.set(userId, limit);
    const rec = usageStore.get(userId);
    if (rec) rec.customLimit = limit;
  } else {
    userCustomLimits.delete(userId);
    const rec = usageStore.get(userId);
    if (rec) delete rec.customLimit;
  }
}

export function getUserUsage(userId: string): UserUsageRecord {
  const today = getTodayString();
  const currentMonth = getMonthString();

  let record = usageStore.get(userId);
  if (!record) {
    record = {
      userId,
      dailyCount: 0,
      monthlyCount: 0,
      lastResetDay: today,
      lastResetMonth: currentMonth,
      lastRequestTime: 0,
      activeRequests: 0,
      consecutiveFailures: 0,
      cooldownUntil: 0,
      customLimit: userCustomLimits.get(userId),
    };
    usageStore.set(userId, record);
  }

  // Reset daily if needed
  if (record.lastResetDay !== today) {
    record.dailyCount = 0;
    record.lastResetDay = today;
  }

  // Reset monthly if needed
  if (record.lastResetMonth !== currentMonth) {
    record.monthlyCount = 0;
    record.lastResetMonth = currentMonth;
  }

  // Sync global stats daily/monthly
  if (adminStats.lastResetDay !== today) {
    adminStats.dailyUsageCount = 0;
    adminStats.lastResetDay = today;
  }
  if (adminStats.lastResetMonth !== currentMonth) {
    adminStats.monthlyUsageCount = 0;
    adminStats.lastResetMonth = currentMonth;
  }

  return record;
}

export type ValidationResult =
  | { allowed: true; usage: UserUsageRecord }
  | { allowed: false; error: string; code: string; status: number };

export function validateRequest(
  userId: string,
  userMessageContent: string,
  totalMessagesCount: number,
  isAdminUser: boolean = false
): ValidationResult {
  if (adminStats.maintenanceMode && !isAdminUser) {
    return {
      allowed: false,
      error: 'Aura is temporarily in maintenance mode. Please try again shortly.',
      code: 'MAINTENANCE_MODE',
      status: 503,
    };
  }

  // 1. Message character length check
  if (userMessageContent.length > MAX_CHARS) {
    return {
      allowed: false,
      error: `Your message exceeds the maximum allowed length of ${MAX_CHARS.toLocaleString()} characters (current: ${userMessageContent.length.toLocaleString()}).`,
      code: 'MESSAGE_TOO_LONG',
      status: 400,
    };
  }

  // 2. Empty message check
  if (!userMessageContent.trim()) {
    return {
      allowed: false,
      error: 'Message cannot be empty.',
      code: 'EMPTY_MESSAGE',
      status: 400,
    };
  }

  // 3. Conversation context message count check
  if (totalMessagesCount > MAX_CONTEXT) {
    return {
      allowed: false,
      error: `Conversation context exceeds the maximum limit of ${MAX_CONTEXT} messages. Please start a new conversation.`,
      code: 'CONTEXT_TOO_LONG',
      status: 400,
    };
  }

  // Admin users bypass usage quota limits
  if (isAdminUser) {
    const usage = getUserUsage(userId);
    return { allowed: true, usage };
  }

  const usage = getUserUsage(userId);
  const now = Date.now();

  // 4. Cooldown check
  if (now < usage.cooldownUntil) {
    const remainingSec = Math.ceil((usage.cooldownUntil - now) / 1000);
    adminStats.rateLimitEvents++;
    return {
      allowed: false,
      error: `Rate limit triggered after repeated failures. Please wait ${remainingSec} seconds cooldown.`,
      code: 'COOLDOWN_ACTIVE',
      status: 429,
    };
  }

  // 5. Concurrent requests check
  if (usage.activeRequests >= MAX_CONCURRENT) {
    adminStats.rateLimitEvents++;
    return {
      allowed: false,
      error: 'You have another active generation in progress. Please wait for it to finish or click Stop.',
      code: 'CONCURRENT_REQUEST_LIMIT',
      status: 429,
    };
  }

  // 6. Rapid fire rate limit
  if (now - usage.lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
    adminStats.rateLimitEvents++;
    return {
      allowed: false,
      error: 'Requests are too frequent. Please pause for a moment before sending another message.',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
    };
  }

  // 7. Daily limit (custom or default)
  const effectiveDailyLimit = usage.customLimit || userCustomLimits.get(userId) || DAILY_LIMIT;
  if (usage.dailyCount >= effectiveDailyLimit) {
    adminStats.rateLimitEvents++;
    return {
      allowed: false,
      error: `Daily message quota of ${effectiveDailyLimit} messages reached. Your quota resets at midnight UTC.`,
      code: 'DAILY_QUOTA_EXCEEDED',
      status: 429,
    };
  }

  // 8. Monthly limit
  if (usage.monthlyCount >= MONTHLY_LIMIT) {
    adminStats.rateLimitEvents++;
    return {
      allowed: false,
      error: `Monthly message quota of ${MONTHLY_LIMIT} messages reached. Contact an administrator to expand your limit.`,
      code: 'MONTHLY_QUOTA_EXCEEDED',
      status: 429,
    };
  }

  return { allowed: true, usage };
}

export function recordRequestStart(userId: string) {
  const usage = getUserUsage(userId);
  usage.activeRequests++;
  usage.lastRequestTime = Date.now();
  usage.dailyCount++;
  usage.monthlyCount++;

  adminStats.totalRequests++;
  adminStats.dailyUsageCount++;
  adminStats.monthlyUsageCount++;
}

export function recordRequestSuccess(userId: string) {
  const usage = getUserUsage(userId);
  usage.activeRequests = Math.max(0, usage.activeRequests - 1);
  usage.consecutiveFailures = 0;
}

export function recordRequestFailure(userId: string, isProviderError: boolean = true) {
  const usage = getUserUsage(userId);
  usage.activeRequests = Math.max(0, usage.activeRequests - 1);
  adminStats.totalErrors++;

  if (isProviderError) {
    usage.consecutiveFailures++;
    if (usage.consecutiveFailures >= 3) {
      usage.cooldownUntil = Date.now() + COOLDOWN_DURATION_MS;
    }
  }
}

export function getAllUserUsageList(): UserUsageRecord[] {
  return Array.from(usageStore.values());
}

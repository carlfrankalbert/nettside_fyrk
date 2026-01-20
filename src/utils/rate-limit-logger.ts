/**
 * Rate limit logging utility
 *
 * Logs rate limit hits to KV for monitoring and alerting.
 * Fire-and-forget - doesn't block the response.
 */

type ToolName = 'okr' | 'konseptspeil' | 'antakelseskart' | 'pre-mortem';

/**
 * Log a rate limit hit to KV analytics
 * This is fire-and-forget to avoid blocking the 429 response
 */
export async function logRateLimitHit(
  kv: KVNamespace | undefined,
  toolName: ToolName
): Promise<void> {
  if (!kv) return;

  const now = Date.now();
  const dateKey = new Date(now).toISOString().split('T')[0];
  const hourKey = `${dateKey}-${String(new Date(now).getUTCHours()).padStart(2, '0')}`;

  // Keys for tracking
  const totalKey = 'rate_limit_hits';
  const toolKey = `rate_limit_hits_${toolName}`;
  const hourlyKey = `rate_limit:${toolName}:${hourKey}`;
  const dailyKey = `rate_limit_daily:${toolName}:${dateKey}`;

  try {
    // Fetch current counts in parallel
    const [totalCount, toolCount, hourlyCount, dailyCount] = await Promise.all([
      kv.get(totalKey),
      kv.get(toolKey),
      kv.get(hourlyKey),
      kv.get(dailyKey),
    ]);

    // Write updated counts in parallel
    await Promise.all([
      kv.put(totalKey, String((parseInt(totalCount || '0', 10) || 0) + 1)),
      kv.put(toolKey, String((parseInt(toolCount || '0', 10) || 0) + 1)),
      kv.put(hourlyKey, String((parseInt(hourlyCount || '0', 10) || 0) + 1), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
      }),
      kv.put(dailyKey, String((parseInt(dailyCount || '0', 10) || 0) + 1), {
        expirationTtl: 90 * 24 * 60 * 60, // 90 days
      }),
    ]);
  } catch (error) {
    // Log but don't throw - this is best-effort
    console.warn('Failed to log rate limit hit:', error);
  }
}

const { redisClient } = require('../../redis/client');
const { supabaseAdmin } = require('../../config/supabase');

const CACHE_TTL = 300; // 5 minutes

/**
 * Fetch client restrictions by userId with Redis caching (5-min TTL).
 * Returns null if no custom restrictions are defined.
 */
async function getClientRestrictions(userId) {
  if (!userId) return null;
  const cacheKey = `risk:restrictions:${userId}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached !== null) {
      return cached === 'null' ? null : JSON.parse(cached);
    }
  } catch (err) {
    // Redis down — fall through to database
  }

  try {
    // 1. Fetch user's profile to find their client_id
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return null;
    }

    // 2. Query client_restrictions table by user_id OR client_id
    const { data, error } = await supabaseAdmin
      .from('client_restrictions')
      .select('*')
      .or(`user_id.eq.${userId},client_id.eq.${profile.client_id}`)
      .maybeSingle();

    if (error) {
      console.warn(`[ClientRestrictions] Failed to fetch restrictions for ${userId}:`, error.message);
      return null;
    }

    // 3. Cache the result in Redis
    try {
      await redisClient.set(cacheKey, data ? JSON.stringify(data) : 'null', { EX: CACHE_TTL });
    } catch (err) {}

    return data || null;
  } catch (err) {
    console.error('[ClientRestrictions] getClientRestrictions failed:', err.message);
    return null;
  }
}

/**
 * Invalidate restrictions cache for a user
 */
async function invalidateRestrictionsCache(userId, clientId) {
  try {
    if (userId) {
      await redisClient.del(`risk:restrictions:${userId}`);
    }
    if (clientId) {
      // Find the user's UUID if client_id was provided
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('client_id', clientId)
        .single();
      if (profile) {
        await redisClient.del(`risk:restrictions:${profile.id}`);
      }
    }
  } catch (err) {
    console.warn('[ClientRestrictions] Invalidate cache failed:', err.message);
  }
}

module.exports = {
  getClientRestrictions,
  invalidateRestrictionsCache
};

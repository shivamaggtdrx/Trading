const { supabaseAdmin } = require('../../config/supabase');
const cron = require('node-cron');

/**
 * Calculate and pay out referral & affiliate trade commissions for the previous day.
 * Runs daily at 01:00 AM.
 */
async function processReferralCommissions() {
  console.log('🔄 [CRON] Starting daily referral & affiliate commission processing...');
  try {
    // 1. Fetch global config
    const { data: config } = await supabaseAdmin
      .from('referral_reward_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (!config) {
      console.error('❌ [CRON] Global referral config not found.');
      return;
    }

    if (!config.referral_program_active && !config.affiliate_program_active) {
      console.log('✅ [CRON] Both referral and affiliate programs are inactive. Skipping.');
      return;
    }

    // 2. Determine target date range (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split('T')[0];
    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    console.log(`📅 [CRON] Processing commissions for date: ${targetDate}`);

    // 3. Fetch all trades executed yesterday
    const { data: yesterdayTrades, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select('id, user_id, quantity, entry_price, charges, created_at')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (tradesError) throw tradesError;
    if (!yesterdayTrades || yesterdayTrades.length === 0) {
      console.log('✅ [CRON] No trades found for yesterday. Skipping.');
      return;
    }

    console.log(`📊 [CRON] Found ${yesterdayTrades.length} trades. Grouping by user...`);

    // Group trades by user_id
    const tradesByUser = {};
    for (const trade of yesterdayTrades) {
      if (!tradesByUser[trade.user_id]) {
        tradesByUser[trade.user_id] = [];
      }
      tradesByUser[trade.user_id].push(trade);
    }

    // Cache referral tiers to avoid repeated DB calls
    const { data: tiers } = await supabaseAdmin
      .from('referral_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    let totalReferralCommissionsPaid = 0;
    let totalAffiliateCommissionsPaid = 0;

    // 4. Process each user's trades
    for (const [userId, refereeTrades] of Object.entries(tradesByUser)) {
      // Get user's profile to find referrer or affiliate links
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, referred_by, affiliate_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error(`Error fetching profile for user ${userId}:`, profileError?.message);
        continue;
      }

      // ── PART A: USER REFERRAL COMMISSION ──
      if (profile.referred_by && config.referral_program_active) {
        const referrerId = profile.referred_by;

        // Determine referrer's tier by counting referred users
        const { count: refCount } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', referrerId);

        const activeTier = (tiers || []).find(
          t => (refCount || 0) >= t.min_referrals && (t.max_referrals == null || (refCount || 0) < t.max_referrals)
        );

        const commPct = parseFloat(activeTier?.trade_commission_pct ?? config.referral_trade_commission_pct ?? 0.5);
        
        // Calculate totals for yesterday's trades
        const totalVolume = refereeTrades.reduce((sum, t) => sum + (parseFloat(t.quantity || 0) * parseFloat(t.entry_price || 0)), 0);
        const totalCharges = refereeTrades.reduce((sum, t) => sum + parseFloat(t.charges || 0), 0);
        const commAmount = Math.round((totalCharges * commPct / 100) * 100) / 100;

        if (commAmount > 0) {
          // Check if already processed for yesterday
          const { data: existingComm } = await supabaseAdmin
            .from('referral_commissions')
            .select('id')
            .eq('referrer_id', referrerId)
            .eq('referee_id', userId)
            .eq('date', targetDate)
            .maybeSingle();

          if (!existingComm) {
            // Save commission ledger record
            const { error: insertError } = await supabaseAdmin
              .from('referral_commissions')
              .insert({
                referrer_id: referrerId,
                referee_id: userId,
                date: targetDate,
                trade_count: refereeTrades.length,
                trade_volume: totalVolume,
                amount_earned: commAmount,
                status: 'paid',
                paid_at: new Date().toISOString()
              });

            if (!insertError) {
              // Credit referrer's wallet
              const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('balance')
                .eq('user_id', referrerId)
                .single();

              if (wallet) {
                const newBalance = parseFloat(wallet.balance) + commAmount;
                await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', referrerId);
                
                // Add ledger transaction
                await supabaseAdmin.from('wallet_transactions').insert({
                  user_id: referrerId,
                  type: 'commission',
                  amount: commAmount,
                  balance_after: newBalance,
                  reference_type: 'admin_action',
                  description: `Referral trade commission for ${targetDate} (${refereeTrades.length} trades)`,
                });

                totalReferralCommissionsPaid += commAmount;
              }
            } else {
              console.error(`[CRON] Error inserting referral commission:`, insertError.message);
            }
          }
        }
      }

      // ── PART B: INFLUENCER AFFILIATE COMMISSION ──
      if (profile.affiliate_id && config.affiliate_program_active) {
        const affiliateId = profile.affiliate_id;

        const { data: aff } = await supabaseAdmin
          .from('affiliate_accounts')
          .select('id, status, trade_commission_pct, pending_balance, total_earnings')
          .eq('id', affiliateId)
          .single();

        if (aff && aff.status === 'active') {
          const commPct = parseFloat(aff.trade_commission_pct ?? config.affiliate_default_trade_pct ?? 0.5);

          for (const trade of refereeTrades) {
            // Check if already logged
            const { data: existingAffComm } = await supabaseAdmin
              .from('affiliate_commissions')
              .select('id')
              .eq('source_id', trade.id)
              .eq('commission_type', 'trade')
              .maybeSingle();

            if (!existingAffComm) {
              const commAmount = Math.round((parseFloat(trade.charges || 0) * commPct / 100) * 100) / 100;

              if (commAmount > 0) {
                const { error: insertError } = await supabaseAdmin
                  .from('affiliate_commissions')
                  .insert({
                    affiliate_id: aff.id,
                    referred_user_id: userId,
                    commission_type: 'trade',
                    source_id: trade.id,
                    source_amount: parseFloat(trade.quantity || 0) * parseFloat(trade.entry_price || 0),
                    commission_pct: commPct,
                    commission_amount: commAmount,
                    status: 'pending'
                  });

                if (!insertError) {
                  // Update affiliate pending balance
                  await supabaseAdmin.from('affiliate_accounts').update({
                    pending_balance: parseFloat(aff.pending_balance || 0) + commAmount,
                    total_earnings: parseFloat(aff.total_earnings || 0) + commAmount
                  }).eq('id', aff.id);

                  // Keep local reference updated in loop
                  aff.pending_balance = parseFloat(aff.pending_balance || 0) + commAmount;
                  aff.total_earnings = parseFloat(aff.total_earnings || 0) + commAmount;

                  totalAffiliateCommissionsPaid += commAmount;
                } else {
                  console.error(`[CRON] Error inserting affiliate commission for trade ${trade.id}:`, insertError.message);
                }
              }
            }
          }
        }
      }
    }

    console.log(`✅ [CRON] Referral & affiliate commission processing complete.`);
    console.log(`   - Total referral commission paid to wallets: ₹${totalReferralCommissionsPaid}`);
    console.log(`   - Total affiliate commission logged: ₹${totalAffiliateCommissionsPaid}`);

  } catch (err) {
    console.error('❌ [CRON] Failed to process commissions:', err);
  }
}

// Schedule to run daily at 01:00 AM
cron.schedule('0 1 * * *', () => {
  processReferralCommissions();
});

module.exports = {
  processReferralCommissions
};

const { supabaseAdmin } = require('../../config/supabase');
const cron = require('node-cron');

const COMMISSION_PER_TRADE = 10.0; // Flat ₹10 per trade

/**
 * Calculate and pay out referral commissions for the previous day.
 * Runs daily at 01:00 AM.
 */
async function processReferralCommissions() {
  console.log('🔄 [CRON] Starting daily referral commission processing...');
  try {
    // 1. Determine the date we are processing (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split('T')[0];

    // 2. Fetch all users who have a referrer
    const { data: referredUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, referred_by')
      .not('referred_by', 'is', null);

    if (usersError) throw usersError;
    if (!referredUsers || referredUsers.length === 0) {
      console.log('✅ [CRON] No referred users found. Skipping.');
      return;
    }

    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    let totalProcessed = 0;
    let totalPaid = 0;

    // 3. Process each referred user
    for (const user of referredUsers) {
      const refereeId = user.id;
      const referrerId = user.referred_by;

      // Count how many trades the referee made yesterday
      const { count: tradeCount, error: tradeError } = await supabaseAdmin
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', refereeId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (tradeError) {
        console.error(`Error fetching trades for ${refereeId}:`, tradeError.message);
        continue;
      }

      if (!tradeCount || tradeCount === 0) continue;

      const amountEarned = tradeCount * COMMISSION_PER_TRADE;

      // Ensure we haven't already paid this commission for this day
      const { data: existingComm, error: checkError } = await supabaseAdmin
        .from('referral_commissions')
        .select('id')
        .eq('referrer_id', referrerId)
        .eq('referee_id', refereeId)
        .eq('date', targetDate)
        .single();

      if (existingComm) continue; // Already processed

      // 4. Record the commission
      const { error: insertError } = await supabaseAdmin
        .from('referral_commissions')
        .insert({
          referrer_id: referrerId,
          referee_id: refereeId,
          date: targetDate,
          trade_count: tradeCount,
          amount_earned: amountEarned,
          status: 'paid',
          paid_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`Error saving commission for ${referrerId}:`, insertError.message);
        continue;
      }

      // 5. Update the referrer's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', referrerId)
        .single();

      if (!walletError && wallet) {
        const newBalance = parseFloat(wallet.balance) + amountEarned;
        
        // Add to wallet
        await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', referrerId);
        
        // Record in ledger
        await supabaseAdmin.from('wallet_transactions').insert({
          user_id: referrerId,
          type: 'commission',
          amount: amountEarned,
          balance_after: newBalance,
          reference_type: 'admin_action',
          description: `Referral commission for ${targetDate} (${tradeCount} trades)`,
        });
      }

      totalProcessed++;
      totalPaid += amountEarned;
    }

    console.log(`✅ [CRON] Referral commission processing complete.`);
    console.log(`   - Referees processed: ${totalProcessed}`);
    console.log(`   - Total commission paid: ₹${totalPaid}`);

  } catch (err) {
    console.error('❌ [CRON] Failed to process referral commissions:', err);
  }
}

// Schedule to run daily at 01:00 AM
cron.schedule('0 1 * * *', () => {
  processReferralCommissions();
});

module.exports = {
  processReferralCommissions
};

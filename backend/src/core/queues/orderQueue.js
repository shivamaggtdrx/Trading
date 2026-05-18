const { Queue, QueueEvents } = require('bullmq');
const { redisOpts, redisClient } = require('../../redis/client');
const { supabaseAdmin } = require('../../config/supabase');

// ── Order Execution Queue ──
// All trade orders flow through this queue for async, idempotent processing.
const orderQueue = new Queue('order-execution', {
  connection: redisOpts,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 500 },  // Keep last 500 completed jobs for debugging
    removeOnFail: { count: 200 },      // Keep last 200 failed jobs for investigation
  },
});

orderQueue.on('error', (err) => {
  console.error('Order Queue Error:', err.message);
});

// ── Queue Events (extended monitoring) ──
const queueEvents = new QueueEvents('order-execution', { connection: redisOpts });

/**
 * Dead-letter handler — fires after a job has exhausted all retry attempts.
 * Records the failure in audit_logs for permanent visibility.
 */
queueEvents.on('failed', async ({ jobId, failedReason, prev }) => {
  try {
    // Fetch job details to know how many attempts it had
    const job = await orderQueue.getJob(jobId);
    if (!job) return;

    const isExhausted = job.attemptsMade >= (job.opts?.attempts || 3);
    if (!isExhausted) return; // Still has retries — not dead-lettered yet

    console.error(`💀 Job [${jobId}] permanently failed after ${job.attemptsMade} attempts: ${failedReason}`);

    // Log to Supabase audit_logs so admins can see it
    await supabaseAdmin.from('audit_logs').insert({
      action: 'order_execution_failed',
      description: `BullMQ job ${jobId} permanently failed: ${failedReason?.slice(0, 200)}`,
      target_type: 'order',
      target_id: jobId,
      metadata: {
        attempts: job.attemptsMade,
        payload: job.data ? {
          symbol: job.data.symbol,
          side: job.data.side,
          quantity: job.data.quantity,
          userId: job.data.userId,
        } : null,
      },
    });

    // Cache failed job in Redis for quick admin panel lookup (TTL: 7 days)
    await redisClient.setex(
      `dlq:job:${jobId}`,
      7 * 24 * 60 * 60,
      JSON.stringify({
        jobId,
        failedReason,
        attempts: job.attemptsMade,
        data: job.data,
        failedAt: Date.now(),
      })
    );
  } catch (err) {
    console.error('Dead-letter handler error:', err.message);
  }
});

/**
 * Stall recovery — detects jobs that got stuck in "active" state.
 * BullMQ's built-in stall detection runs every 30s by default.
 * We add logging + alerting here.
 */
queueEvents.on('stalled', async ({ jobId }) => {
  console.warn(`⚠️ Job [${jobId}] stalled! It will be automatically retried.`);
  try {
    await supabaseAdmin.from('audit_logs').insert({
      action: 'order_job_stalled',
      description: `BullMQ job ${jobId} was detected as stalled and will be auto-retried`,
      target_type: 'order',
      target_id: jobId,
    });
  } catch (err) {}
});

/**
 * Add an order to the execution queue.
 * @param {string} jobName - 'execute_market_order' | 'execute_limit_order'
 * @param {object} payload - Full order context (userId, symbol, side, qty, prices, etc.)
 * @param {object} opts - Optional BullMQ job options (priority, delay, etc.)
 */
async function enqueueOrder(jobName, payload, opts = {}) {
  // Use order UUID as the jobId to enforce idempotency (exactly-once execution)
  const jobId = payload.idempotencyKey || `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  const job = await orderQueue.add(jobName, payload, {
    jobId,
    priority: opts.priority || 5, // Default priority 5 (lower = higher priority)
    ...opts,
  });

  console.log(`📥 Order queued: ${jobName} [${job.id}] for ${payload.symbol} ${payload.side} x${payload.quantity}`);
  return job;
}

module.exports = { orderQueue, queueEvents, enqueueOrder };

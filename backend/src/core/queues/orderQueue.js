const { Queue } = require('bullmq');
const { redisOpts } = require('../../redis/client');

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

module.exports = { orderQueue, enqueueOrder };

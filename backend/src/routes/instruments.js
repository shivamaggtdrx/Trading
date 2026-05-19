const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { getNormalizerStats } = require('../ws/feed/normalizer');
const { getIO } = require('../ws/socketServer');

/**
 * GET /api/instruments/debug
 * Server-side diagnostics for WebSocket connections and normalizer activity.
 */
router.get('/debug', async (req, res) => {
  try {
    let wsClients = 0;
    let wsRooms = [];
    try {
      const io = getIO();
      wsClients = io.of('/market').sockets.size;
      for (const [roomName, clients] of io.of('/market').adapter.rooms.entries()) {
        if (roomName.startsWith('feed:')) {
          wsRooms.push({ room: roomName, clients: clients.size });
        }
      }
    } catch (e) {
      wsClients = `Error: ${e.message}`;
    }

    res.json({
      normalizerStats: getNormalizerStats(),
      wsClients,
      wsRooms,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasClientCode: !!process.env.ANGEL_ONE_CLIENT_CODE,
        clientCode: process.env.ANGEL_ONE_CLIENT_CODE,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/instruments
 * Get all active instruments (public — no auth needed)
 */
router.get('/', async (req, res) => {
  try {
    const segment = req.query.segment; // optional filter
    let query = supabaseAdmin
      .from('instruments')
      .select('*')
      .eq('is_active', true)
      .order('symbol');

    if (segment) query = query.eq('segment', segment);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json({ instruments: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

/**
 * GET /api/instruments/:symbol
 * Get single instrument by symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('instruments')
      .select('*')
      .eq('symbol', req.params.symbol.toUpperCase())
      .single();

    if (error || !data) return res.status(404).json({ error: 'Instrument not found' });
    res.json({ instrument: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instrument' });
  }
});

module.exports = router;

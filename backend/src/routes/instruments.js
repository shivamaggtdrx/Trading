const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');
const { getNormalizerStats } = require('../ws/feed/normalizer');
const { getIO } = require('../ws/socketServer');

const { authenticateUser } = require('../middleware/auth');

/**
 * GET /api/instruments/debug
 * Server-side diagnostics for WebSocket connections and normalizer activity.
 */
router.get('/debug', authenticateUser, async (req, res) => {
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
        hasFinnhubKey: !!process.env.FINNHUB_API_KEY,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const segment = req.query.segment; // optional filter
    const cache = require('../core/cache');
    const cacheKey = 'instruments:active';
    let data = cache.get(cacheKey);

    if (!data) {
      const { fetchAllActiveInstruments } = require('../config/supabase');
      data = await fetchAllActiveInstruments('*');
      cache.set(cacheKey, data, 300000); // 5 minutes TTL
    }

    // Clone the cached array before mutating (filtering/sorting)
    let result = [...data];

    if (segment) {
      result = result.filter(i => i.segment === segment);
    }

    // Sort by symbol
    result.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({ instruments: result || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instruments: ' + err.message });
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

/**
 * GET /api/instruments/:symbol/candles
 * Get historical candles from ohlc_1m
 */
router.get('/:symbol/candles', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const limit = parseInt(req.query.limit) || 100;
    
    // We fetch the latest candles and order by timestamp descending
    const { data, error } = await supabaseAdmin
      .from('ohlc_1m')
      .select('timestamp, open, high, low, close, volume')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: error.message });
    
    // Sort ascending for charts
    const candles = (data || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json({ symbol, candles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch historical candles' });
  }
});

module.exports = router;

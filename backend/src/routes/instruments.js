const router = require('express').Router();
const { supabaseAdmin } = require('../config/supabase');

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

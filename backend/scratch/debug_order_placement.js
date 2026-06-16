require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');
const ordersRouter = require('../src/routes/orders');
const cache = require('../src/core/cache');

async function test() {
  console.log('Clearing cache...');
  cache.clear();

  // Fetch user profile from DB to build req.user
  const userId = '27202099-20fd-4991-b8d0-60ec3c209c98';
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const req = {
    method: 'POST',
    url: '/',
    body: {
      symbol: 'TATAMOTORS',
      side: 'buy',
      order_type: 'market',
      quantity: 1
    },
    user: {
      id: userId,
      email: profile.email,
      profile
    },
    ip: '127.0.0.1'
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      console.log(`Response [${this.statusCode}]:`, obj);
      return this;
    }
  };

  // Find the POST '/' handler in orders router
  const layer = ordersRouter.stack.find(l => l.route && l.route.path === '/' && l.route.methods.post);
  const routeHandlers = layer.route.stack;
  const mainHandler = routeHandlers[routeHandlers.length - 1].handle;

  console.log('Running route handler...');
  try {
    await mainHandler(req, res, () => {});
  } catch (err) {
    console.error('Handler threw error:', err);
  }

  process.exit(0);
}

test();

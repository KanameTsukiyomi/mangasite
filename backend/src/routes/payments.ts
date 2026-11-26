import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../services/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

// ── GET /api/coins/packages — paquetes disponibles ───────────────
router.get('/packages', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('coin_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ packages: data ?? [] });
});

// ── POST /api/coins/checkout/stripe ──────────────────────────────
router.post('/checkout/stripe', authenticate, async (req: AuthRequest, res: Response) => {
  const { package_id } = req.body;

  const { data: pkg } = await supabaseAdmin
    .from('coin_packages').select('*').eq('id', package_id).eq('is_active', true).single();

  if (!pkg) { res.status(404).json({ error: 'Paquete no encontrado' }); return; }

  const totalCoins = pkg.coins_amount + pkg.bonus_coins;

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode:                 'payment',
    line_items: [{
      price_data: {
        currency:     'usd',
        product_data: {
          name: `${pkg.name} — ${totalCoins} Monedas`,
          description: pkg.bonus_coins > 0
            ? `${pkg.coins_amount} monedas + ${pkg.bonus_coins} bonus`
            : `${pkg.coins_amount} monedas`,
        },
        unit_amount: Math.round(Number(pkg.price_usd) * 100),
      },
      quantity: 1,
    }],
    metadata: {
      user_id:    req.user!.id,
      package_id: pkg.id,
      coins:      String(totalCoins),
    },
    success_url: `${process.env.FRONTEND_URL}/coins?success=stripe`,
    cancel_url:  `${process.env.FRONTEND_URL}/coins?cancelled=true`,
  });

  res.json({ url: session.url, session_id: session.id });
});

// ── POST /api/coins/checkout/paypal ──────────────────────────────
router.post('/checkout/paypal', authenticate, async (req: AuthRequest, res: Response) => {
  const { package_id } = req.body;

  const { data: pkg } = await supabaseAdmin
    .from('coin_packages').select('*').eq('id', package_id).eq('is_active', true).single();

  if (!pkg) { res.status(404).json({ error: 'Paquete no encontrado' }); return; }

  const base = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // Token de acceso
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json() as { access_token: string };

  const totalCoins = pkg.coins_amount + pkg.bonus_coins;

  // Crear orden
  const orderRes = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: Number(pkg.price_usd).toFixed(2) },
        description: `${pkg.name} — ${totalCoins} Monedas`,
        custom_id: JSON.stringify({
          user_id: req.user!.id,
          package_id: pkg.id,
          coins: totalCoins,
        }),
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/coins?success=paypal`,
        cancel_url: `${process.env.FRONTEND_URL}/coins?cancelled=true`,
      },
    }),
  });
  const order = await orderRes.json() as any;
  const approveUrl = (order.links as any[])?.find(l => l.rel === 'approve')?.href;

  res.json({ url: approveUrl, order_id: order.id });
});

// ── POST /api/coins/checkout/paypal/capture ──────────────────────
router.post('/checkout/paypal/capture', authenticate, async (req: AuthRequest, res: Response) => {
  const { order_id } = req.body;

  const base = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json() as { access_token: string };

  const captureRes = await fetch(`${base}/v2/checkout/orders/${order_id}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
  });
  const capture = await captureRes.json() as any;

  if (capture.status === 'COMPLETED') {
    const rawCustomId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ?? '{}';
    const { user_id, coins } = JSON.parse(rawCustomId);
    await creditCoins(user_id, coins, 'paypal', order_id);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'El pago no fue completado por PayPal' });
  }
});

// ── POST /api/coins/checkout/binance — Binance Pay ───────────────
router.post('/checkout/binance', authenticate, async (req: AuthRequest, res: Response) => {
  const { package_id } = req.body;

  const { data: pkg } = await supabaseAdmin
    .from('coin_packages').select('*').eq('id', package_id).eq('is_active', true).single();

  if (!pkg) { res.status(404).json({ error: 'Paquete no encontrado' }); return; }

  const crypto      = await import('crypto');
  const nonce       = Date.now().toString();
  const timestamp   = Date.now();
  const totalCoins  = pkg.coins_amount + pkg.bonus_coins;
  const tradeNo     = `${timestamp}_${req.user!.id.slice(0, 8)}`;

  const bodyStr = JSON.stringify({
    env:             { terminalType: 'WEB' },
    merchantTradeNo: tradeNo,
    orderAmount:     Number(pkg.price_usd).toFixed(2),
    currency:        'USDT',
    goods: {
      goodsType:        '02',
      goodsCategory:    'Z000',
      referenceGoodsId: pkg.id,
      goodsName:        `${pkg.name} — ${totalCoins} Monedas`,
    },
    returnUrl:  `${process.env.FRONTEND_URL}/coins?success=binance`,
    cancelUrl:  `${process.env.FRONTEND_URL}/coins?cancelled=true`,
    webhookUrl: `${process.env.BACKEND_URL}/api/webhooks/binance`,
  });

  const payload = `${timestamp}\n${nonce}\n${bodyStr}\n`;
  const signature = crypto.createHmac('sha512', process.env.BINANCE_SECRET_KEY!)
    .update(payload).digest('hex').toUpperCase();

  const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v3/order', {
    method:  'POST',
    headers: {
      'Content-Type':             'application/json',
      'BinancePay-Timestamp':     String(timestamp),
      'BinancePay-Nonce':         nonce,
      'BinancePay-Certificate-SN': process.env.BINANCE_API_KEY!,
      'BinancePay-Signature':     signature,
    },
    body: bodyStr,
  });
  const data = await response.json() as any;

  if (data.status === 'SUCCESS') {
    res.json({ url: data.data?.checkoutUrl });
  } else {
    res.status(400).json({ error: 'Error al crear orden en Binance Pay', detail: data.errorMessage });
  }
});

// ── WEBHOOKS ─────────────────────────────────────────────────────

// Stripe webhook (body raw, ver index.ts)
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    res.status(400).json({ error: 'Firma de webhook inválida' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession;
    const { user_id, coins } = session.metadata!;
    await creditCoins(user_id, parseInt(coins), 'stripe', session.id);
  }

  res.json({ received: true });
});

// Binance webhook
router.post('/binance', async (req: Request, res: Response) => {
  const { bizType, bizStatus, bizId, data } = req.body;

  if (bizType === 'PAY' && bizStatus === 'PAY_SUCCESS') {
    try {
      const parsed   = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
      const { user_id, coins } = parsed?.customData ?? {};
      if (user_id && coins) await creditCoins(user_id, coins, 'binance', bizId);
    } catch { /* log opcional */ }
  }

  res.json({ returnCode: 'SUCCESS', returnMessage: null });
});

// ── Función auxiliar: acreditar monedas (idempotente) ────────────
async function creditCoins(
  userId: string,
  coins: number,
  provider: string,
  reference: string
): Promise<void> {
  // Idempotencia: evitar procesar el mismo pago dos veces
  const { data: existing } = await supabaseAdmin
    .from('coin_transactions')
    .select('id')
    .eq('payment_reference', reference)
    .eq('status', 'completed')
    .single();

  if (existing) return;

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('coins_balance').eq('id', userId).single();

  if (!profile) return;

  const newBalance = profile.coins_balance + coins;

  await Promise.all([
    supabaseAdmin.from('profiles').update({ coins_balance: newBalance }).eq('id', userId),
    supabaseAdmin.from('coin_transactions').insert({
      user_id:           userId,
      type:              'purchase',
      amount:            coins,
      balance_after:     newBalance,
      description:       `Recarga vía ${provider}`,
      payment_provider:  provider,
      payment_reference: reference,
      status:            'completed',
    }),
  ]);
}

export default router;

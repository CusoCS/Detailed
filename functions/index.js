// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const express = require('express');
const fetch = require('node-fetch').default;
const admin = require('firebase-admin');

// Initialize the default Firebase app
admin.initializeApp();

// ——— Secrets ———
// Define your Google Maps key and Stripe secret as Firebase Function params:
const GOOGLE_KEY = defineSecret('GOOGLE_KEY');
const STRIPE_SECRET = defineSecret('STRIPE_SECRET');

// ——— 1) Distance Matrix HTTP function ———
const mapsApp = express();
mapsApp.use(express.json());

mapsApp.post('/', async (req, res) => {
  const { origin, dest } = req.body;
  if (
    !origin ||
    !dest ||
    typeof origin.lat !== 'number' ||
    typeof origin.lng !== 'number' ||
    typeof dest.lat !== 'number' ||
    typeof dest.lng !== 'number'
  ) {
    return res.status(400).json({ error: 'Must supply { origin: {lat,lng}, dest: {lat,lng} }' });
  }

  const key = process.env.GOOGLE_KEY;
  const url =
    'https://maps.googleapis.com/maps/api/distancematrix/json' +
    `?units=metric` +
    `&origins=${origin.lat},${origin.lng}` +
    `&destinations=${dest.lat},${dest.lng}` +
    `&mode=driving` +
    `&key=${key}`;

  try {
    const gRes = await fetch(url);
    const data = await gRes.json();
    if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
      return res.status(502).json({ error: 'Google DM error', details: data });
    }

    const el = data.rows[0].elements[0];
    if (el.status !== 'OK') {
      return res.status(502).json({ error: 'No route', details: el.status });
    }

    return res.json({
      distanceKm: el.distance.value / 1000,
      durationMins: el.duration.value / 60
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.toString() });
  }
});

exports.getDistanceMatrix = onRequest(
  { secrets: [GOOGLE_KEY] },
  mapsApp
);

// ——— 2) Stripe PaymentIntent HTTP function ———
const stripeApp = express();
stripeApp.use(express.json());

// Lazily initialize Stripe with the secret key at runtime
let stripe;
stripeApp.use((req, res, next) => {
  if (!stripe) {
    const secret = process.env.STRIPE_SECRET;
    stripe = require('stripe')(secret);
  }
  next();
});

/**
 * POST /createPaymentIntent
 * Body: { amount: number (in cents), currency?: string, metadata?: object }
 * Returns: { clientSecret }
 */
stripeApp.post('/', async (req, res) => {
  const { amount, currency = 'usd', metadata = {} } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata
    });
    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
});

exports.createPaymentIntent = onRequest(
  { secrets: [STRIPE_SECRET] },
  stripeApp
);

// ——— 3) Firestore trigger: free up slots on booking deletion ———
exports.onBookingDeleted = onDocumentDeleted(
  'bookings/{bookingId}',
  async (event) => {
    const booking = event.data;
    const slotId = booking.slotId;
    if (!slotId) return;

    const slotRef = admin.firestore().doc(`slots/${slotId}`);
    try {
      await slotRef.update({
        booked: false,
        bookedBy: admin.firestore.FieldValue.delete(),
        bookedAt: admin.firestore.FieldValue.delete(),
      });
    } catch (err) {
      console.error('Failed to free slot', slotId, err);
    }
  }
);
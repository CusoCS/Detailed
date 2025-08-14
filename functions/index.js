// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
// MODIFIED: Imported more Firestore trigger types
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const express = require("express");
const fetch = require("node-fetch").default;
const admin = require("firebase-admin");

// Initialize Firebase
admin.initializeApp();
const db = admin.firestore();

// ——— Secrets ———
const GOOGLE_KEY = defineSecret("GOOGLE_KEY");
const STRIPE_SECRET = defineSecret("STRIPE_SECRET");

// Helper to lazily initialize Stripe
let stripe;
function getStripe() {
  if (!stripe) {
    stripe = require("stripe")(process.env.STRIPE_SECRET);
  }
  return stripe;
}

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

// ——— 2a) Detailer onboarding HTTP function ———
const onboardApp = express();
onboardApp.use(express.json());

onboardApp.post('/', async (req, res) => {
  const { detailerId, email, country = 'IE' } = req.body;
  if (!detailerId || !email) {
    return res.status(400).json({ error: 'Missing detailerId or email' });
  }

  try {
    const stripeClient = getStripe();
    // 1) Create a Connect Account for the detailer
    const account = await stripeClient.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
    });

    // 2) Save the account ID to Firestore
    await admin.firestore()
      .doc(`detailers/${detailerId}`)
      .set({ stripeAccountId: account.id }, { merge: true });

    // 3) Create an account link for onboarding
    const link = await stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: 'https://autobook-8085d.web.app/onboard/refresh',
      return_url: 'https://autobook-8085d.web.app/onboard/complete',
      type: 'account_onboarding',
    });

    return res.json({ url: link.url });
  } catch (err) {
    console.error('Onboarding error:', err);
    return res.status(500).json({ error: err.message });
  }
});

exports.onboardDetailer = onRequest(
  { secrets: [STRIPE_SECRET] },
  onboardApp
);

// ——— 2b) Stripe PaymentIntent HTTP function ———
const stripeApp = express();
stripeApp.use(express.json());

stripeApp.use((req, res, next) => {
  // Ensure stripe is initialized
  getStripe();
  next();
});

stripeApp.post('/', async (req, res) => {
  const { amount, currency = 'eur', metadata = {} } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // Look up detailer's connected account ID from metadata
    const detailerId = metadata.detailerId;
    const detailerSnap = await admin.firestore().doc(`detailers/${detailerId}`).get();
    const stripeAccountId = detailerSnap.get('stripeAccountId');
    if (!stripeAccountId) {
      return res.status(400).json({ error: 'Detailer not onboarded with Stripe' });
    }

    // Create a PaymentIntent that routes funds to the detailer
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      on_behalf_of: stripeAccountId,
      transfer_data: {
        destination: stripeAccountId,
      },
      application_fee_amount: Math.round(amount * 0.025), // optional 2.5% fee
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
    // MODIFIED: Access data correctly in v2 functions
    const booking = event.data.data();
    const slotId = booking.slotId;
    if (!slotId) return;

    const slotRef = admin.firestore().doc(`slots/${slotId}`);
    try {
      await slotRef.update({
        booked: false,
        bookedBy: admin.firestore.FieldValue.delete(),
        bookedAt: admin.firestore.FieldValue.delete(),
      });
      console.log(`Successfully freed slot ${slotId}.`);
    } catch (err) {
      console.error('Failed to free slot', slotId, err);
    }
  }
);


// ======================================================================
// =================== NEW: NOTIFICATION FUNCTIONS ======================
// ======================================================================

/**
 * A helper function to send push notifications via Expo's API.
 * @param {string} pushToken The recipient's Expo Push Token.
 * @param {string} title The title of the notification.
 * @param {string} body The body text of the notification.
 */
async function sendPushNotification(pushToken, title, body) {
  if (!pushToken) {
    console.log("Cannot send notification, no push token available.");
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title: title,
    body: body,
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    console.log("Successfully sent push notification.");
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

// 4a) Notify detailer when a new booking is created
exports.notifyOnNewBooking = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const booking = event.data.data();
  const detailerId = booking.detailerId;

  const userDoc = await db.collection("users").doc(detailerId).get();
  if (!userDoc.exists) {
    console.error(`Detailer user document not found for ID: ${detailerId}`);
    return;
  }
  const pushToken = userDoc.data().pushToken;

  await sendPushNotification(
    pushToken,
    "New Booking Request!",
    `You have a new booking for ${booking.service}.`
  );
});

// 4b) Notify customer on booking status update (e.g., confirmed)
exports.notifyOnBookingUpdate = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Check if the status changed specifically to 'confirmed'
  if (before.status !== "confirmed" && after.status === "confirmed") {
    const userId = after.customerId; // Assuming the customer's ID is stored as customerId

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.error(`Customer user document not found for ID: ${userId}`);
      return;
    }
    const pushToken = userDoc.data().pushToken;

    await sendPushNotification(
      pushToken,
      "Booking Confirmed!",
      `Your booking for ${after.service} has been confirmed.`
    );
  }
});

// 4c) Notify customer when a booking is deleted (cancelled)
exports.notifyOnBookingDelete = onDocumentDeleted("bookings/{bookingId}", async (event) => {
  const booking = event.data.data();
  const userId = booking.customerId; // Assuming the customer's ID is stored as customerId

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    console.error(`Customer user document not found for ID: ${userId}`);
    return;
  }
  const pushToken = userDoc.data().pushToken;

  await sendPushNotification(
    pushToken,
    "Booking Cancelled",
    `Your booking for ${booking.service} has been cancelled by the detailer.`
  );
});
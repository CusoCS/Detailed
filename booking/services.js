// booking/services.js
import { db } from '../firebaseConfig'; // adjust path if needed
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

/* =========================
   SERVICES COLLECTION
   ========================= */

export async function addService(detailerUid, serviceName, price) {
  const docRef = await addDoc(collection(db, 'services'), {
    detailerId: detailerUid,
    serviceName,
    price,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function getServices(detailerUid) {
  const q = query(
    collection(db, 'services'),
    where('detailerId', '==', detailerUid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateService(serviceId, updateFields) {
  await updateDoc(doc(db, 'services', serviceId), updateFields);
}

export async function deleteService(serviceId) {
  await deleteDoc(doc(db, 'services', serviceId));
}

/* =========================
   BOOKINGS COLLECTION
   ========================= */

export async function addBooking(
  customerId,
  detailerId,
  service,
  bookingTime,
  status = 'pending'
) {
  const docRef = await addDoc(collection(db, 'bookings'), {
    customerId,
    detailerId,
    service,
    bookingTime,
    status,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBookingsForDetailer(detailerId) {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'bookings'),
    where('detailerId', '==', detailerId),
    where('bookingTime', '>=', now),
    orderBy('bookingTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPastBookingsForDetailer(detailerId) {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'bookings'),
    where('detailerId', '==', detailerId),
    where('bookingTime', '<', now),
    orderBy('bookingTime', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBookingsForCustomer(customerId) {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'bookings'),
    where('customerId', '==', customerId),
    where('bookingTime', '>=', now),
    orderBy('bookingTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPastBookingsForCustomer(customerId) {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'bookings'),
    where('customerId', '==', customerId),
    where('bookingTime', '<', now),
    orderBy('bookingTime', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateBooking(bookingId, updateFields) {
  await updateDoc(doc(db, 'bookings', bookingId), updateFields);
}

export async function deleteBooking(bookingId) {
  // simply delete the booking; slot freeing is now handled
  await deleteDoc(doc(db, 'bookings', bookingId));
}

/* =================================
   AVAILABILITY SLOTS COLLECTION
   =================================
   Each slot document lives in 'slots' and has:
     - detailerId, startTime, endTime, booked (bool), bookedBy?
*/

export async function addHourSlot(detailerId, startTime, endTime) {
  const docRef = await addDoc(collection(db, 'slots'), {
    detailerId,
    startTime,      // JS Date or timestamp
    endTime,        // JS Date or timestamp
    booked: false,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getHourSlots(detailerId) {
  const q = query(collection(db, 'slots'), where('detailerId', '==', detailerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateHourSlot(slotId, updateFields) {
  await updateDoc(doc(db, 'slots', slotId), updateFields);
}

export async function deleteHourSlot(slotId) {
  await deleteDoc(doc(db, 'slots', slotId));
}

/**
 * bookSlot
 * 1) marks the slot as booked by customerId
 * 2) creates a booking record using slot.startTime
 */
export async function bookSlot(
  customerId,
  detailerId,
  slotId,
  serviceName
) {
  const slotRef = doc(db, 'slots', slotId);
  const slotSnap = await getDoc(slotRef);
  if (!slotSnap.exists()) {
    throw new Error(`Slot ${slotId} not found`);
  }
  const slot = slotSnap.data();
  if (slot.booked) {
    throw new Error('Slot already booked');
  }

  // mark slot as booked
  await updateDoc(slotRef, {
    booked: true,
    bookedBy: customerId,
    bookedAt: Timestamp.now(),
  });

  // create booking record
  return addDoc(collection(db, 'bookings'), {
    customerId,
    detailerId,
    service: serviceName,
    bookingTime: slot.startTime,
    status: 'pending',
    // retain slotId so CF can free it on delete
    slotId,
    createdAt: Timestamp.now(),
  });
}

// ——— STRIPE ONBOARDING ———
export async function onboardDetailer(detailerId) {
  const userDoc = await getDoc(doc(db, 'users', detailerId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const email = userDoc.data().email;

  const response = await fetch('https://us-central1-autobook-8085d.cloudfunctions.net/onboardDetailer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ detailerId, email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Onboarding failed');
  }

  return data.url; // Stripe onboarding link
}

/* =========================
   PUSH NOTIFICATIONS
   ========================= */

// Configure notification behavior when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask for permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Exit if permission is not granted
  if (finalStatus !== 'granted') {
    console.log('Permission to receive push notifications was denied.');
    return;
  }

  try {
    // Get the Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    if (pushToken && userId) {
      // Save the push token to the user's document in Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { pushToken: pushToken });
      console.log('Push token saved successfully for user:', userId);
    }
    
    return pushToken;

  } catch (error) {
    console.error('Error getting or saving push token:', error);
  }
}
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
} from 'firebase/firestore';

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
  const q = query(collection(db, 'services'), where('detailerId', '==', detailerUid));
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

export async function addBooking(customerId, detailerId, service, bookingTime, status = 'pending') {
  const docRef = await addDoc(collection(db, 'bookings'), {
    customerId,
    detailerId,
    service,
    bookingTime,
    status,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function getBookingsForDetailer(detailerId) {
  const q = query(collection(db, 'bookings'), where('detailerId', '==', detailerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBookingsForCustomer(customerId) {
  const q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateBooking(bookingId, updateFields) {
  await updateDoc(doc(db, 'bookings', bookingId), updateFields);
}

export async function deleteBooking(bookingId) {
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
    createdAt: new Date(),
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
 *  1) marks the slot as booked by customerId
 *  2) creates a booking record using slot.startTime
 */
export async function bookSlot(customerId, detailerId, slotId, serviceName) {
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
    bookedAt: new Date(),
  });
  // create booking record
  return addBooking(customerId, detailerId, serviceName, slot.startTime);
}
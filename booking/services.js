// booking/services.js
import { db } from '../firebaseConfig'; // Adjust the import path as needed
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

/* =========================
   SERVICES COLLECTION
   ========================= */

/**
 * Creates a new service in the 'services' collection.
 * @param {string} detailerUid - UID of the detailer
 * @param {string} serviceName - Name of the service
 * @param {number} price - Price of the service
 * @returns {Promise<string>} - Document ID of the newly created service
 */
export async function addService(detailerUid, serviceName, price) {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      detailerId: detailerUid,
      serviceName,
      price,
      createdAt: new Date(),
    });
    console.log('Service added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
}

/**
 * Fetches all services for a specific detailer from the 'services' collection.
 * @param {string} detailerUid
 * @returns {Promise<Array>} List of services
 */
export async function getServices(detailerUid) {
  try {
    const q = query(collection(db, 'services'), where('detailerId', '==', detailerUid));
    const querySnapshot = await getDocs(q);
    const services = [];
    querySnapshot.forEach((docSnap) => {
      services.push({ id: docSnap.id, ...docSnap.data() });
    });
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

/**
 * Updates an existing service.
 * @param {string} serviceId - Document ID of the service to update
 * @param {object} updateFields - Fields to update
 */
export async function updateService(serviceId, updateFields) {
  try {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, updateFields);
    console.log('Service updated:', serviceId);
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
}

/**
 * Deletes a service.
 * @param {string} serviceId - Document ID of the service to delete
 */
export async function deleteService(serviceId) {
  try {
    const docRef = doc(db, 'services', serviceId);
    await deleteDoc(docRef);
    console.log('Service deleted:', serviceId);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}


/* =========================
   BOOKINGS COLLECTION
   ========================= */

/**
 * Creates a new booking in the 'bookings' collection.
 * @param {string} customerId - UID of the customer
 * @param {string} detailerId - UID of the detailer
 * @param {string} service - The booked service name or ID
 * @param {Date|string} bookingTime - The scheduled booking time (can be a JS Date or formatted string)
 * @param {string} [status='pending'] - Booking status (e.g., 'pending', 'confirmed')
 * @returns {Promise<string>} - Document ID of the booking
 */
export async function addBooking(customerId, detailerId, service, bookingTime, status = 'pending') {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      customerId,
      detailerId,
      service,
      bookingTime,
      status,
      createdAt: new Date(),
    });
    console.log('Booking added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
}

/**
 * Fetches all bookings for a specific detailer.
 * @param {string} detailerId - UID of the detailer
 * @returns {Promise<Array>} Array of booking objects
 */
export async function getBookingsForDetailer(detailerId) {
  try {
    const q = query(collection(db, 'bookings'), where('detailerId', '==', detailerId));
    const querySnapshot = await getDocs(q);
    const bookings = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push({ id: docSnap.id, ...docSnap.data() });
    });
    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

/**
 * Updates an existing booking.
 * @param {string} bookingId - Document ID of the booking to update
 * @param {object} updateFields - Fields to update
 */
export async function updateBooking(bookingId, updateFields) {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await updateDoc(docRef, updateFields);
    console.log('Booking updated:', bookingId);
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

/**
 * Deletes a booking.
 * @param {string} bookingId - Document ID of the booking to delete
 */
export async function deleteBooking(bookingId) {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
    console.log('Booking deleted:', bookingId);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
}
// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOYcDnJQ3CbO-ubRs-6Lv9rXWaFm-EUO8",
  authDomain: "autobook-8085d.firebaseapp.com",
  projectId: "autobook-8085d",
  storageBucket: "autobook-8085d.firebasestorage.app",
  messagingSenderId: "636243637975",
  appId: "1:636243637975:web:7922725762961b897b2292",
  measurementId: "G-59Z7W5D1ZJ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
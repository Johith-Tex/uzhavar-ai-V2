// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ✅ Reads from .env — make sure your .env has these VITE_ variables
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signInAnon = () => signInAnonymously(auth);
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

// ── Chat History ──────────────────────────────────────────────────────────────
export const saveChatMessage = async (userId, message) => {
  try {
    return await addDoc(collection(db, 'chats', userId, 'messages'), {
      ...message,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firebase save failed (offline mode):', err.message);
    return null;
  }
};

export const getChatHistory = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'chats', userId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
  } catch (err) {
    console.warn('Firebase fetch failed (offline mode):', err.message);
    return [];
  }
};

// ── Weather Cache ─────────────────────────────────────────────────────────────
export const saveWeatherData = async (location, data) => {
  try {
    return await addDoc(collection(db, 'weather_cache'), {
      location, data, cachedAt: serverTimestamp()
    });
  } catch (err) { return null; }
};

// ── User Feedback ─────────────────────────────────────────────────────────────
export const saveFeedback = async (userId, messageId, rating) => {
  try {
    return await addDoc(collection(db, 'feedback'), {
      userId, messageId, rating, timestamp: serverTimestamp()
    });
  } catch (err) { return null; }
};

// ── Session Analytics ─────────────────────────────────────────────────────────
export const logSession = async (userId, data) => {
  try {
    return await addDoc(collection(db, 'sessions'), {
      userId, ...data, timestamp: serverTimestamp()
    });
  } catch (err) { return null; }
};

// ── Disease Scan History ──────────────────────────────────────────────────────
// Save a disease scan result (stores compressed thumbnail + diagnosis text)
export const saveDiagnosisResult = async (userId, scan) => {
  try {
    return await addDoc(collection(db, 'disease_scans', userId, 'scans'), {
      imageBase64: scan.imageBase64,
      diagnosis:   scan.diagnosis,
      cropHint:    scan.cropHint || '',
      language:    scan.language || 'ta',
      scannedAt:   serverTimestamp(),
    });
  } catch (err) {
    console.warn('Disease scan save failed:', err.message);
    return null;
  }
};

// Fetch last N disease scans for a user
export const getDiagnosisHistory = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'disease_scans', userId, 'scans'),
      orderBy('scannedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Disease history fetch failed:', err.message);
    return [];
  }
};

// Delete a single scan from history
export const deleteDiagnosisScan = async (userId, scanId) => {
  try {
    const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
    await deleteDoc(firestoreDoc(db, 'disease_scans', userId, 'scans', scanId));
    return true;
  } catch (err) {
    console.warn('Delete scan failed:', err.message);
    return false;
  }
};

// ── Image compression helper ──────────────────────────────────────────────────
export const compressImageForStorage = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 150;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.55).split(',')[1]);
    };
    img.onerror = () => resolve('');
    img.src = `data:image/jpeg;base64,${base64}`;
  });
};

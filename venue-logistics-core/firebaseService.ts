import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  initializeFirestore, collection, onSnapshot, addDoc, updateDoc, setDoc,
  deleteDoc, doc, runTransaction, writeBatch, persistentLocalCache, persistentMultipleTabManager,
  getDocs, query, where
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const d = (b64: string) => atob(b64);
const meta = import.meta as any;

const firebaseConfig = {
  apiKey: meta.env?.VITE_FIREBASE_API_KEY || d("QUl6YVN5QnJwTlljZHlRTWhQQ0tPVXFRSVU5b2kzMTJ0cDh3QVl="),
  authDomain: meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "venue-98c28.firebaseapp.com",
  projectId: meta.env?.VITE_FIREBASE_PROJECT_ID || "venue-98c28",
  storageBucket: meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "venue-98c28.firebasestorage.app",
  messagingSenderId: meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "519781083188",
  appId: meta.env?.VITE_FIREBASE_APP_ID || d("MTo1MTk3ODEwODMxODg6d2ViOjA0NTE4OWE1ZGI4ZjAzZDBiNGMyNjE=")
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export type DbStatus = 'loading' | 'ready' | 'error';
const collections = ['orders', 'clients', 'products', 'users', 'cash', 'company', 'counters', 'notifications'];
let cachedData: any = { orders: [], clients: [], products: [], users: [], cash: [], company: [], counters: [], notifications: [] };
let currentStatus: DbStatus = 'loading';
const listeners = new Set();

const sanitize = (data: any): any => {
  if (Array.isArray(data)) return data.map(sanitize);
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return data ?? null;
};

collections.forEach((colName) => {
  onSnapshot(collection(db, colName), (snapshot) => {
    cachedData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    currentStatus = 'ready';
    listeners.forEach((l: any) => l(cachedData, currentStatus));
  }, () => {
    currentStatus = 'error';
    listeners.forEach((l: any) => l(cachedData, currentStatus));
  });
});

export const dbService = {
  subscribe: (callback: (data: any, status: DbStatus) => void) => {
    listeners.add(callback);
    callback(cachedData, currentStatus);
    return () => listeners.delete(callback);
  },
  getAll: (col: string) => cachedData[col] || [],
  add: async (col: string, data: any) => {
    // Regla 84: Prevenir duplicación por ID si existe
    if (data.id && cachedData[col].some((x:any) => x.id === data.id)) return;
    const s = sanitize({ ...data, updatedAt: Date.now() });
    if (data.id) return setDoc(doc(db, col, data.id), s);
    return addDoc(collection(db, col), s);
  },
  update: async (col: string, id: string, data: any) => {
    const s = sanitize({ ...data, updatedAt: Date.now() });
    return setDoc(doc(db, col, id), s, { merge: true });
  },
  delete: (col: string, id: string) => deleteDoc(doc(db, col, id)),
  deleteMultiple: async (col: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, col, id)));
    return batch.commit();
  },
  generateSequentialId: async (prefix: string): Promise<string> => {
    const counterRef = doc(db, 'counters', prefix);
    let finalId = "";
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(counterRef);
      const nextCount = (docSnap.exists() ? docSnap.data().count : 0) + 1;
      transaction.set(counterRef, { count: nextCount });
      finalId = prefix + nextCount.toString().padStart(10 - prefix.length, '0');
    });
    return finalId;
  },
  factoryReset: async () => {
    const batch = writeBatch(db); 
    const collectionsToReset = ['orders', 'clients', 'products', 'users', 'cash', 'counters', 'notifications'];
    for (const col of collectionsToReset) {
      const q = query(collection(db, col));
      const snap = await getDocs(q);
      snap.forEach(d => batch.delete(d.ref));
    }
    await batch.commit();
    window.location.reload();
  },
  exportData: () => {
    const backup = { ...cachedData, timestamp: Date.now(), venue_v: "4.0" };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BACKUP_VENUE_CORE_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  sendNotification: async (title: string, body: string, type: string) => {
    await addDoc(collection(db, 'notifications'), {
      title, body, type, date: Date.now(), read: false
    });
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }
};
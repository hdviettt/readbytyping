const DB_NAME = "booktyper";
const DB_VERSION = 1;
const STORES = ["books", "progress", "sessions", "keystrokeStats"] as const;
type StoreName = (typeof STORES)[number];

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(
  store: StoreName,
  mode: IDBTransactionMode
): Promise<IDBObjectStore> {
  const db = await open();
  return db.transaction(store, mode).objectStore(store);
}

export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const os = await tx(store, "readonly");
  return new Promise((resolve, reject) => {
    const req = os.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(store: StoreName, key: string, value: unknown): Promise<void> {
  const os = await tx(store, "readwrite");
  return new Promise((resolve, reject) => {
    const req = os.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const os = await tx(store, "readwrite");
  return new Promise((resolve, reject) => {
    const req = os.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const os = await tx(store, "readonly");
  return new Promise((resolve, reject) => {
    const req = os.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

const MIGRATED_KEY = "booktyper_idb_migrated";

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const mapping: { lsKey: string; store: StoreName; idbKey: string }[] = [
      { lsKey: "booktyper_books", store: "books", idbKey: "all" },
      { lsKey: "booktyper_progress", store: "progress", idbKey: "all" },
      { lsKey: "booktyper_sessions", store: "sessions", idbKey: "all" },
      { lsKey: "booktyper_keystroke_stats", store: "keystrokeStats", idbKey: "all" },
    ];

    for (const { lsKey, store, idbKey } of mapping) {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const data = JSON.parse(raw);
        await idbSet(store, idbKey, data);
      }
    }

    localStorage.setItem(MIGRATED_KEY, "1");
  } catch (err) {
    console.warn("IndexedDB migration failed, continuing with localStorage:", err);
  }
}

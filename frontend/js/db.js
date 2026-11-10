const DATABASE_NAME = 'lab-inventory';
const STORES = ['items', 'locations', 'pending'];

let databasePromise;

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        STORES.forEach((store) => request.result.createObjectStore(store, { keyPath: 'key' }));
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

async function run(store, mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, mode);
    const result = action(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(result.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAll(store) {
  const rows = await run(store, 'readonly', (objectStore) => objectStore.getAll());
  return rows.map((row) => row.value);
}

export function put(store, record) {
  return run(store, 'readwrite', (objectStore) => objectStore.put({ key: record.id, value: record }));
}

export function remove(store, id) {
  return run(store, 'readwrite', (objectStore) => objectStore.delete(id));
}

export async function replaceAll(store, records) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    objectStore.clear();
    records.forEach((record) => objectStore.put({ key: record.id, value: record }));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function queueChange(kind, record) {
  return put('pending', { id: kind + ':' + record.id, kind, record });
}

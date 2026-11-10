import { callApi } from './api.js';
import { getSession, logout } from './auth.js';
import { getAll, put, remove, replaceAll } from './db.js';

const SYNC_INTERVAL_MS = 60000;

const listeners = [];
let syncing = false;
let lastRejected = [];

export function onSyncChange(listener) {
  listeners.push(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export async function pendingCount() {
  return (await getAll('pending')).length;
}

export function takeRejected() {
  const rejected = lastRejected;
  lastRejected = [];
  return rejected;
}

export async function syncNow() {
  const session = getSession();
  if (!session || syncing || !navigator.onLine) return;
  syncing = true;
  try {
    const pending = await getAll('pending');
    const response = await callApi({
      action: 'sync',
      token: session.token,
      items: pending.filter((change) => change.kind === 'item').map((change) => change.record),
      locations: pending.filter((change) => change.kind === 'location').map((change) => change.record)
    });
    if (!response.ok) {
      if (response.error === 'unauthorized') {
        logout();
        location.reload();
      }
      return;
    }
    const current = await getAll('pending');
    for (const sent of pending) {
      const latest = current.find((change) => change.id === sent.id);
      if (latest && JSON.stringify(latest.record) === JSON.stringify(sent.record)) {
        await remove('pending', sent.id);
      }
    }
    lastRejected = response.rejected;
    response.items.forEach((item) => { item.quantity = Number(item.quantity) || 0; });
    await replaceAll('items', response.items);
    await replaceAll('locations', response.locations);
    const stillPending = await getAll('pending');
    for (const change of stillPending) {
      await put(change.kind === 'item' ? 'items' : 'locations', change.record);
    }
  } catch {
    return;
  } finally {
    syncing = false;
    notify();
  }
}

export function startSync() {
  window.addEventListener('online', () => { notify(); syncNow(); });
  window.addEventListener('offline', notify);
  setInterval(syncNow, SYNC_INTERVAL_MS);
  syncNow();
}

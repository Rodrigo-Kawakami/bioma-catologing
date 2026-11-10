import { callApi } from './api.js';

const SESSION_KEY = 'lab-inventory-session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const response = await callApi({ action: 'login', username, password });
  if (!response.ok) return response;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    token: response.token,
    username: response.username,
    display_name: response.display_name
  }));
  return response;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

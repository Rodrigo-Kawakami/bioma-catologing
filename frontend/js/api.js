import { API_URL } from '../config.js';

export async function callApi(body) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body)
  });
  return response.json();
}

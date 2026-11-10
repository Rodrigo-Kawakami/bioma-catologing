import { h } from './dom.js';
import { getSession, logout } from './auth.js';
import { onSyncChange, pendingCount, startSync, takeRejected } from './sync.js';
import { renderLogin } from './views/login.js';
import { renderItems } from './views/items.js';
import { renderItemForm } from './views/item-form.js';
import { renderLocations } from './views/locations.js';

const routes = {
  '#/items': renderItems,
  '#/items/new': renderItemForm,
  '#/items/edit': renderItemForm,
  '#/locations': renderLocations
};

const statusBar = document.getElementById('status');
const navigation = document.getElementById('navigation');
const main = document.getElementById('main');

async function renderStatus() {
  const pending = await pendingCount();
  const online = navigator.onLine;
  statusBar.className = online ? 'online' : 'offline';
  statusBar.textContent = (online ? 'Online' : 'Offline') + ' · ' +
    (pending === 0 ? 'tudo sincronizado' : pending + (pending === 1 ? ' alteração pendente' : ' alterações pendentes'));

  const rejected = takeRejected();
  if (rejected.length) {
    alert(rejected.map((entry) => entry.name + ': ' + entry.reason).join('\n'));
  }
}

function renderNavigation() {
  const session = getSession();
  navigation.replaceChildren(
    h('a', { href: '#/items' }, 'Itens'),
    h('a', { href: '#/locations' }, 'Locais'),
    h('span', { class: 'user' }, session.display_name || session.username),
    h('button', { class: 'link', onclick: () => { logout(); location.reload(); } }, 'Sair'));
}

async function renderRoute() {
  if (!getSession()) {
    navigation.replaceChildren();
    renderLogin(main, start);
    return;
  }
  const route = location.hash.split('?')[0] || '#/items';
  const render = routes[route] || renderItems;
  await render(main);
}

function start() {
  if (!location.hash) location.hash = '#/items';
  renderNavigation();
  renderRoute();
  renderStatus();
  startSync();
}

window.addEventListener('hashchange', renderRoute);
onSyncChange(() => {
  renderStatus();
  const route = location.hash.split('?')[0];
  if (route === '#/items' || route === '#/locations') renderRoute();
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');

if (getSession()) start();
else renderRoute();

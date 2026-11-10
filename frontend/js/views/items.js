import { h } from '../dom.js';
import { getAll } from '../db.js';
import { locationPath } from './locations.js';

export function photoUrl(item) {
  if (item.photo_data) return item.photo_data;
  if (item.photo_id) return 'https://drive.google.com/thumbnail?id=' + item.photo_id + '&sz=w400';
  return null;
}

export async function renderItems(container) {
  const items = await getAll('items');
  const locations = await getAll('locations');
  items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const rows = items.map((item) => {
    const url = photoUrl(item);
    return h('li', {},
      h('a', { href: '#/items/edit?id=' + item.id },
        url ? h('img', { src: url, alt: '', loading: 'lazy' }) : h('span', { class: 'no-photo' }),
        h('span', { class: 'info' },
          h('strong', {}, item.name),
          h('small', {}, [item.category, 'qtd ' + item.quantity].filter(Boolean).join(' · ')),
          h('small', {}, locationPath(locations, item.location_id) || 'Sem local'))));
  });

  container.replaceChildren(
    h('h1', {}, 'Itens'),
    h('a', { class: 'button', href: '#/items/new' }, 'Novo item'),
    rows.length ? h('ul', { class: 'list' }, rows) : h('p', { class: 'empty' }, 'Nenhum item cadastrado.'));
}

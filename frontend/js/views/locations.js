import { h, generateId } from '../dom.js';
import { getAll, put, queueChange } from '../db.js';
import { syncNow } from '../sync.js';

export function locationPath(locations, id) {
  const names = [];
  let current = locations.find((location) => location.id === id);
  while (current) {
    names.unshift(current.name);
    current = locations.find((location) => location.id === current.parent_id);
  }
  return names.join(' > ');
}

export function locationOptions(locations) {
  return locations
    .map((location) => ({ id: location.id, label: locationPath(locations, location.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

function descendantIds(locations, id) {
  const found = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    locations.forEach((location) => {
      if (found.has(location.parent_id) && !found.has(location.id)) {
        found.add(location.id);
        grew = true;
      }
    });
  }
  return found;
}

export async function renderLocations(container) {
  const locations = await getAll('locations');
  const items = await getAll('items');
  const editingId = new URLSearchParams(location.hash.split('?')[1] || '').get('id');
  const editing = locations.find((entry) => entry.id === editingId);

  const name = h('input', { type: 'text', required: true, value: editing ? editing.name : '' });
  const forbidden = editing ? descendantIds(locations, editing.id) : new Set();
  const parent = h('select', {},
    h('option', { value: '' }, '(raiz)'),
    locationOptions(locations)
      .filter((option) => !forbidden.has(option.id))
      .map((option) => h('option', { value: option.id, selected: editing && editing.parent_id === option.id }, option.label)));
  const linkedItem = h('select', {},
    h('option', { value: '' }, '(nenhum)'),
    items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((item) => h('option', { value: item.id, selected: editing && editing.linked_item_id === item.id }, item.name)));

  const form = h('form', {
    onsubmit: async (event) => {
      event.preventDefault();
      const record = {
        id: editing ? editing.id : generateId(),
        name: name.value.trim(),
        parent_id: parent.value,
        linked_item_id: linkedItem.value
      };
      await put('locations', record);
      await queueChange('location', record);
      location.hash = '#/locations';
      syncNow();
    }
  },
  h('h2', {}, editing ? 'Editar local' : 'Novo local'),
  h('label', {}, 'Nome', name),
  h('label', {}, 'Dentro de', parent),
  h('label', {}, 'Item que também é um local', linkedItem),
  h('button', { type: 'submit' }, 'Salvar'),
  editing ? h('a', { class: 'button secondary', href: '#/locations' }, 'Cancelar') : null);

  const list = h('ul', { class: 'list' },
    locationOptions(locations).map((option) => h('li', {},
      h('a', { href: '#/locations?id=' + option.id }, option.label))));

  container.replaceChildren(
    h('h1', {}, 'Locais'),
    locations.length ? list : h('p', { class: 'empty' }, 'Nenhum local cadastrado.'),
    form);
}

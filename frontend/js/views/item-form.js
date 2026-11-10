import { h, generateId } from '../dom.js';
import { getAll, put, queueChange } from '../db.js';
import { getSession } from '../auth.js';
import { syncNow } from '../sync.js';
import { locationOptions } from './locations.js';
import { photoUrl } from './items.js';

const CATEGORIES = ['equipamento', 'componente eletrônico', 'consumível', 'ferramenta', 'material de construção'];
const MAX_PHOTO_SIZE = 1024;

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_SIZE / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(image.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

export async function renderItemForm(container) {
  const items = await getAll('items');
  const locations = await getAll('locations');
  const editingId = new URLSearchParams(location.hash.split('?')[1] || '').get('id');
  const existing = items.find((item) => item.id === editingId) || {};
  let photoData = null;

  const field = (name) => existing[name] || '';

  const name = h('input', { type: 'text', required: true, value: field('name') });
  const category = h('select', { required: true },
    CATEGORIES.map((option) => h('option', { value: option, selected: field('category') === option }, option)));
  const quantity = h('input', { type: 'number', min: '0', step: '1', value: existing.quantity === undefined ? 1 : existing.quantity });
  const size = h('input', { type: 'text', value: field('size') });
  const description = h('textarea', { rows: '3' }, field('description'));
  const assetNumber = h('input', { type: 'text', inputmode: 'numeric', value: field('asset_number') });
  const place = h('select', {},
    h('option', { value: '' }, '(sem local)'),
    locationOptions(locations).map((option) => h('option', { value: option.id, selected: field('location_id') === option.id }, option.label)));
  const responsible = h('input', { type: 'text', value: field('responsible') });

  const preview = h('img', { class: 'preview', alt: '' });
  const currentUrl = photoUrl(existing);
  if (currentUrl) preview.src = currentUrl;
  const photo = h('input', {
    type: 'file',
    accept: 'image/*',
    capture: 'environment',
    onchange: async () => {
      if (!photo.files[0]) return;
      photoData = await resizePhoto(photo.files[0]);
      preview.src = photoData;
    }
  });

  const form = h('form', {
    onsubmit: async (event) => {
      event.preventDefault();
      const session = getSession();
      const now = new Date().toISOString();
      const record = {
        ...existing,
        id: existing.id || generateId(),
        name: name.value.trim(),
        category: category.value,
        quantity: Number(quantity.value) || 0,
        size: size.value.trim(),
        description: description.value.trim(),
        asset_number: assetNumber.value.trim(),
        location_id: place.value,
        responsible: responsible.value.trim(),
        status: existing.status || 'stored',
        created_at: existing.created_at || now,
        created_by: existing.created_by || session.username,
        updated_at: now,
        updated_by: session.username
      };
      if (photoData) record.photo_data = photoData;
      await put('items', record);
      await queueChange('item', record);
      location.hash = '#/items';
      syncNow();
    }
  },
  h('h2', {}, existing.id ? 'Editar item' : 'Novo item'),
  h('label', {}, 'Nome', name),
  h('label', {}, 'Categoria', category),
  h('label', {}, 'Quantidade', quantity),
  h('label', {}, 'Tamanho', size),
  h('label', {}, 'Descrição', description),
  h('label', {}, 'Nº de patrimônio USP (opcional)', assetNumber),
  h('label', {}, 'Local', place),
  h('label', {}, 'Responsável', responsible),
  h('label', {}, 'Foto', photo),
  preview,
  h('button', { type: 'submit' }, 'Salvar'),
  h('a', { class: 'button secondary', href: '#/items' }, 'Cancelar'));

  container.replaceChildren(form);
}

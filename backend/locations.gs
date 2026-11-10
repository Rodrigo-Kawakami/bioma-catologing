function saveLocation(incoming) {
  writeRecord('Locations', {
    id: incoming.id,
    name: incoming.name,
    parent_id: incoming.parent_id || '',
    linked_item_id: incoming.linked_item_id || ''
  });
}

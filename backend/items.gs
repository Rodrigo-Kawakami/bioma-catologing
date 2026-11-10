function saveItem(incoming, user) {
  const allItems = readRows('Items');
  const existing = allItems.filter(function (row) { return row.id === incoming.id; })[0];
  if (existing && existing.updated_at > incoming.updated_at) return null;

  if (incoming.asset_number) {
    const duplicate = allItems.filter(function (row) {
      return row.asset_number === String(incoming.asset_number) && row.id !== incoming.id;
    })[0];
    if (duplicate) return 'Patrimônio já cadastrado em "' + duplicate.name + '"';
  }

  if (incoming.photo_data) {
    incoming.photo_id = savePhoto(incoming.id, incoming.photo_data);
  } else if (existing && !incoming.photo_id) {
    incoming.photo_id = existing.photo_id;
  }

  const record = {};
  SHEET_HEADERS.Items.forEach(function (field) {
    record[field] = incoming[field] === undefined || incoming[field] === null ? '' : String(incoming[field]);
  });
  record.updated_by = user;
  if (existing) {
    record.created_at = existing.created_at;
    record.created_by = existing.created_by;
  } else {
    record.created_by = user;
  }

  const changes = diffRecords(existing, record);
  writeRecord('Items', record);
  if (Object.keys(changes).length > 0) {
    appendLog(user, existing ? 'update' : 'create', record.id, changes);
  }
  return null;
}

function savePhoto(itemId, dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', itemId + '.jpg');
  const file = DriveApp.getFolderById(getProperty('PHOTOS_FOLDER_ID')).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}

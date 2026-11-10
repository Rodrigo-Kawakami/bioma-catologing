function appendLog(user, action, itemId, changes) {
  getSpreadsheet().getSheetByName('Log').appendRow([
    new Date().toISOString(),
    user,
    action,
    itemId,
    JSON.stringify(changes)
  ]);
}

function diffRecords(before, after) {
  const changes = {};
  Object.keys(after).forEach(function (field) {
    if (field === 'photo_data' || field === 'updated_at' || field === 'updated_by') return;
    const oldValue = before ? before[field] || '' : '';
    const newValue = after[field] === undefined || after[field] === null ? '' : String(after[field]);
    if (oldValue !== newValue) changes[field] = [oldValue, newValue];
  });
  return changes;
}

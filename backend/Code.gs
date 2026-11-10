/*
Script Properties (Project Settings > Script Properties), never committed:
  SPREADSHEET_ID    id of the Google Sheet used as database
  PHOTOS_FOLDER_ID  id of the Drive folder that receives item photos
  BACKUP_FOLDER_ID  id of the Drive folder that receives the backup copy
Run setupSheets once after setting SPREADSHEET_ID.
*/

const SHEET_HEADERS = {
  Items: ['id', 'name', 'category', 'quantity', 'size', 'description', 'asset_number', 'location_id', 'responsible', 'photo_id', 'status', 'withdrawn_by', 'withdrawn_to', 'withdrawn_at', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  Locations: ['id', 'name', 'parent_id', 'linked_item_id'],
  Log: ['timestamp', 'user', 'action', 'item_id', 'changes'],
  Users: ['username', 'password_hash', 'salt', 'display_name']
};

function setupSheets() {
  const spreadsheet = getSpreadsheet();
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).setNumberFormat('@');
    sheet.setFrozenRows(1);
  });
}

function getProperty(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing script property ' + name);
  return value;
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(getProperty('SPREADSHEET_ID'));
}

function readRows(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).filter(function (row) { return row[0] !== ''; }).map(function (row) {
    const record = {};
    headers.forEach(function (header, index) { record[header] = String(row[index]); });
    return record;
  });
}

function findRowNumber(sheet, id) {
  const ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (let index = 1; index < ids.length; index++) {
    if (String(ids[index][0]) === id) return index + 1;
  }
  return -1;
}

function writeRecord(sheetName, record) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const row = headers.map(function (header) {
    const value = record[header];
    return value === undefined || value === null ? '' : String(value);
  });
  const rowNumber = findRowNumber(sheet, record.id);
  if (rowNumber === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Inventory backend is running' });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const request = JSON.parse(event.postData.contents);
    if (request.action === 'login') return jsonResponse(login(request.username, request.password));
    const user = checkToken(request.token);
    if (!user) return jsonResponse({ ok: false, error: 'unauthorized' });
    if (request.action === 'sync') return jsonResponse(sync(request, user));
    return jsonResponse({ ok: false, error: 'unknown_action' });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function sync(request, user) {
  const rejected = [];
  (request.locations || []).forEach(function (location) {
    saveLocation(location);
  });
  (request.items || []).forEach(function (item) {
    const problem = saveItem(item, user);
    if (problem) rejected.push({ id: item.id, name: item.name, reason: problem });
  });
  return {
    ok: true,
    items: readRows('Items'),
    locations: readRows('Locations'),
    rejected: rejected
  };
}

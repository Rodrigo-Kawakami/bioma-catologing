/*
To add or change an account: fill the three variables below, run addUser once from the editor,
then clear the password again. Accounts can also be edited by hand in the Users sheet.
*/
const NEW_USERNAME = '';
const NEW_PASSWORD = '';
const NEW_DISPLAY_NAME = '';

const SESSION_DAYS = 30;

function hashPassword(password, salt) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(digest);
}

function addUser() {
  const salt = Utilities.getUuid();
  const sheet = getSpreadsheet().getSheetByName('Users');
  const row = [NEW_USERNAME, hashPassword(NEW_PASSWORD, salt), salt, NEW_DISPLAY_NAME];
  const rowNumber = findRowNumber(sheet, NEW_USERNAME);
  if (rowNumber === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  }
}

function login(username, password) {
  const user = readRows('Users').filter(function (row) { return row.username === username; })[0];
  if (!user || hashPassword(password, user.salt) !== user.password_hash) {
    return { ok: false, error: 'invalid_credentials' };
  }
  const token = Utilities.getUuid() + Utilities.getUuid();
  const sessions = loadSessions();
  sessions[token] = { username: user.username, expires: Date.now() + SESSION_DAYS * 86400000 };
  saveSessions(sessions);
  return { ok: true, token: token, username: user.username, display_name: user.display_name };
}

function loadSessions() {
  const stored = PropertiesService.getScriptProperties().getProperty('SESSIONS');
  const sessions = stored ? JSON.parse(stored) : {};
  const now = Date.now();
  Object.keys(sessions).forEach(function (token) {
    if (sessions[token].expires < now) delete sessions[token];
  });
  return sessions;
}

function saveSessions(sessions) {
  PropertiesService.getScriptProperties().setProperty('SESSIONS', JSON.stringify(sessions));
}

function checkToken(token) {
  if (!token) return null;
  const session = loadSessions()[token];
  return session ? session.username : null;
}

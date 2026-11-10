const BACKUP_NAME = 'inventory_backup';

function backupSpreadsheet() {
  const folder = DriveApp.getFolderById(getProperty('BACKUP_FOLDER_ID'));
  const previous = folder.getFilesByName(BACKUP_NAME);
  while (previous.hasNext()) previous.next().setTrashed(true);
  DriveApp.getFileById(getProperty('SPREADSHEET_ID')).makeCopy(BACKUP_NAME, folder);
}

function installBackupTrigger() {
  ScriptApp.newTrigger('backupSpreadsheet').timeBased().everyWeeks(2).onWeekDay(ScriptApp.WeekDay.SUNDAY).create();
}

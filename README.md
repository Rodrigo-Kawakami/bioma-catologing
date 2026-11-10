# Lab Inventory App

Offline-capable web app (PWA) to register the items of a research lab. See `CLAUDE.md` for the full design.

## Setup (one time)

### 1. Google side

1. Create a Google Sheet (empty) and a Drive folder for photos and another for the backup.
2. Open Extensions > Apps Script from the sheet, or create a standalone project, and set these Script Properties (Project Settings):
   - `SPREADSHEET_ID`
   - `PHOTOS_FOLDER_ID`
   - `BACKUP_FOLDER_ID`
3. Deploy the `backend/` folder with `clasp`:

```bash
npm install -g @google/clasp
clasp login
clasp create --type standalone --title "Lab Inventory" --rootDir backend
clasp push
```

4. In the Apps Script editor, run `setupSheets` (creates the tabs and headers), then `installBackupTrigger`.
5. Add each account: fill `NEW_USERNAME`, `NEW_PASSWORD` and `NEW_DISPLAY_NAME` at the top of `auth.gs`, run `addUser`, then clear the password again. Do not commit it.
6. Deploy > New deployment > Web app, execute as "Me", access "Anyone". Copy the URL ending in `/exec`.

After any later `clasp push`, create a new version of the deployment.

### 2. Frontend

1. Paste the web app URL in `frontend/config.js`.
2. Connect the GitHub repo to Cloudflare Pages: build command empty, output directory `frontend`.

To try locally: `python -m http.server 8000 --directory frontend` and open `http://localhost:8000`.

## Notes

- When changing frontend files, bump `CACHE_NAME` in `frontend/service-worker.js` and add any new file to `APP_SHELL`.
- Photos are shared as "anyone with the link" so that they show up in the app.

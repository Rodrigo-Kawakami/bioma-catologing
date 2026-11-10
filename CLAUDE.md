# Lab Inventory App

Free, offline-capable web app (PWA) for registering and viewing the items of a research lab at USP. Used by 5 lab members, all with edit permission. Maintained afterwards by the professor, so simplicity wins over features.

## Language rules

- UI text: Brazilian Portuguese.
- Code, identifiers, commits, README, this file: English.
- Scripts: no comments. Use self-explanatory names. Only allowed comments: a short block at the top of a script explaining how to use its configuration variables, or a rare comment where the code truly cannot be made clear.

## Constraints

- Zero cost: Google Sheets + Google Apps Script (backend), Cloudflare Pages (frontend hosting), GitHub private repo.
- No build step if avoidable: plain HTML, CSS and vanilla JavaScript (ES modules). No frameworks, no bundlers, no npm dependencies unless unavoidable.
- No automated tests, no linter requirement.
- Works offline on phone and desktop; syncs when connection returns.
- No data import: the app is the source of truth, starting empty.

## Architecture

```
Browser (PWA, Cloudflare Pages)
  ├─ Service worker: caches app shell
  ├─ IndexedDB: local copy of data + queue of pending changes
  └─ fetch ──► Apps Script Web App (doPost / doGet)
                  └─ Google Sheet (database) + Drive folder (photos)
```

- Frontend is static and talks only to the Apps Script web app URL (set in `frontend/config.js`).
- Apps Script web app is deployed as "Execute as: me", "Access: anyone"; real access control is the app login, checked on every request.
- To avoid CORS preflight, the frontend sends POST with `Content-Type: text/plain` and a JSON string body.
- Photos are resized client-side (max ~1024 px, JPEG) and uploaded to a Drive folder by Apps Script; the sheet stores the file id or URL.

## Offline and sync

- Every write goes first to IndexedDB and to a pending queue, then is sent when online.
- Records get a client-generated UUID, so retrying a request never duplicates an item.
- Conflict rule: last write wins, based on `updated_at`. With 5 users this is enough.
- Reads: app loads from IndexedDB immediately, then refreshes from the server when online.
- UI shows a clear online/offline state and the number of pending changes.

## Authentication

- Simple username and password, 5 accounts, stored in a `Users` sheet (password hashed with salt via `Utilities.computeDigest`, never plain text).
- Login returns a session token kept in `CacheService`/`PropertiesService`; the frontend sends it on every request.
- Accounts are added by editing the `Users` sheet by hand (no sign-up screen).
- Do not commit secrets, the spreadsheet id, or the Drive folder id to the repo; keep them in Apps Script Script Properties.

## Data model (Google Sheet tabs)

**Items**
`id, name, category, quantity, size, description, asset_number, location_id, responsible, photo_id, status, withdrawn_by, withdrawn_to, withdrawn_at, created_at, created_by, updated_at, updated_by`

- `category`: equipamento, componente eletrônico, consumível, ferramenta, material de construção.
- `asset_number`: USP patrimônio number, optional, unique when present.
- `status`: `stored` or `withdrawn`.
- When `withdrawn`, `withdrawn_to` says where the item is and `withdrawn_by` who has it. Returning an item clears these fields and sets `location_id` back.

**Locations**
`id, name, parent_id, linked_item_id`

- Hierarchy: room > cabinet > shelf > box, any depth.
- An item can also be a place (example: the scale is an item and a storage spot). Do this by creating a Location whose `linked_item_id` points to that item.

**Log**
`timestamp, user, action, item_id, changes`

- Every create, update and withdrawal appends one row. `changes` is a short JSON diff. Never edit or delete log rows from the app.

**Users**
`username, password_hash, salt, display_name`

## Features

### v1 (essential)
- Login.
- Create items with all fields above, including photo capture from the phone camera.
- Create and manage locations (tree).
- Offline queue and sync.

### v2
- List, search and filter items by name, category, location, responsible.
- Item detail page with location path and change history.
- Edit items.

### v3
- Withdraw items: mark as withdrawn, set who has it and where it is.
- Return items.
- List of currently withdrawn items.

### Out of scope
Labels, QR codes, barcodes, stock alerts, loans with due dates, reports, data import, integrations.

## Backups

- Apps Script time-driven trigger every 2 weeks copies the spreadsheet to a Drive folder as `inventory_backup`, deleting the previous copy so only one remains.

## Repository layout

```
/
├── CLAUDE.md
├── README.md
├── frontend/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   ├── config.js
│   ├── css/
│   └── js/
│       ├── api.js
│       ├── db.js
│       ├── sync.js
│       ├── auth.js
│       └── views/
└── backend/
    ├── Code.gs
    ├── items.gs
    ├── locations.gs
    ├── auth.gs
    ├── log.gs
    ├── backup.gs
    └── appsscript.json
```

- Backend is deployed with `clasp` (`clasp push`, then deploy a new version of the web app).
- Frontend deploys automatically from the `main` branch via Cloudflare Pages.
- Python is only for optional local utilities (for example, exporting the sheet to CSV). The app itself does not need it.

## Working rules for Claude

- Keep everything simple enough for a non-developer to maintain; prefer fewer files and plain code.
- Build one version at a time (v1 first) and stop for review before starting the next.
- Never add paid services, frameworks, or dependencies without asking.
- Any change to the sheet columns must update the data model section of this file.
- Interface strings in Portuguese, everything else in English.
- Ask before deviating from anything written here.

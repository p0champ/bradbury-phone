# Bradbury Cabin for iPhone

A working installable web app, kept in its own project. The Quest project is read only and unchanged.

Phone address: https://p0champ.github.io/bradbury-phone/

Open the hosted HTTPS address in Safari, choose Share → Add to Home Screen, and leave Open as Web App enabled. The app then opens from its own icon. This is a Home Screen web app, not an App Store binary. Apple’s instructions: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

Swipe between the three full-screen covers. Tap or pull up to read. Pull down from the top of the reading, or tap Today, to return. The corner button opens Shelf and Library. The short arrival plays only on the first opening of each Berlin day and any touch skips it. Day/night follows local device time, with the approved Afterglow and Velvet Cinema colours.

## What is real

- All 241 complete source-catalogue works and their real CC0 painting covers. No literary text is written by the app or supplied by a picks file.
- Original spring physics and main poster/reader gestures, retained from the approved structure A.
- Reading places survive close/reopen, using a paragraph and character anchor. Type size changes preserve the place.
- Explicit Mark as read, bookmarks, a Shelf of read/saved/in-progress works, and Library search.
- Optional 1–5 stars and a short, explicitly saved thought. Deletions survive merges.
- Local storage plus a previous-save recovery copy. Export and merge-only restore of the full phone backup.
- The established Google Drive sign-in and Claude picks parser, copied unchanged from the reference project. Ask Claude for the daily three or a swap as before. Sync with Drive receives the newest file; while connected, the app checks about once a minute. A swap waits until the open reading is closed before changing posters.
- Read-before-write Drive backup merging preserves unrelated Quest fields. Phone storage and sign-in keys have their own namespace. Reading places, phone type size and bookmarks remain in the phone backup; shared completions, stars and saved thoughts use progress.json.
- Offline installation caches every work, font and cover atomically. A failed update keeps the previous complete cache. Google responses and personal backups are never stored in the public asset cache.

On a fresh phone before its first Drive connection, the three covers are labelled Library selections; they are not presented as Claude’s current daily picks. Once connected, the newest accepted dated trio replaces them. An older accepted trio is labelled with its date.

## Running locally

Use Node.js, then run `npm start` in this folder. The local preview is http://127.0.0.1:8782/. Google sign-in expects the already authorized https://p0champ.github.io origin; local reading, saving and offline checks do not require Google. Localhost on this PC is not an iPhone URL.

Run `npm test` for state, backup, source-reference, same-day-swap and sync-failure checks. For browser checks, install the free development dependency with `npm install`, keep `npm start` running, then run `npm run test:browser` with Microsoft Edge installed. Browser checks and final verification are recorded separately. A desktop browser pass does not prove physical iPhone gestures or a real-account Drive restore. Those require the owner’s device and account.

## Sources and save points

`credits.json` maps every work to artist, painting title, year, museum, CC0 policy, official source record and crop. All selected artists died before 1955. App icons are crops of the credited museum painting used for The Sick Rose. Text blocks are copied verbatim from the reviewed source catalogue, including pre-existing transcription issues; source-edition metadata is retained.

`CHOICES.md` explains the final four cover choices. Source copies in `core/` are identified by `core-source-receipts.json`. They do not include Quest display code, account data or the unproven managed Cloudflare connection.

Git tags named `step-*` preserve each completed build step. A separate save-point record lists their hashes. Source rollback never requires deleting or rolling back personal reading data. Project code, save points, real covers and credits are protected during cleanup.

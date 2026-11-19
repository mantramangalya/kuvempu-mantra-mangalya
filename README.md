# ಮಂತ್ರ ಮಾಂಗಲ್ಯ · Kuvempu Mantra Mangalya

Bilingual (Kannada default / English) static website for GitHub Pages, with a Google Apps Script backend.

```
kuvempu-mantra-mangalya/
├─ frontend/            <- the website (published to GitHub Pages)
│  ├─ index.html  about.html  procedure.html  guidance.html  downloads.html  community.html  contact.html
│  ├─ css/style.css
│  ├─ js/ (config.js, i18n.js, about-content.js, app.js)
│  └─ images/           <- put your .webp images here
├─ backend/             <- paste into Google Apps Script (not published)
│  ├─ Code.gs
│  └─ appsscript.json
└─ .github/workflows/pages.yml
```

## 1. Images
Add these to `frontend/images/` (missing images just show a blank frame):
`kuvempu.webp`, `tejaswi-rajeshwari-maduve.webp`, `tejaswi-rajeshwari-maduve-invitation.webp`, `mantra-mangalya-book.webp`

## 2. Backend (Google Apps Script)
1. Sign in as **mantramangalya1966@gmail.com** (mail is sent from the deploying account).
2. Open the Google Sheet `1snf2UGSODNWa6AAQ91SaHGxI0WAWpv2Ts7NTqTVaNuE`. Make sure the tab **Queries** exists with a header row, e.g.
   `Timestamp | Name | Contact Number | Email | Place | Topic | Message | Language | Status`
   (Mapping is by column *name*; unknown form fields are ignored, missing columns stay empty. The tab is auto-created if absent.)
3. Go to script.google.com → New project → paste `backend/Code.gs` (and enable *Show appsscript.json* in Project Settings and paste `backend/appsscript.json`).
4. Create two Drive folders (downloads, photos), set sharing to *Anyone with the link – Viewer*, and paste their IDs into `MM_DOWNLOADS_FOLDER_ID` / `MM_PHOTOS_FOLDER_ID`.
5. Deploy → New deployment → **Web app** → Execute as *Me*, Who has access *Anyone* → authorise → copy the `/exec` URL.
6. Paste that URL into `frontend/js/config.js` → `API_URL`.

Re-deploy (Manage deployments → Edit → New version) after any change to `Code.gs`.

## 3. GitHub Pages
1. Create the repo `kuvempu-mantra-mangalya`, push this folder to `main`.
2. Repo → Settings → Pages → **Source: GitHub Actions**. The included workflow publishes the `frontend/` folder.
3. Site URL: `https://<your-user>.github.io/kuvempu-mantra-mangalya/`

All links are relative, so it works under the repo sub-path.

## Notes
- No secrets in the frontend: the Sheet ID, mail settings and Drive folder IDs live only in `Code.gs`. The Web App URL is public by design.
- Edit About content in `frontend/js/about-content.js`; UI text in `frontend/js/i18n.js`.
- Language choice is remembered in `localStorage` (`mm_lang`); default is Kannada.
- Apps Script MailApp daily quota applies (about 100 recipients/day for free Gmail accounts).

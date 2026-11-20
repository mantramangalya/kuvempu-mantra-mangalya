# ಮಂತ್ರ ಮಾಂಗಲ್ಯ · Kuvempu Mantra Mangalya

Bilingual (Kannada default / English) static website for GitHub Pages, with a Google Apps Script backend.

```
kuvempu-mantra-mangalya/
├─ frontend/            <- the website (published to GitHub Pages)
│  ├─ index.html                      -> /
│  ├─ about/ guidance/ downloads/ community/ contact/   (each has index.html -> clean URLs like /about/)
│  ├─ css/style.css
│  ├─ js/ (config.js, i18n.js, about-content.js, guide-content.js, docgen.js, app.js, guidance.js)
│  ├─ data/             <- videos.json, samples.config.json (edit these; manifest.json is auto-generated)
│  ├─ downloads/mm-marriage-code-formats/   <- mm-marriage-code-format-1.pdf, -2.docx ...
│  └─ images/           <- your .webp images; sample-mm-invitations/ holds sample-mm-invitation-1.webp ...
├─ backend/             <- paste into Google Apps Script (not published)
│  ├─ Code.gs
│  └─ appsscript.json
├─ scripts/build-manifest.py   <- run by the workflow to list files for the Samples tab
└─ .github/workflows/pages.yml
```

## 1. Images
Add these to `frontend/images/` (missing images just show a blank frame):
`kuvempu.webp`, `tejaswi-rajeshwari-maduve.webp`, `tejaswi-rajeshwari-maduve-invitation.webp`, `mantra-mangalya-book.webp`,
and the personalities cards: `kuvempu-home.webp`, `tejaswi.webp`, `basavanna.webp`, `buddha.webp`, `ambedkar.webp`.
**Logo / favicon:** replace `frontend/favicon.svg` with your logo (or put e.g. `favicon.png` in `frontend/` and set `LOGO: "favicon.png"` in `js/config.js`). It is used as the favicon and beside the site name.
**More personalities:** add one line to `PERSONALITIES` in `js/config.js` and put the image in `images/`.

## 2. Backend (Google Apps Script)
1. Sign in as **mantramangalya1966@gmail.com** (mail is sent from the deploying account).
2. Open the Google Sheet `1snf2UGSODNWa6AAQ91SaHGxI0WAWpv2Ts7NTqTVaNuE`. Make sure the tab **Queries** exists with a header row, e.g.
   `Timestamp | Name | Contact Number | Email | Place | Topic | Message | Language | Status`
   (Mapping is by column *name*; unknown form fields are ignored, missing columns stay empty. The tab is auto-created if absent.)
3. Go to script.google.com → New project → paste `backend/Code.gs` (and enable *Show appsscript.json* in Project Settings and paste `backend/appsscript.json`).
4. Create two Drive folders (downloads, photos), set sharing to *Anyone with the link – Viewer*, and paste their IDs into `MM_DOWNLOADS_FOLDER_ID` / `MM_PHOTOS_FOLDER_ID`.
5. Deploy → New deployment → **Web app** → Execute as *Me*, Who has access *Anyone* → authorise → copy the `/exec` URL.
6. Paste that URL into `frontend/js/config.js` → `API_URL`.

7. Marriage venues: add a sheet tab named **MarriageVenue** (`MM_MARRIAGE_VENUE_SHEET_NAME`) in the same Google Sheet with the header row `District | Venue | Address | Contact Details` and one venue per row.

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

- Clean URLs: each page lives in its own folder (`about/index.html` is served at `/about/`), so `.html` never shows in the address bar. All links are relative, so it works both on `https://<user>.github.io/kuvempu-mantra-mangalya/` and on a custom domain.
- Images: hover on any image to get Full view / Download; the viewer closes with the Close button, Esc or a click outside.

## Guidance page (Procedure + Guidance combined)
Tabs: Guidance · ವಿವಾಹ ಸಂಹಿತೆ (Marriage Code, download as Word/PDF) · Marriage Venue · Samples & Links · FAQ. Deep links: `/guidance/#venue`, `#code`, `#samples`, `#faq`.
- **Edit guidance steps / Marriage Code text / FAQs:** `frontend/js/guide-content.js` (add a FAQ by appending one object to `MM_FAQ`).
- **Videos:** add entries to `frontend/data/videos.json` (YouTube / Instagram / Facebook / any link).
- **Sample invitations and Marriage Code formats:** just add files named `sample-mm-invitation-N.<ext>` to `frontend/images/sample-mm-invitations/` and `mm-marriage-code-format-N.<ext>` to `frontend/downloads/mm-marriage-code-formats/`, then push. The workflow runs `scripts/build-manifest.py` and they appear automatically (no code change). To add a new kind of section (flyers, forms ...), add one entry to `frontend/data/samples.config.json` and create its folder.
- **PDF download** opens the browser print dialog; choose "Save as PDF" (this keeps Kannada text perfectly shaped).

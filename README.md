# ಮಂತ್ರ ಮಾಂಗಲ್ಯ · Kuvempu Mantra Mangalya

Bilingual (Kannada default / English) static website for GitHub Pages, with a Google Apps Script backend.

```
kuvempu-mantra-mangalya/
├─ frontend/            <- the website (published to GitHub Pages)
│  ├─ index.html                      -> /
│  ├─ about/ guidance/ downloads/ community/ contact/   (each has index.html -> clean URLs like /about/)
│  ├─ css/style.css
│  ├─ js/ (config.js, i18n.js, about-content.js, guide-content.js, docgen.js, app.js, browse.js, guidance.js, downloads.js)
│  ├─ data/             <- videos.json, downloads.config.json (edit these); manifest.js is auto-generated
│  ├─ downloads/mm-marriage-code-formats/   <- mm-marriage-code-format-1.pdf, -2.docx ...
│  └─ images/           <- page images (any format) + folders below
│     ├─ mm-logo/                 mm-logo-1.png, mm-logo-2.svg ...        (Downloads > Logo)
│     ├─ hd-photos/               any file name, any format              (Downloads > Person Photos)
│     ├─ sample-mm-invitations/   sample-mm-invitation-1.jpg ...          (Downloads > Sample Invitations)
│     └─ mm-marriage-photos/      any file name, any format              (Guidance > Photo Gallery > Photos)
├─ backend/             <- paste into Google Apps Script (not published)
├─ scripts/build-manifest.py   <- run by the workflow: lists the folders above (GitHub Pages cannot list folders)
└─ .github/workflows/pages.yml
```

## 1. Images (any format: png, jpg, jpeg, webp, avif, gif, svg)
Page images in `frontend/images/` keep these **base names**; the extension can be anything: `kuvempu`, `tejaswi-rajeshwari-maduve`, `tejaswi-rajeshwari-maduve-invitation`, `mantra-mangalya-book`,
and the Home-page personality cards `kuvempu-home`, `tejaswi`, `basavanna`, `buddha`, `ambedkar`. Missing images just show a blank frame.
Folder images: follow the name pattern shown above (logo / sample invitations) or use any name (HD photos, wedding photos). Add the file, push, done: the workflow regenerates `data/manifest.js` automatically.
**Logo / favicon:** replace `frontend/favicon.svg` with your logo (or put e.g. `favicon.png` in `frontend/` and set `LOGO: "favicon.png"` in `js/config.js`).
**More personalities (Home page only):** add one line to `PERSONALITIES` in `js/config.js` (file name without extension) and put the image in `images/`.

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

## Guidance page
Tabs: Guidance · Marriage Code (Word/PDF, same file-name pattern `kuvempu-mantra-mangalya-vivaha-samhite-<kn|en>`) · Marriage Venue · Photo Gallery (Videos + Photos) · FAQ. Deep links: `/guidance/#code`, `#venue`, `#gallery`, `#faq`.
- **Edit guidance steps / Marriage Code text / FAQs:** `frontend/js/guide-content.js`. A FAQ may carry `links:[{to:'downloads/#invitations', kn:'..', en:'..'}]` (path from the site root).
- **Videos:** add entries to `frontend/data/videos.json` (YouTube / Instagram / Facebook / any link). Photos: drop images into `frontend/images/mm-marriage-photos/`.
- Every section on Guidance / Photo Gallery / Downloads can be expanded or collapsed; long lists are paginated.

## Downloads page
Sections (in order): Logo, Person Photos, Sample Invitations, Marriage Code Templates - defined in `frontend/data/downloads.config.json`. Add a section by adding one object there and creating its folder. Deep links: `/downloads/#logo`, `#photos`, `#invitations`, `#code-formats`.
- **PDF download** of the Marriage Code opens the browser print dialog; choose "Save as PDF" (keeps Kannada text perfectly shaped).

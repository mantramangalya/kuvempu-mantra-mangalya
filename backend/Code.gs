/**
 * Mantra Mangalya – Apps Script backend (JSON API).
 * Bind this script to your Google Sheet (Extensions > Apps Script), then:
 *   1. Run setup() once (authorise when asked).
 *   2. Project Settings > Script properties: set OWNER_EMAIL (and DOWNLOADS_FOLDER_ID if you use a Drive folder).
 *   3. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 *
 * Endpoints
 *   GET  ?action=ping | downloads | members
 *   POST {action:"contact"|"register", ...}   (sent as text/plain to avoid CORS preflight)
 */

var SHEETS = {
  Contacts:  ['Timestamp', 'Name', 'Email', 'Phone', 'Place', 'Topic', 'Message', 'Lang'],
  Members:   ['Timestamp', 'Name', 'Place', 'Year', 'Story', 'Email', 'Phone', 'ShowPublic', 'Approved', 'Lang'],
  Downloads: ['Order', 'Category', 'Title_kn', 'Title_en', 'FileId', 'Type', 'Active']
};

var CACHE_KEYS = ['downloads', 'members'];

/* ---------------- Setup ---------------- */

function setup() {
  var ss = ss_();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var head = SHEETS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#fdf0d8');
    sh.setFrozenRows(1);
  });
  // Approved + Active as checkboxes
  var m = ss.getSheetByName('Members');
  m.getRange(2, 9, 998, 1).insertCheckboxes();
  var d = ss.getSheetByName('Downloads');
  d.getRange(2, 7, 998, 1).insertCheckboxes();
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);

  var p = props_();
  if (!p.getProperty('OWNER_EMAIL')) p.setProperty('OWNER_EMAIL', Session.getEffectiveUser().getEmail());
  if (!p.getProperty('SITE_NAME')) p.setProperty('SITE_NAME', 'Mantra Mangalya');
  Logger.log('Setup complete. Check Script properties (OWNER_EMAIL, DOWNLOADS_FOLDER_ID).');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mantra Mangalya')
    .addItem('Sync Downloads from Drive folder', 'syncDownloadsFromFolder')
    .addItem('Clear website cache', 'clearCache_')
    .addToUi();
}

// Simple trigger: any edit in the sheet refreshes what the website shows.
function onEdit() { clearCache_(); }

/**
 * Adds every file in the Drive folder (DOWNLOADS_FOLDER_ID) that is not yet listed in the Downloads sheet,
 * and makes it viewable by anyone with the link. Then fill Title_kn/Title_en and Category by hand.
 * Category must be "template" or "invitation".
 */
function syncDownloadsFromFolder() {
  var folderId = props_().getProperty('DOWNLOADS_FOLDER_ID');
  if (!folderId) throw new Error('Set DOWNLOADS_FOLDER_ID in Script properties first.');
  var sh = ss_().getSheetByName('Downloads');
  var existing = {};
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 5, last - 1, 1).getValues().forEach(function (r) { existing[r[0]] = true; });

  var files = DriveApp.getFolderById(folderId).getFiles();
  var rows = [], order = last;
  while (files.hasNext()) {
    var f = files.next();
    if (existing[f.getId()]) continue;
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var name = f.getName().replace(/\.[^.]+$/, '');
    var ext = (f.getName().split('.').pop() || '').toUpperCase().slice(0, 5);
    order++;
    rows.push([order, 'template', name, name, f.getId(), ext, true]);
  }
  if (rows.length) {
    var start = sh.getLastRow() + 1;
    sh.getRange(start, 1, rows.length, 7).setValues(rows);
  }
  clearCache_();
  Logger.log('Added ' + rows.length + ' file(s).');
}

/* ---------------- HTTP handlers ---------------- */

function doGet(e) {
  var a = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    if (a === 'downloads') return json_({ ok: true, data: cached_('downloads', 21600, getDownloads_) });
    if (a === 'members') return json_({ ok: true, data: cached_('members', 600, getMembers_) });
    return json_({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Spam checks: honeypot + too-fast submission.
    if (body.website) return json_({ ok: true });
    if (Number(body.elapsed) < 2500) return json_({ ok: false, error: 'invalid' });

    if (body.action === 'contact') return json_(handleContact_(body));
    if (body.action === 'register') return json_(handleRegister_(body));
    return json_({ ok: false, error: 'invalid' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

/* ---------------- Actions ---------------- */

function handleContact_(b) {
  var d = {
    name: clean_(b.name, 80), email: clean_(b.email, 120).toLowerCase(), phone: clean_(b.phone, 20),
    place: clean_(b.place, 80), topic: clean_(b.topic, 30), message: clean_(b.message, 2000),
    lang: b.lang === 'en' ? 'en' : 'kn'
  };
  if (!d.name || !validEmail_(d.email) || d.message.length < 10) return { ok: false, error: 'invalid' };
  if (rateLimited_(d.email, 'contact', 5)) return { ok: false, error: 'rate' };

  append_('Contacts', [new Date(), d.name, d.email, d.phone, d.place, d.topic, d.message, d.lang]);

  var owner = props_().getProperty('OWNER_EMAIL');
  var site = props_().getProperty('SITE_NAME') || 'Mantra Mangalya';
  if (owner) {
    MailApp.sendEmail({
      to: owner, replyTo: d.email, name: site,
      subject: '[' + site + '] New enquiry: ' + d.topic + ' – ' + d.name,
      body: 'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + d.phone + '\nPlace: ' + d.place +
            '\nTopic: ' + d.topic + '\nLanguage: ' + d.lang + '\n\n' + d.message
    });
  }
  // Acknowledgement to the sender
  try {
    MailApp.sendEmail({
      to: d.email, name: site, replyTo: owner || d.email,
      subject: d.lang === 'en' ? 'We received your message' : 'ನಿಮ್ಮ ಸಂದೇಶ ತಲುಪಿದೆ',
      body: d.lang === 'en'
        ? 'Dear ' + d.name + ',\n\nThank you for contacting ' + site + '. We have received your message and will reply soon.\n\n– ' + site
        : 'ಪ್ರಿಯ ' + d.name + ',\n\n' + site + ' ಅನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಸಂದೇಶ ತಲುಪಿದೆ; ಶೀಘ್ರದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇವೆ.\n\n– ' + site
    });
  } catch (e) { console.warn('ack mail failed', e); }
  return { ok: true };
}

function handleRegister_(b) {
  var year = parseInt(b.year, 10);
  var d = {
    name: clean_(b.name, 80), place: clean_(b.place, 80), email: clean_(b.email, 120).toLowerCase(),
    phone: clean_(b.phone, 20), story: clean_(b.story, 800), year: year,
    showPublic: b.showPublic === true, consent: b.consent === true, lang: b.lang === 'en' ? 'en' : 'kn'
  };
  var thisYear = new Date().getFullYear();
  if (!d.name || !d.place || !validEmail_(d.email) || !d.consent || !(year >= 1960 && year <= thisYear + 1)) {
    return { ok: false, error: 'invalid' };
  }
  if (rateLimited_(d.email, 'register', 3)) return { ok: false, error: 'rate' };

  // Approved = FALSE until the owner ticks the checkbox in the sheet.
  append_('Members', [new Date(), d.name, d.place, d.year, d.story, d.email, d.phone, d.showPublic, false, d.lang]);

  var owner = props_().getProperty('OWNER_EMAIL');
  if (owner) {
    MailApp.sendEmail({
      to: owner, name: props_().getProperty('SITE_NAME') || 'Mantra Mangalya',
      subject: 'New community registration: ' + d.name,
      body: d.name + ' (' + d.place + ', ' + d.year + ') has registered.\nOpen the Members sheet and tick "Approved" to publish.\n' + ss_().getUrl()
    });
  }
  return { ok: true };
}

/* ---------------- Data readers (public, minimal fields only) ---------------- */

function getDownloads_() {
  var sh = ss_().getSheetByName('Downloads');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues()
    .filter(function (r) { return r[4] && r[6] !== false; })
    .sort(function (a, b) { return (Number(a[0]) || 999) - (Number(b[0]) || 999); })
    .map(function (r) {
      return { category: String(r[1] || 'template'), title: { kn: String(r[2] || r[3]), en: String(r[3] || r[2]) }, fileId: String(r[4]), type: String(r[5] || '') };
    });
}

function getMembers_() {
  var sh = ss_().getSheetByName('Members');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 10).getValues()
    .filter(function (r) { return (r[8] === true || r[8] === 'TRUE') && (r[7] === true || r[7] === 'TRUE'); })
    .map(function (r) { return { name: String(r[1]), place: String(r[2]), year: r[3], story: String(r[4] || '') }; })
    .reverse(); // newest first
}

/* ---------------- Helpers ---------------- */

function props_() { return PropertiesService.getScriptProperties(); }

function ss_() {
  var id = props_().getProperty('SHEET_ID'); // only needed if the script is NOT bound to the sheet
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cached_(key, ttl, fn) {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  var data = fn();
  try { cache.put(key, JSON.stringify(data), ttl); } catch (e) { /* >100KB: skip caching */ }
  return data;
}

function clearCache_() { CacheService.getScriptCache().removeAll(CACHE_KEYS); }

function append_(sheetName, row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { ss_().getSheetByName(sheetName).appendRow(row); }
  finally { lock.releaseLock(); }
}

// Trim, cap length, and neutralise spreadsheet formula injection.
function clean_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s) && !/^\+?[0-9 ()\-]+$/.test(s)) s = "'" + s;
  return s;
}

function validEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120; }

// Max `limit` submissions per email per hour per action.
function rateLimited_(email, action, limit) {
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + action + '_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email));
  var n = Number(cache.get(key) || 0);
  if (n >= limit) return true;
  cache.put(key, String(n + 1), 3600);
  return false;
}

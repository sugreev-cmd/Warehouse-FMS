/**
 * ============================================================
 *  WAREHOUSE FMS - PROOF PHOTO UPLOADER
 * ============================================================
 *
 *  This script receives a photo from Warehouse FMS, saves it to
 *  your Google Drive and returns the link back to the app.
 *
 *  Drive structure created automatically:
 *
 *      Warehouse FMS Proofs /
 *          2026-09-04 /
 *              Inbound GRN check__Ramesh__1430.jpg
 *
 *  ------------------------------------------------------------
 *  HOW TO DEPLOY  (one time only)
 *  ------------------------------------------------------------
 *  1. Open script.google.com -> New project
 *  2. Delete the default code and paste this whole file
 *  3. Save -> name the project "Warehouse FMS Proof Uploader"
 *  4. Top right -> Deploy -> New deployment
 *  5. Gear icon -> Web app
 *  6. Execute as     : Me
 *     Who has access : Anyone            <-- this is required
 *  7. Deploy -> Authorize access -> pick your account ->
 *     "Advanced" -> "Go to ... (unsafe)" -> Allow
 *  8. Paste the URL you get into Warehouse FMS -> Settings -> Data
 * ============================================================
 */

var CONFIG = {
  ROOT_FOLDER_NAME: 'Warehouse FMS Proofs',
  DAY_FOLDERS: true,
  MAKE_LINK_VIEWABLE: true
};


function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return out({ success: false, error: 'Empty request' });
    }

    var p = JSON.parse(e.postData.contents);

    if (p.action !== 'uploadProof') {
      return out({ success: false, error: 'Unknown action: ' + p.action });
    }

    var b64 = String(p.imageData || '').replace(/^data:image\/[a-z]+;base64,/i, '');
    if (!b64) return out({ success: false, error: 'No image data received' });

    var bytes = Utilities.base64Decode(b64);
    var name = safeName(p.fileName || ('proof_' + Date.now() + '.jpg'));
    var blob = Utilities.newBlob(bytes, 'image/jpeg', name);

    var folder = targetFolder_(p.dateKey);
    var file = folder.createFile(blob);

    if (p.description) {
      try { file.setDescription(String(p.description).slice(0, 500)); } catch (ignore) {}
    }

    var shared = false;
    if (CONFIG.MAKE_LINK_VIEWABLE) {
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        shared = true;
      } catch (shareErr) {
        shared = false;
      }
    }

    var id = file.getId();
    return out({
      success: true,
      fileId: id,
      viewUrl: 'https://drive.google.com/file/d/' + id + '/view',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600',
      folder: folder.getName(),
      shared: shared
    });

  } catch (err) {
    return out({ success: false, error: String(err && err.message ? err.message : err) });
  }
}


function doGet() {
  return out({
    success: true,
    status: 'Warehouse FMS Proof Uploader is running',
    folder: CONFIG.ROOT_FOLDER_NAME,
    time: new Date().toISOString()
  });
}


function out(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


function targetFolder_(dateKey) {
  var root = getOrCreate_(DriveApp.getRootFolder(), CONFIG.ROOT_FOLDER_NAME);
  if (!CONFIG.DAY_FOLDERS) return root;

  var day = String(dateKey || '').match(/^\d{4}-\d{2}-\d{2}$/)
    ? dateKey
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  return getOrCreate_(root, day);
}


function getOrCreate_(parent, name) {
  var it = parent.getFoldersByName(name);
  while (it.hasNext()) {
    var f = it.next();
    if (!f.isTrashed()) return f;
  }
  return parent.createFolder(name);
}


function safeName(n) {
  return String(n).replace(/[\\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120);
}


/**
 * Run this once from the editor to test - a test file is created in
 * Drive and the result appears in the Execution log.
 */
function runSelfTest() {
  var png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  var res = doPost({
    postData: {
      contents: JSON.stringify({
        action: 'uploadProof',
        imageData: 'data:image/png;base64,' + png,
        fileName: 'SELF_TEST_delete_me.jpg',
        dateKey: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        description: 'Self test'
      })
    }
  });

  Logger.log(res.getContent());
}

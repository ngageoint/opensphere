goog.declareModuleId('os.file.persist');

import {BYTE_ORDER_MARKER} from '../../arraybuf.js';
import * as dispatcher from '../../dispatcher.js';
import {SHARED_DB_VERSION} from '../../os.js';
import OSFile from '../file.js';
import FileStorage from '../filestorage.js';
import {getLocalUrl} from '../index.js';

const GoogEvent = goog.require('goog.events.Event');


/**
 * local file event
 * @type {string}
 */
export const SAVE_COMPLETE = 'local.file.save.complete';

/**
 * local file event
 * @type {string}
 */
export const SAVE_FAILED = 'local.file.save.fail';

/**
 * Static function to save a file, so it can be used without the persistence
 *
 * @param {string} fileName The file name
 * @param {Object|null|string} content The content to save
 * @param {string=} opt_mimeType The mime type of the content
 * @return {boolean} Whether or not the save action was successfull
 */
export const saveFile = function(fileName, content, opt_mimeType) {
  var type = opt_mimeType || 'text/plain;charset=utf-8';

  if (typeof (saveAs) != 'undefined') {
    var list = [];

    if (typeof content === 'string' && content.startsWith('\ufeff')) {
      // Set up us the BOM.
      // \uFEFF is the magic number for "insert byte order mark here". This is the BOM for UTF-8. Yes,
      // \uFEFF is the BOM for UTF-16 and byte order doesn't mean anything in UTF-8. This matches how
      // node.js writes out.
      list.push(new Uint8Array(BYTE_ORDER_MARKER));
      content = content.replace('\ufeff', '');
    }

    list.push(content);
    var blob = new Blob(list, {'type': type});
    saveAs(blob, fileName);
    return true;
  } else if (typeof (saveTextAs) != 'undefined' && typeof content === 'string') {
    // IE9 only supports saving text, thus has a different method
    saveTextAs(content, fileName);
    return true;
  }

  return false;
};

/**
 * Static function to save a file, so it can be used without the persistence
 *
 * @param {string} fileName The file name
 * @param {Object|null|string} content The content to save
 * @param {string=} opt_mimeType The mime type of the content
 * @param {string=} opt_dbStore The local db name to store in
 * @return {boolean} Whether or not the save action was successfull
 */
export const saveLocal = function(fileName, content, opt_mimeType, opt_dbStore) {
  var type = opt_mimeType || 'text/plain;charset=utf-8';
  var file = new OSFile();
  file.setFileName(fileName);
  file.setUrl(getLocalUrl(fileName));
  file.setContent(content);
  file.setContentType(type);

  var fs = new FileStorage(opt_dbStore, SHARED_DB_VERSION);
  fs.setUniqueFileName(file);
  fs.storeFile(file, true).addCallbacks(() => {
    finishImport(file);
  }, onFileError);

  return true;
};

/**
 * @param {OSFile} file
 */
const finishImport = (file) => {
  dispatcher.getInstance().dispatchEvent(new GoogEvent(SAVE_COMPLETE, {'url': file.getUrl()}));
};

/**
 * Handler for file storage error.
 *
 * @param {*} error
 */
const onFileError = (error) => {
  var msg = 'Unable to store state file locally!';
  if (typeof error === 'string') {
    msg += ' ' + error;
  }
  dispatcher.getInstance().dispatchEvent(new GoogEvent(SAVE_FAILED, {'error': msg}));
};

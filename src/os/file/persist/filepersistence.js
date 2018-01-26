goog.provide('os.file.persist.FilePersistence');

goog.require('os.arraybuf');
goog.require('os.ex.IPersistenceMethod');



/**
 * Persistence method to save local files.
 * @implements {os.ex.IPersistenceMethod}
 * @constructor
 */
os.file.persist.FilePersistence = function() {};


/**
 * @inheritDoc
 */
os.file.persist.FilePersistence.prototype.getLabel = function() {
  return 'File';
};


/**
 * @inheritDoc
 */
os.file.persist.FilePersistence.prototype.isSupported = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.file.persist.FilePersistence.prototype.requiresUserAction = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.file.persist.FilePersistence.prototype.save = function(fileName, content, opt_mimeType,
    opt_title, opt_description, opt_tags) {
  return os.file.persist.saveFile(fileName, content, opt_mimeType);
};


/**
 * Static function to save a file, so it can be used without the persistence
 * @param {string} fileName The file name
 * @param {*} content The content to save
 * @param {string=} opt_mimeType The mime type of the content
 * @return {boolean} Whether or not the save action was successfull
 */
os.file.persist.saveFile = function(fileName, content, opt_mimeType) {
  var type = opt_mimeType || 'text/plain;charset=utf-8';

  if (typeof (saveAs) != 'undefined') {
    var list = [];

    if (goog.isString(content) && content.startsWith('\ufeff')) {
      // Set up us the BOM.
      // \uFEFF is the magic number for "insert byte order mark here". This is the BOM for UTF-8. Yes,
      // \uFEFF is the BOM for UTF-16 and byte order doesn't mean anything in UTF-8. This matches how
      // node.js writes out.
      list.push(new Uint8Array(os.arraybuf.BYTE_ORDER_MARKER));
      content = content.replace('\ufeff', '');
    }

    list.push(content);
    var blob = new Blob(list, {'type': type});
    saveAs(blob, fileName);
    return true;
  } else if (typeof (saveTextAs) != 'undefined' && goog.isString(content)) {
    // IE9 only supports saving text, thus has a different method
    saveTextAs(content, fileName);
    return true;
  }

  return false;
};

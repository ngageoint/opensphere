goog.module('os.file.upload');
goog.module.declareLegacyNamespace();

const Promise = goog.requireType('goog.Promise');
const OSFile = goog.requireType('os.file.File');

/**
 * Set to add file upload support to an application. The function should take a `os.file.File` as an argument and return
 * a promise that resolves to the uploaded file URL.
 *
 * @type {?function(OSFile):!Promise<string>}
 */
let uploadFile = null;

/**
 * Get the file upload function.
 * @return {?function(OSFile):!Promise<string>}
 */
const getUploadFile = () => uploadFile;

/**
 * Set the upload file function.
 * @param {?function(OSFile):!Promise<string>} fn The function.
 */
const setUploadFile = (fn) => {
  uploadFile = fn;
};

exports = {
  getUploadFile,
  setUploadFile
};

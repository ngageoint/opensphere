goog.provide('os.file.upload');


/**
 * Set to add file upload support to an application. The function should take a `os.file.File` as an argument and return
 * a promise that resolves to the uploaded file URL.
 *
 * @type {?function(os.file.File):!goog.Promise<string>}
 */
os.file.upload.uploadFile = null;

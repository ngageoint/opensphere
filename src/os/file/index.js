goog.declareModuleId('os.file');

import {ROOT} from '../os.js';
import OSFile from './file.js';
import * as mimeZip from './mime/zip.js';

const Deferred = goog.require('goog.async.Deferred');
const GoogFileReader = goog.require('goog.fs.FileReader');
const {safeLoad} = goog.require('goog.net.jsloader');
const userAgent = goog.require('goog.userAgent');


/**
 * File URL schemes.
 * @enum {string}
 */
export const FileScheme = {
  FILE: 'file',
  LOCAL: 'local'
};

/**
 * If `file://` URL's should be supported by the application. Defaults to false.
 * @type {boolean}
 */
let fileUrlEnabled = false;

/**
 * Get if file URL's are enabled.
 * @return {boolean}
 */
export const isFileUrlEnabled = () => fileUrlEnabled;

/**
 * Set if file URL's are enabled.
 * @param {boolean} value The value.
 */
export const setFileUrlEnabled = (value) => {
  fileUrlEnabled = value;
};

/**
 * @define {string}
 */
export const ZIP_PATH = goog.define('os.file.ZIP_PATH', 'vendor/zip-js');


/**
 * Configure zip.js if it has been loaded.
 * @suppress {checkTypes}
 */
(function() {
  // zip.js definds 'zip' as global var.  If application is not using zip.js, skip this
  if (window.zip) {
    var zipPath = ROOT + ZIP_PATH + '/';
    if (!Modernizr.webworkers) {
      // disable web workers
      zip.useWebWorkers = false;

      // load the inflate/deflate scripts locally
      safeLoad(zipPath + 'inflate.js');
      safeLoad(zipPath + 'deflate.js');
    } else if (!zip.workerScriptsPath) {
      // set the relative path to worker scripts so zip.js can find them. zip.js defaults this value to null, so do
      // not replace the value if one was already set.
      zip.workerScriptsPath = zipPath;
    }
  }
})();



/**
 * Tests if an ArrayBuffer holds ZIP content by looking for the magic number.
 * @param {ArrayBuffer} content
 * @return {boolean}
 * @deprecated Please use mimeZip.isZip() instead.
 */
export const isZipFile = mimeZip.isZip;

/**
 * Creates a new OSFile instance from a system file. The content will be read as a string if it's determined
 * to be text, or an ArrayBuffer if not.
 *
 * @param {!File} file The system file
 * @return {!Deferred} A promise passing the new file instance to the success callback, or the error message
 *   on failure.
 */
export const createFromFile = function(file) {
  var deferred = new Deferred();

  if (file.path && fileUrlEnabled) {
    deferred.callback(createFromContent(file.name, getFileUrl(file.path), file, null));
  } else if (file.size < OSFile.MAX_CONTENT_LEN) {
    var url = getLocalUrl(file.name);
    GoogFileReader.readAsArrayBuffer(file).addCallback(
        createFromContent.bind(undefined, file.name, url, file)).chainDeferred(deferred);
  } else {
    var limit = Math.floor(OSFile.MAX_CONTENT_LEN / 1000000) + 'MB';
    var msg = 'File "' + file.name + '" exceeds the size limit (' + limit + ') and cannot be imported.';
    deferred.errback(msg);
  }

  return deferred;
};

/**
 * Creates a new OSFile instance from the provided parameters, converting ArrayBuffer content to a string
 * if the content is determined to be text.
 *
 * @param {string} fileName The name of the file
 * @param {string} url The URL to the file content
 * @param {File|undefined} originalFile Original file. If included, will be set on the os.file.File
 * @param {?(ArrayBuffer|string)} content The file content
 * @return {!OSFile}
 */
export const createFromContent = function(fileName, url, originalFile, content) {
  var file = new OSFile();
  file.setContent(content);
  file.setFileName(fileName);
  file.setUrl(url);

  if (originalFile) {
    file.setContentType(originalFile.type);
    file.setFile(originalFile);
  }

  return file;
};

/**
 * Creates a `file://` url to reference files on the file system.
 *
 * @param {string} path The path to the file.
 * @return {string}
 */
export const getFileUrl = function(path) {
  if (userAgent.WINDOWS) {
    return FileScheme.FILE + ':///' + path.replace(/\\/g, '/');
  } else {
    return FileScheme.FILE + '://' + path;
  }
};

/**
 * Creates a `local://` url used by file storage.
 *
 * @param {string} fileName The file name to use in generating the url.
 * @return {string}
 */
export const getLocalUrl = function(fileName) {
  return FileScheme.LOCAL + '://' + fileName;
};

/**
 * Checks if a file was loaded from the file system (URL prefixed with `file://`).
 *
 * @param {OSFile|string|undefined} file The file or file's url
 * @return {boolean}
 */
export const isFileSystem = function(file) {
  if (!file) {
    return false;
  }

  var url = typeof file === 'string' ? file : file.getUrl();
  return !!url && url.startsWith(FileScheme.FILE + '://');
};

/**
 * Checks if a file was loaded from file storage (URL prefixed with `local://`).
 *
 * @param {OSFile|string|undefined} file The file or file's url.
 * @return {boolean}
 */
export const isLocal = function(file) {
  if (!file) {
    return false;
  }

  var url = typeof file === 'string' ? file : file.getUrl();
  return !!url && url.startsWith(FileScheme.LOCAL + '://');
};

/**
 * Deserializes a file from a JSON object.
 *
 * @param {*} data The serialized file
 * @return {OSFile}
 */
export const deserializeFile = function(data) {
  var file = null;
  if (data && goog.isObject(data)) {
    file = new OSFile();
    file.restore(data);
  }

  return file;
};

/**
 * Serializes a file to a JSON object.
 *
 * @param {OSFile} file The file to serialize
 * @return {*} The persisted file
 */
export const serializeFile = function(file) {
  return file ? file.persist() : undefined;
};

/**
 * Base file setting key.
 * @type {string}
 */
export const BaseSettingKey = 'os.file';

/**
 * File settings keys.
 * @enum {string}
 */
export const FileSetting = {
  AUTO_SAVE: BaseSettingKey + '.autoSaveFiles'
};

/**
 * Default file setting values.
 * @type {Object<string, *>}
 */
export const FileSettingDefault = {
  [FileSetting.AUTO_SAVE]: false
};

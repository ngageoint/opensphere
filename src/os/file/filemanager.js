goog.declareModuleId('os.file.FileManager');

import {detect, getTypeChain} from './mime.js';
import * as text from './mime/text.js';

const {defaultCompare} = goog.require('goog.array');
const GoogFileReader = goog.require('goog.fs.FileReader');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: IFileMethod} = goog.requireType('os.file.IFileMethod');


/**
 * Keeps a registry of methods for reading a file ({@link IFileMethod})
 */
export default class FileManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Registered file import methods.
     * @type {!Array<!IFileMethod>}
     * @private
     */
    this.fileMethods_ = [];
  }

  /**
   * Gets the highest-priority file method that is supported.
   *
   * @return {?IFileMethod} The highest priority supported method.
   */
  getFileMethod() {
    var method = /** @type {IFileMethod} */ (this.fileMethods_.find(this.isMethodSupported_));
    return method ? method.clone() : null;
  }

  /**
   * Given a content type or layer type hint, return the corresponding layer type.
   *
   * @param {!OSFile} file The file reference.
   * @param {function(?string)} callback Callback when the type is available.
   */
  getContentType(file, callback) {
    var buffer = file.getContent();
    var fileBlob = file.getFile();

    if (!buffer && !fileBlob) {
      var type = file.getType();

      if (!type) {
        log.error(logger,
            'The content or original File instance must be present on the os.file.File for content type ' +
            'detection to work');
      }

      callback(type);
      return;
    }

    if (buffer && typeof buffer === 'string') {
      // convert the string to an ArrayBuffer and continue with the check
      buffer = text.getArrayBuffer(buffer);
    }

    var onComplete = function(type) {
      if (type) {
        var chain = getTypeChain(type);
        if (chain && chain.indexOf(text.TYPE) > -1) {
          file.convertContentToString();
        }

        file.setType(type);
      }

      return type;
    };

    // we are going to read the first 16KB and send that to the mime/content type detection
    if (buffer && buffer instanceof ArrayBuffer) {
      detect(buffer, file).then(onComplete).then(callback);
    } else if (fileBlob instanceof Blob) {
      GoogFileReader.readAsArrayBuffer(fileBlob.slice(0, 16 * 1024)).addCallback(function(buffer) {
        detect(buffer, file).then(onComplete).then(callback);
      });
    } else {
      log.error(logger,
          'Failed to detect content type. The content was not a string or ArrayBuffer.');
    }
  }

  /**
   * Given a content type or layer type hint, return the corresponding layer type.
   * @param {!OSFile} file The file reference.
   * @param {function(?string)} callback Callback when the type is available.
   * @deprecated use os.file.FileManager.prototype.getContentType() instead
   */
  getLayerType(file, callback) {
    this.getContentType(file, callback);
  }

  /**
   * Whether or not there are any registered file methods that are supported.
   *
   * @return {boolean} If at least one file method is supported, false otherwise.
   */
  hasSupportedMethod() {
    return this.fileMethods_.some(this.isMethodSupported_);
  }

  /**
   * Convenience function for array searching/filtering.
   *
   * @param {!(IFileMethod)} method The method.
   * @return {boolean}
   * @private
   */
  isMethodSupported_(method) {
    return method.isSupported();
  }

  /**
   * Register a method for importing a file.
   *
   * @param {!IFileMethod} fileMethod The file import method.
   */
  registerFileMethod(fileMethod) {
    if (!this.fileMethods_.includes(fileMethod)) {
      this.fileMethods_.push(fileMethod);
      this.fileMethods_.sort(this.sortDescPriority_);
    }
  }

  /**
   * Sort file/content type method by descending priority.
   *
   * @param {!IFileMethod} a First method.
   * @param {!IFileMethod} b Second method.
   * @return {number}
   * @private
   */
  sortDescPriority_(a, b) {
    return defaultCompare(b.getPriority(), a.getPriority());
  }

  /**
   * Get the global instance.
   * @return {!FileManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new FileManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {FileManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {FileManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.file.FileManager');

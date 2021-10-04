goog.declareModuleId('os.net.LocalFileHandler');

import FileStorage from '../file/filestorage.js';
import {FileScheme} from '../file/index.js';
import HandlerType from './handlertype.js';

const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('goog.net.EventType');

const {default: OSFile} = goog.requireType('os.file.File');
const {default: IRequestHandler} = goog.requireType('os.net.IRequestHandler');


/**
 * Handler for files in local storage.
 *
 * @implements {IRequestHandler}
 */
export default class LocalFileHandler extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The list of errors
     * @type {?Array.<string>}
     * @protected
     */
    this.errors = null;

    /**
     * The score
     * @type {number}
     * @protected
     */
    this.score = 0;

    /**
     * @type {?goog.async.Deferred}
     * @private
     */
    this.deferred_ = null;

    /**
     * @type {?OSFile}
     * @private
     */
    this.file_ = null;

    this.statusCode = -1;
  }

  /**
   * @inheritDoc
   */
  getErrors() {
    return this.errors;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return this.score;
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    return uri.getScheme() == FileScheme.LOCAL;
  }

  /**
   * @inheritDoc
   */
  buildRequest() {
    // no need
  }

  /**
   * @inheritDoc
   */
  getResponse() {
    return this.file_ ? this.file_.getContent() : null;
  }

  /**
   * @inheritDoc
   */
  getResponseHeaders() {
    return null;
  }

  /**
   * @inheritDoc
   */
  abort() {
    if (this.deferred_) {
      this.deferred_.cancel();
    }
  }

  /**
   * @inheritDoc
   */
  execute(method, uri, opt_headers, opt_formatter, opt_nocache, opt_responseType) {
    this.errors = null;
    this.file_ = null;

    var fs = FileStorage.getInstance();
    var filePath = decodeURIComponent(uri.toString());
    this.deferred_ = fs.getFile(filePath).addCallbacks(this.onFileReady_, this.onFileError_, this);
  }

  /**
   * @param {?OSFile} file
   * @private
   */
  onFileReady_(file) {
    this.deferred_ = null;

    if (file) {
      this.statusCode = 200;
      this.file_ = file;
      this.dispatchEvent(new GoogEvent(EventType.SUCCESS));
    } else {
      this.statusCode = 404;
      this.errors = ['File not found in local storage!'];
      this.dispatchEvent(new GoogEvent(EventType.ERROR));
    }
  }

  /**
   * @param {*} error
   * @private
   */
  onFileError_(error) {
    this.deferred_ = null;
    this.errors = [];

    if (typeof error === 'string') {
      this.statusCode = 400;
      this.errors.push(/** @type {string} */ (error));
    } else {
      this.statusCode = 404;
      this.errors.push('File not found in local storage!');
    }

    this.dispatchEvent(new GoogEvent(EventType.ERROR));
  }

  /**
   * @inheritDoc
   */
  getStatusCode() {
    return this.statusCode;
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return HandlerType.LOCAL;
  }

  /**
   * @inheritDoc
   */
  isHandled() {
    if (this.statusCode && this.statusCode >= 0) {
      return true;
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  getTimeout() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  setTimeout(timeout) {
    // timeout not supported
  }
}

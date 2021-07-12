goog.module('os.ui.file.method.UrlMethod');
goog.module.declareLegacyNamespace();

goog.require('os.ui.file.urlImportDirective');

const dispose = goog.require('goog.dispose');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const NetEventType = goog.require('goog.net.EventType');
const XhrIo = goog.require('goog.net.XhrIo');
const {IE, isVersionOrHigher} = goog.require('goog.userAgent');
const dispatcher = goog.require('os.Dispatcher');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const EventType = goog.require('os.events.EventType');
const {createFromContent} = goog.require('os.file');
const IFileMethod = goog.require('os.file.IFileMethod'); // eslint-disable-line
const Request = goog.require('os.net.Request');
const RequestEvent = goog.require('os.net.RequestEvent');
const RequestEventType = goog.require('os.net.RequestEventType');
const osWindow = goog.require('os.ui.window');

const Logger = goog.requireType('goog.log.Logger');
const OSFile = goog.requireType('os.file.File');


/**
 * @implements {IFileMethod}
 */
class UrlMethod extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The logger
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {OSFile}
     * @private
     */
    this.file_ = null;

    /**
     * @type {Request}
     * @private
     */
    this.request_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.url_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.clearFile();

    dispose(this.request_);
    this.request_ = null;
  }

  /**
   * @return {?string}
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @param {?string} value
   */
  setUrl(value) {
    this.url_ = value;
  }

  /**
   * @inheritDoc
   */
  getPriority() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  isSupported() {
    return true;
  }

  /**
   * @inheritDoc
   */
  getFile() {
    return this.file_;
  }

  /**
   * @inheritDoc
   */
  setFile(file) {
    this.file_ = file;
  }

  /**
   * @inheritDoc
   */
  clearFile() {
    this.file_ = null;
  }

  /**
   * @inheritDoc
   */
  clone() {
    return new this.constructor();
  }

  /**
   * @inheritDoc
   */
  loadFile(opt_options) {
    this.clearFile();

    if (!this.url_) {
      var scopeOptions = {
        'method': this
      };
      var windowOptions = {
        'id': UrlMethod.ID,
        'label': 'Import URL',
        'icon': 'fa fa-cloud-download',
        'x': 'center',
        'y': 'center',
        'width': '400',
        'min-width': '400',
        'max-width': '400',
        'height': 'auto',
        'modal': true,
        'show-close': true
      };
      var template = '<urlimport></urlimport>';
      osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
    } else {
      this.loadUrl();
    }
  }

  /**
   * Loads a file from the provided URL.
   */
  loadUrl() {
    if (!this.url_) {
      log.error(logger, 'URL cannot be null!');
      this.dispatchEvent(EventType.CANCEL);
      return;
    }

    if (this.request_) {
      this.request_.dispose();
      this.request_ = null;
    }

    // if this url contains our app, strip the app portion
    var appIndex = this.url_.lastIndexOf('?file=');
    if (appIndex != -1) {
      this.url_ = this.url_.substring(appIndex + 6);
    }

    this.request_ = new Request(this.url_);
    this.request_.setHeader('Accept', '*/*');

    // use default validators to try to auto-detect specific errors
    this.request_.setUseDefaultValidators(true);

    if (!IE || isVersionOrHigher(10)) {
      // IE9 doesn't support arraybuffer as a response type
      this.request_.setResponseType(XhrIo.ResponseType.ARRAY_BUFFER);
    }

    this.request_.listen(NetEventType.SUCCESS, this.onLoad, false, this);
    this.request_.listen(NetEventType.ERROR, this.onError, false, this);
    this.request_.load();
  }

  /**
   * @param {goog.events.Event} event
   * @protected
   */
  onLoad(event) {
    var url = this.request_.getUri().toString();
    var q = url.indexOf('?');
    var i = url.lastIndexOf('/') + 1;
    var fileName = decodeURI(url.substring(i == -1 ? 0 : i, q == -1 ? url.length : q));
    var headers = this.request_.getResponseHeaders();
    var response = /** @type {!(ArrayBuffer|string)} */ (this.request_.getResponse());

    // There is a header that can be used if it exists instead of the filename
    if (headers) {
      var contentDisposition = /** @type {string|undefined} */ (headers['content-disposition']);
      if (contentDisposition) {
        // Use the value in the content-disposition ex: attachment; filename="Super Awesome Dataz.kmz"
        var re = /filename="(.*?)"/;
        var match = re.exec(contentDisposition);
        if (match && match[1]) {
          fileName = match[1];
        } else { // see if the filename was not in quotes
          var rematch = contentDisposition.split('filename=');
          if (rematch.length > 0 && rematch[1]) {
            fileName = rematch[1];
          }
        }
      }
    }

    this.request_.dispose();
    this.request_ = null;

    this.file_ = createFromContent(fileName, url, undefined, response);

    if (!this.file_.getContentType() && headers) {
      // extract the content-type header if possible
      var contentType = /** @type {string|undefined} */ (headers['content-type']);
      if (contentType) {
        this.file_.setContentType(contentType);
      }
    }

    this.dispatchEvent(EventType.COMPLETE);
    dispatcher.getInstance().dispatchEvent(new RequestEvent(RequestEventType.USER_URL, url));
  }

  /**
   * @param {goog.events.Event} event
   * @protected
   */
  onError(event) {
    const errors = this.request_.getErrors();
    this.request_.dispose();
    this.request_ = null;

    let msg = 'Unable to load the provided URL, please check that it was entered correctly.';
    if (errors.length) {
      // Add server error(s) to the message if available.
      msg += ` The request failed with: ${errors.join(', ')}`;
    }

    // sendAlert is async and we want the log messages in order, so log the error separately.
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR, logger);

    // notify listeners that the load failed
    this.dispatchEvent(EventType.ERROR);
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.method.UrlMethod');

/**
 * @type {string}
 */
UrlMethod.ID = 'urlimport';

exports = UrlMethod;

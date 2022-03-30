goog.declareModuleId('os.source.MultiRequest');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import EventType from '../events/eventtype.js';
import osImplements from '../implements.js';
import ThreadEventType from '../thread/eventtype.js';
import {formatDate} from '../time/time.js';
import IImportSource from './iimportsource.js';
import VectorSource from './vectorsource.js';

const log = goog.require('goog.log');
const NetEventType = goog.require('goog.net.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const {default: IImporter} = goog.requireType('os.im.IImporter');
const {default: Request} = goog.requireType('os.net.Request');


/**
 * Source that loads data with multiple {@link Request}'s.
 *
 * @implements {IImportSource}
 */
export default class MultiRequest extends VectorSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.log = logger;

    /**
     * @type {boolean}
     * @private
     */
    this.loadAsync_ = true;

    /**
     * @type {?IImporter<Feature>}
     * @private
     */
    this.importer_ = null;

    /**
     * @type {number}
     * @private
     */
    this.durationStart_ = 0;

    /**
     * @type {!Array<!Request>}
     * @private
     */
    this.requests_ = [];

    /**
     * @type {Array<*>}
     * @private
     */
    this.responses_ = [];

    /**
     * @type {boolean}
     * @private
     */
    this.useCache_ = true;
  }

  /**
   * @inheritDoc
   */
  clear() {
    this.responses_ = [];

    if (this.importer_) {
      this.importer_.reset();
    }

    super.clear();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.responses_.length = 0;

    this.setRequests([]);
    this.setImporter(null);
  }

  /**
   * Aborts the request.
   */
  abortRequest() {
    if (this.isLoading()) {
      this.setLoading(false);

      for (var i = 0, n = this.requests_.length; i < n; i++) {
        var request = this.requests_[i];
        request.abort();
      }
    }
  }

  /**
   * Loads the request.
   */
  loadRequest() {
    this.abortRequest();

    if (this.requests_.length > 0 && this.isEnabled() && !this.isLocked()) {
      this.durationStart_ = Date.now();
      this.setLoading(true);

      if (this.loadAsync_) {
        for (var i = 0, n = this.requests_.length; i < n; i++) {
          var request = this.requests_[i];
          request.load(!this.useCache_);
        }
      } else {
        this.requests_[0].load(!this.useCache_);
      }
    }
  }

  /**
   * @inheritDoc
   */
  setLocked(value) {
    var old = this.isLocked();
    super.setLocked(value);

    if (old && !value) {
      this.refresh();
    }
  }

  /**
   * @inheritDoc
   */
  refresh() {
    if (this.isEnabled() && !this.isLocked()) {
      if (this.importer_) {
        this.importer_.reset();
      }

      if (this.requests_.length > 0) {
        this.clear();
        this.loadRequest();
      }
    }
  }

  /**
   * @inheritDoc
   */
  getImporter() {
    return this.importer_;
  }

  /**
   * @inheritDoc
   */
  setImporter(importer) {
    if (importer !== this.importer_) {
      if (this.importer_) {
        this.importer_.unlisten(ThreadEventType.PROGRESS, this.onImportProgress, false, this);
        this.importer_.unlisten(EventType.COMPLETE, this.onImportComplete, false, this);

        this.importer_.reset();
      }

      this.importer_ = importer;

      if (this.importer_) {
        this.importer_.listen(ThreadEventType.PROGRESS, this.onImportProgress, false, this);
        this.importer_.listen(EventType.COMPLETE, this.onImportComplete, false, this);
      }
    }
  }

  /**
   * @return {!Array<!Request>}
   */
  getRequests() {
    return this.requests_;
  }

  /**
   * @param {!Array<!Request>} requests
   */
  setRequests(requests) {
    if (this.isLoading()) {
      this.setLoading(false);
    }

    // clean up old requests
    for (var i = 0, n = this.requests_.length; i < n; i++) {
      var request = this.requests_[i];
      request.unlisten(NetEventType.SUCCESS, this.onRequestComplete_, false, this);
      request.unlisten(NetEventType.ERROR, this.onRequestError_, false, this);
      request.dispose();
    }

    this.requests_ = requests;

    // set up new requests
    for (var i = 0, n = this.requests_.length; i < n; i++) {
      var request = this.requests_[i];
      request.listen(NetEventType.SUCCESS, this.onRequestComplete_, false, this);
      request.listen(NetEventType.ERROR, this.onRequestError_, false, this);
    }
  }

  /**
   * Request success handler.
   *
   * @param {GoogEvent} event
   * @private
   */
  onRequestComplete_(event) {
    var req = /** @type {Request} */ (event.target);
    var msg = 'Request complete for ' + this.getTitle() + this.urlLogString(req) + this.durationString();
    log.info(this.log, msg);

    this.responses_.push(req.getResponse());

    // Don't let the request hang on to the response. We want it *gone* from memory
    // as soon as possible after parsing it.
    req.clearResponse();

    if (this.requests_.length == this.responses_.length) {
      // all requests complete - start import
      if (this.importer_) {
        this.importer_.startImport(this.responses_);
        this.responses_ = [];
      } else {
        msg = 'No importer set on source "' + this.getTitle() + '"!';
        log.warning(this.log, msg);
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
        this.setLoading(false);
      }
    } else if (!this.loadAsync_) {
      // load the next request
      this.requests_[this.responses_.length].load(!this.useCache_);
    }
  }

  /**
   * Request error handler.
   *
   * @param {GoogEvent} event
   * @private
   */
  onRequestError_(event) {
    this.abortRequest();
    this.responses_ = [];

    // there was an error loading the request
    var request = /** @type {Request} */ (event.target);
    var msg = 'There was an error loading the data source: ' + request.getErrors().join(' ');
    log.error(this.log, msg);
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
  }

  /**
   * Import progress handler
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onImportProgress(opt_event) {
    if (this.importer_) {
      this.addFeatures(this.importer_.getData());
    }
  }

  /**
   * Import complete handler.
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onImportComplete(opt_event) {
    this.setLoading(false);

    var msg = 'Import complete for ' + this.getTitle() + this.urlLogString() + this.durationString();
    log.info(this.log, msg);
  }

  /**
   * Import error handler.
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onImporterError(opt_event) {
    this.setLoading(false);

    var msg = 'Import completed with errors for ' + this.getTitle() + this.urlLogString();
    log.warning(this.log, msg);
  }

  /**
   * Gets a string representing the duration from the last time durationStart_ was set. Resets durationStart_ for
   * subsequent calls in the same request sequence.
   *
   * @return {string}
   * @protected
   */
  durationString() {
    var now = Date.now();
    var duration = new Date(now - this.durationStart_);
    var durationString = ' in ' + formatDate(duration, 'mm:ss.SSS');
    this.durationStart_ = now;

    return durationString;
  }

  /**
   * Gets a string representing the URLs for all source requests.
   *
   * @param {Request=} opt_request
   * @return {string}
   * @protected
   */
  urlLogString(opt_request) {
    var str = '';
    var uris = [];

    if (opt_request) {
      uris.push(opt_request.getUri().toString());
    } else {
      for (var i = 0, n = this.requests_.length; i < n; i++) {
        var request = this.requests_[i];
        if (request.getUri()) {
          uris.push(request.getUri().toString());
        }
      }
    }

    if (uris.length > 0) {
      str = ' (' + uris.join(', ') + ')';
    }

    return str;
  }

  /**
   * If requests will load asynchronously with respect to one another, or one at a time.
   *
   * @return {boolean}
   */
  getLoadAsync() {
    return this.loadAsync_;
  }

  /**
   * Set if requests will load asynchronously with respect to one another, or one at a time.
   *
   * @param {boolean} value
   */
  setLoadAsync(value) {
    this.loadAsync_ = value;
  }

  /**
   * @return {boolean}
   */
  getUseCache() {
    return this.useCache_;
  }

  /**
   * @param {boolean} value
   */
  setUseCache(value) {
    this.useCache_ = value;
  }
}

osImplements(MultiRequest, IImportSource.ID);

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.source.MultiRequest');

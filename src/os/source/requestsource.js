goog.declareModuleId('os.source.Request');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {registerClass} from '../classregistry.js';
import DataEventType from '../data/event/dataeventtype.js';
import * as dispatcher from '../dispatcher.js';
import EventType from '../events/eventtype.js';
import osImplements from '../implements.js';
import ThreadEventType from '../thread/eventtype.js';
import {formatDate} from '../time/time.js';
import IImportSource from './iimportsource.js';
import SourceClass from './sourceclass.js';
import VectorSource from './vectorsource.js';

const log = goog.require('goog.log');
const NetEventType = goog.require('goog.net.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const {default: IImporter} = goog.requireType('os.im.IImporter');
const {default: NetRequest} = goog.requireType('os.net.Request');


/**
 * Source that loads data with a {@link NetRequest}.
 *
 * @implements {IImportSource}
 */
export default class Request extends VectorSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.log = logger;
    this.refreshEnabled = true;

    /**
     * @type {?IImporter<Feature>}
     * @protected
     */
    this.importer = null;

    /**
     * @type {?NetRequest}
     * @protected
     */
    this.request = null;

    /**
     * @type {number}
     * @protected
     */
    this.durationStart = 0;

    /**
     * @type {boolean}
     * @private
     */
    this.useCache_ = true;

    /**
     * After the initial request, lock the layer
     * @type {boolean}
     * @private
     */
    this.lockAfterQuery_ = false;

    dispatcher.getInstance().listen(DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);
  }

  /**
   * @inheritDoc
   */
  clear() {
    this.abortRequest();

    if (this.importer) {
      this.importer.reset();
    }

    super.clear();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispatcher.getInstance().unlisten(DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);

    this.setRequest(null);
    this.setImporter(null);
  }

  /**
   * Listens for the max features reached event and stops any pending requests
   *
   * @param {GoogEvent} event
   * @private
   */
  onMaxFeaturesReached_(event) {
    this.abortRequest();
  }

  /**
   * Aborts the request.
   */
  abortRequest() {
    if (this.isLoading()) {
      this.setLoading(false);

      if (this.request) {
        this.request.abort();
      }
    }
  }

  /**
   * Loads the request.
   */
  loadRequest() {
    if (this.request && this.isEnabled() && !this.isLocked()) {
      if (this.getFeatureCount() > 50000) {
        this.clear();
      } else {
        this.toClear = this.getFeatures().slice();
      }

      this.abortRequest();
      this.durationStart = Date.now();
      this.setLoading(true);

      try {
        this.request.load(!this.useCache_);
        if (this.lockAfterQuery_) {
          this.setLocked(true);
        }
      } catch (e) {
        var msg = 'There was an error loading the request. Please see the log for more details.';
        this.handleError(msg);
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

    this.setLockAfterQuery(false);
  }

  /**
   * Load and lock, useful when relating layers
   *
   * @param {boolean} value
   */
  setLockAfterQuery(value) {
    this.lockAfterQuery_ = value;
  }

  /**
   * @inheritDoc
   */
  refresh() {
    if (this.isEnabled() && !this.isLocked()) {
      if (this.importer) {
        this.importer.reset();
      }

      if (this.request) {
        this.loadRequest();
      }
    }
  }

  /**
   * @inheritDoc
   */
  getImporter() {
    return this.importer;
  }

  /**
   * @inheritDoc
   */
  setImporter(importer) {
    if (importer !== this.importer) {
      if (this.importer) {
        this.importer.unlisten(ThreadEventType.PROGRESS, this.onImportProgress, false, this);
        this.importer.unlisten(EventType.COMPLETE, this.onImportComplete, false, this);

        this.importer.reset();
      }

      this.importer = importer;

      if (this.importer) {
        this.importer.listen(ThreadEventType.PROGRESS, this.onImportProgress, false, this);
        this.importer.listen(EventType.COMPLETE, this.onImportComplete, false, this);
      }
    }
  }

  /**
   * @return {?NetRequest}
   */
  getRequest() {
    return this.request;
  }

  /**
   * @param {?NetRequest} request
   */
  setRequest(request) {
    if (request !== this.request) {
      if (this.request) {
        this.request.unlisten(NetEventType.SUCCESS, this.onRequestComplete, false, this);
        this.request.unlisten(NetEventType.ERROR, this.onRequestError, false, this);

        if (this.isLoading()) {
          this.setLoading(false);
        }

        this.request.dispose();
      }

      this.request = request;

      if (this.request) {
        this.request.listen(NetEventType.SUCCESS, this.onRequestComplete, false, this);
        this.request.listen(NetEventType.ERROR, this.onRequestError, false, this);
      }
    }
  }

  /**
   * Request success handler.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onRequestComplete(event) {
    var msg = 'Request complete for ' + this.getTitle() + this.urlLogString() + this.durationString();
    log.info(this.log, msg);

    var req = /** @type {NetRequest} */ (event.target);
    var response = /** @type {string} */ (req.getResponse());

    // Don't let the request hang on to the response. We want it *gone* from memory
    // as soon as possible after parsing it.
    req.clearResponse();
    this.doImport(response);
  }

  /**
   * Request error handler.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onRequestError(event) {
    // there was an error loading the request
    var error = this.request.getErrors() ? this.request.getErrors().join(' ') : 'unknown error.';
    var msg = 'There was an error loading the data source: ' + error;
    this.handleError(msg);
  }

  /**
   * Report an error and stop loading the source.
   *
   * @param {string} msg The error message
   * @param {Error=} opt_error The error
   * @protected
   */
  handleError(msg, opt_error) {
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    log.error(this.log, msg, opt_error);
    this.setLoading(false);
  }

  /**
   * Import data from the request.
   *
   * @param {Object|Array|string|Node|Document} data
   * @protected
   */
  doImport(data) {
    if (this.importer) {
      // make sure the loading flag is set before importing, in case this is called outside the request stack
      this.setLoading(true);

      this.importer.startImport(data);
    } else {
      var msg = 'No importer set on source "' + this.getTitle() + '"!';
      this.handleError(msg);
    }
  }

  /**
   * Import progress handler
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onImportProgress(opt_event) {
    if (this.importer) {
      this.addFeatures(this.importer.getData());
    }
  }

  /**
   * Import complete handler.
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onImportComplete(opt_event) {
    // make sure all data has been loaded from the importer
    this.onImportProgress(opt_event);

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
   * Gets a string representing the duration from the last time durationStart was set. Resets durationStart for
   * subsequent calls in the same request sequence.
   *
   * @return {string}
   * @protected
   */
  durationString() {
    var now = Date.now();
    var duration = new Date(now - this.durationStart);
    var durationString = ' in ' + formatDate(duration, 'mm:ss.SSS');
    this.durationStart = now;

    return durationString;
  }

  /**
   * Gets a string representing the URL for the source request.
   *
   * @return {string}
   * @protected
   */
  urlLogString() {
    var str = '';
    if (this.request && this.request.getUri()) {
      str += ' (' + this.request.getUri().toString() + ')';
    }
    return str;
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

osImplements(Request, IImportSource.ID);

/**
 * Class name
 * @type {string}
 * @override
 */
Request.NAME = SourceClass.REQUEST;
registerClass(SourceClass.REQUEST, Request);

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger(SourceClass.REQUEST);

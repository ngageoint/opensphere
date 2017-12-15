goog.provide('os.source.Request');

goog.require('goog.async.Delay');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.event.DataEventType');
goog.require('os.im.IImporter');
goog.require('os.implements');
goog.require('os.registerClass');
goog.require('os.source.IImportSource');
goog.require('os.source.Vector');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');



/**
 * Source that loads data with a {@link os.net.Request}.
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @extends {os.source.Vector}
 * @implements {os.source.IImportSource}
 * @constructor
 */
os.source.Request = function(opt_options) {
  os.source.Request.base(this, 'constructor', opt_options);
  this.log = os.source.Request.LOGGER_;
  this.refreshEnabled = true;

  /**
   * @type {?os.im.IImporter.<ol.Feature>}
   * @protected
   */
  this.importer = null;

  /**
   * @type {?os.net.Request}
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

  os.dispatcher.listen(os.data.event.DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);
};
goog.inherits(os.source.Request, os.source.Vector);
os.implements(os.source.Request, os.source.IImportSource.ID);


/**
 * Class name
 * @type {string}
 * @const
 */
os.source.Request.NAME = 'os.source.Request';
os.registerClass(os.source.Request.NAME, os.source.Request);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.source.Request.LOGGER_ = goog.log.getLogger(os.source.Request.NAME);


/**
 * @inheritDoc
 */
os.source.Request.prototype.clear = function() {
  this.abortRequest();

  if (this.importer) {
    this.importer.reset();
  }

  os.source.Request.base(this, 'clear');
};


/**
 * @inheritDoc
 */
os.source.Request.prototype.disposeInternal = function() {
  os.source.Request.base(this, 'disposeInternal');

  os.dispatcher.unlisten(os.data.event.DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);

  this.setRequest(null);
  this.setImporter(null);
};


/**
 * Listens for the max features reached event and stops any pending requests
 * @param {goog.events.Event} event
 * @private
 */
os.source.Request.prototype.onMaxFeaturesReached_ = function(event) {
  this.abortRequest();
};


/**
 * Aborts the request.
 */
os.source.Request.prototype.abortRequest = function() {
  if (this.isLoading()) {
    this.setLoading(false);

    if (this.request) {
      this.request.abort();
    }
  }
};


/**
 * Loads the request.
 */
os.source.Request.prototype.loadRequest = function() {
  if (this.request && !this.isLocked()) {
    if (this.getFeatureCount() > 50000) {
      this.clear();
    } else {
      this.toClear = this.getFeatures().slice();
    }

    this.abortRequest();
    this.durationStart = goog.now();
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
};


/**
 * @inheritDoc
 */
os.source.Request.prototype.setLocked = function(value) {
  var old = this.isLocked();
  os.source.Request.base(this, 'setLocked', value);

  if (old && !value) {
    this.refresh();
  }

  this.setLockAfterQuery(false);
};


/**
 * Load and lock, useful when relating layers
 * @param {boolean} value
 */
os.source.Request.prototype.setLockAfterQuery = function(value) {
  this.lockAfterQuery_ = value;
};


/**
 * @inheritDoc
 */
os.source.Request.prototype.refresh = function() {
  if (!this.isLocked()) {
    if (this.importer) {
      this.importer.reset();
    }

    if (this.request) {
      this.loadRequest();
    }
  }
};


/**
 * @inheritDoc
 */
os.source.Request.prototype.getImporter = function() {
  return this.importer;
};


/**
 * @inheritDoc
 */
os.source.Request.prototype.setImporter = function(importer) {
  if (importer !== this.importer) {
    if (this.importer) {
      this.importer.unlisten(os.thread.EventType.PROGRESS, this.onImportProgress, false, this);
      this.importer.unlisten(os.events.EventType.COMPLETE, this.onImportComplete, false, this);

      this.importer.reset();
    }

    this.importer = importer;

    if (this.importer) {
      this.importer.listen(os.thread.EventType.PROGRESS, this.onImportProgress, false, this);
      this.importer.listen(os.events.EventType.COMPLETE, this.onImportComplete, false, this);
    }
  }
};


/**
 * @return {?os.net.Request}
 */
os.source.Request.prototype.getRequest = function() {
  return this.request;
};


/**
 * @param {?os.net.Request} request
 */
os.source.Request.prototype.setRequest = function(request) {
  if (request !== this.request) {
    if (this.request) {
      this.request.unlisten(goog.net.EventType.SUCCESS, this.onRequestComplete, false, this);
      this.request.unlisten(goog.net.EventType.ERROR, this.onRequestError, false, this);

      if (this.isLoading()) {
        this.setLoading(false);
      }

      this.request.dispose();
    }

    this.request = request;

    if (this.request) {
      this.request.listen(goog.net.EventType.SUCCESS, this.onRequestComplete, false, this);
      this.request.listen(goog.net.EventType.ERROR, this.onRequestError, false, this);
    }
  }
};


/**
 * Request success handler.
 * @param {goog.events.Event} event
 * @protected
 */
os.source.Request.prototype.onRequestComplete = function(event) {
  var msg = 'Request complete for ' + this.getTitle() + this.urlLogString() + this.durationString();
  goog.log.info(this.log, msg);

  var req = /** @type {os.net.Request} */ (event.target);
  var response = /** @type {string} */ (req.getResponse());

  // Don't let the request hang on to the response. We want it *gone* from memory
  // as soon as possible after parsing it.
  req.clearResponse();
  this.doImport(response);
};


/**
 * Request error handler.
 * @param {goog.events.Event} event
 * @protected
 */
os.source.Request.prototype.onRequestError = function(event) {
  // there was an error loading the request
  var msg = 'There was an error loading the data source: ' + this.request.getErrors().join(' ');
  this.handleError(msg);
};


/**
 * Report an error and stop loading the source.
 * @param {string} msg The error message
 * @param {Error=} opt_error The error
 * @protected
 */
os.source.Request.prototype.handleError = function(msg, opt_error) {
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  goog.log.error(this.log, msg, opt_error);
  this.setLoading(false);
};


/**
 * Import data from the request.
 * @param {Object|Array|string|Node|Document} data
 * @protected
 */
os.source.Request.prototype.doImport = function(data) {
  if (this.importer) {
    // make sure the loading flag is set before importing, in case this is called outside the request stack
    this.setLoading(true);

    this.importer.startImport(data);
  } else {
    var msg = 'No importer set on source "' + this.getTitle() + '"!';
    this.handleError(msg);
  }
};


/**
 * Import progress handler
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.source.Request.prototype.onImportProgress = function(opt_event) {
  if (this.importer) {
    this.addFeatures(this.importer.getData());
  }
};


/**
 * Import complete handler.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.source.Request.prototype.onImportComplete = function(opt_event) {
  // make sure all data has been loaded from the importer
  this.onImportProgress(opt_event);

  this.setLoading(false);

  var msg = 'Import complete for ' + this.getTitle() + this.urlLogString() + this.durationString();
  goog.log.info(this.log, msg);
};


/**
 * Import error handler.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.source.Request.prototype.onImporterError = function(opt_event) {
  this.setLoading(false);

  var msg = 'Import completed with errors for ' + this.getTitle() + this.urlLogString();
  goog.log.warning(this.log, msg);
};


/**
 * Gets a string representing the duration from the last time durationStart was set. Resets durationStart for
 * subsequent calls in the same request sequence.
 * @return {string}
 * @protected
 */
os.source.Request.prototype.durationString = function() {
  var now = goog.now();
  var duration = new Date(now - this.durationStart);
  var durationString = ' in ' + os.time.formatDate(duration, 'mm:ss.SSS');
  this.durationStart = now;

  return durationString;
};


/**
 * Gets a string representing the URL for the source request.
 * @return {string}
 * @protected
 */
os.source.Request.prototype.urlLogString = function() {
  var str = '';
  if (this.request && this.request.getUri()) {
    str += ' (' + this.request.getUri().toString() + ')';
  }
  return str;
};


/**
 * @return {boolean}
 */
os.source.Request.prototype.getUseCache = function() {
  return this.useCache_;
};


/**
 * @param {boolean} value
 */
os.source.Request.prototype.setUseCache = function(value) {
  this.useCache_ = value;
};

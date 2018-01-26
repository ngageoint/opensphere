goog.provide('os.source.MultiRequest');

goog.require('goog.async.Delay');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os.im.IImporter');
goog.require('os.implements');
goog.require('os.source.IImportSource');
goog.require('os.source.Vector');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');



/**
 * Source that loads data with multiple {@link os.net.Request}'s.
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @extends {os.source.Vector}
 * @implements {os.source.IImportSource}
 * @constructor
 */
os.source.MultiRequest = function(opt_options) {
  os.source.MultiRequest.base(this, 'constructor', opt_options);
  this.log = os.source.MultiRequest.LOGGER_;

  /**
   * @type {boolean}
   * @private
   */
  this.loadAsync_ = true;

  /**
   * @type {?os.im.IImporter.<ol.Feature>}
   * @private
   */
  this.importer_ = null;

  /**
   * @type {number}
   * @private
   */
  this.durationStart_ = 0;

  /**
   * @type {!Array.<!os.net.Request>}
   * @private
   */
  this.requests_ = [];

  /**
   * @type {Array.<*>}
   * @private
   */
  this.responses_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.useCache_ = true;
};
goog.inherits(os.source.MultiRequest, os.source.Vector);
os.implements(os.source.MultiRequest, os.source.IImportSource.ID);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.source.MultiRequest.LOGGER_ = goog.log.getLogger('os.source.MultiRequest');


/**
 * @inheritDoc
 */
os.source.MultiRequest.prototype.clear = function() {
  this.responses_ = [];

  if (this.importer_) {
    this.importer_.reset();
  }

  os.source.MultiRequest.superClass_.clear.call(this);
};


/**
 * @inheritDoc
 */
os.source.MultiRequest.prototype.disposeInternal = function() {
  os.source.MultiRequest.base(this, 'disposeInternal');

  this.responses_.length = 0;

  this.setRequests([]);
  this.setImporter(null);
};


/**
 * Aborts the request.
 */
os.source.MultiRequest.prototype.abortRequest = function() {
  if (this.isLoading()) {
    this.setLoading(false);

    for (var i = 0, n = this.requests_.length; i < n; i++) {
      var request = this.requests_[i];
      request.abort();
    }
  }
};


/**
 * Loads the request.
 */
os.source.MultiRequest.prototype.loadRequest = function() {
  this.abortRequest();

  if (this.requests_.length > 0 && !this.isLocked()) {
    this.durationStart_ = goog.now();
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
};


/**
 * @inheritDoc
 */
os.source.MultiRequest.prototype.setLocked = function(value) {
  var old = this.isLocked();
  os.source.MultiRequest.base(this, 'setLocked', value);

  if (old && !value) {
    this.refresh();
  }
};


/**
 * @inheritDoc
 */
os.source.MultiRequest.prototype.refresh = function() {
  if (!this.isLocked()) {
    if (this.importer_) {
      this.importer_.reset();
    }

    if (this.requests_.length > 0) {
      this.clear();
      this.loadRequest();
    }
  }
};


/**
 * @inheritDoc
 */
os.source.MultiRequest.prototype.getImporter = function() {
  return this.importer_;
};


/**
 * @inheritDoc
 */
os.source.MultiRequest.prototype.setImporter = function(importer) {
  if (importer !== this.importer_) {
    if (this.importer_) {
      this.importer_.unlisten(os.thread.EventType.PROGRESS, this.onImportProgress, false, this);
      this.importer_.unlisten(os.events.EventType.COMPLETE, this.onImportComplete, false, this);

      this.importer_.reset();
    }

    this.importer_ = importer;

    if (this.importer_) {
      this.importer_.listen(os.thread.EventType.PROGRESS, this.onImportProgress, false, this);
      this.importer_.listen(os.events.EventType.COMPLETE, this.onImportComplete, false, this);
    }
  }
};


/**
 * @return {!Array.<!os.net.Request>}
 */
os.source.MultiRequest.prototype.getRequests = function() {
  return this.requests_;
};


/**
 * @param {!Array.<!os.net.Request>} requests
 */
os.source.MultiRequest.prototype.setRequests = function(requests) {
  if (this.isLoading()) {
    this.setLoading(false);
  }

  // clean up old requests
  for (var i = 0, n = this.requests_.length; i < n; i++) {
    var request = this.requests_[i];
    request.unlisten(goog.net.EventType.SUCCESS, this.onRequestComplete_, false, this);
    request.unlisten(goog.net.EventType.ERROR, this.onRequestError_, false, this);
    request.dispose();
  }

  this.requests_ = requests;

  // set up new requests
  for (var i = 0, n = this.requests_.length; i < n; i++) {
    var request = this.requests_[i];
    request.listen(goog.net.EventType.SUCCESS, this.onRequestComplete_, false, this);
    request.listen(goog.net.EventType.ERROR, this.onRequestError_, false, this);
  }
};


/**
 * Request success handler.
 * @param {goog.events.Event} event
 * @private
 */
os.source.MultiRequest.prototype.onRequestComplete_ = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  var msg = 'Request complete for ' + this.getTitle() + this.urlLogString(req) + this.durationString();
  goog.log.info(this.log, msg);

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
      goog.log.warning(this.log, msg);
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
      this.setLoading(false);
    }
  } else if (!this.loadAsync_) {
    // load the next request
    this.requests_[this.responses_.length].load(!this.useCache_);
  }
};


/**
 * Request error handler.
 * @param {goog.events.Event} event
 * @private
 */
os.source.MultiRequest.prototype.onRequestError_ = function(event) {
  this.abortRequest();
  this.responses_ = [];

  // there was an error loading the request
  var request = /** @type {os.net.Request} */ (event.target);
  var msg = 'There was an error loading the data source: ' + request.getErrors().join(' ');
  goog.log.error(this.log, msg);
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
};


/**
 * Import progress handler
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.source.MultiRequest.prototype.onImportProgress = function(opt_event) {
  if (this.importer_) {
    this.addFeatures(this.importer_.getData());
  }
};


/**
 * Import complete handler.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.source.MultiRequest.prototype.onImportComplete = function(opt_event) {
  this.setLoading(false);

  var msg = 'Import complete for ' + this.getTitle() + this.urlLogString() + this.durationString();
  goog.log.info(this.log, msg);
};


/**
 * Import error handler.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.source.MultiRequest.prototype.onImporterError = function(opt_event) {
  this.setLoading(false);

  var msg = 'Import completed with errors for ' + this.getTitle() + this.urlLogString();
  goog.log.warning(this.log, msg);
};


/**
 * Gets a string representing the duration from the last time durationStart_ was set. Resets durationStart_ for
 * subsequent calls in the same request sequence.
 * @return {string}
 * @protected
 */
os.source.MultiRequest.prototype.durationString = function() {
  var now = goog.now();
  var duration = new Date(now - this.durationStart_);
  var durationString = ' in ' + os.time.formatDate(duration, 'mm:ss.SSS');
  this.durationStart_ = now;

  return durationString;
};


/**
 * Gets a string representing the URLs for all source requests.
 * @param {os.net.Request=} opt_request
 * @return {string}
 * @protected
 */
os.source.MultiRequest.prototype.urlLogString = function(opt_request) {
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
};


/**
 * If requests will load asynchronously with respect to one another, or one at a time.
 * @return {boolean}
 */
os.source.MultiRequest.prototype.getLoadAsync = function() {
  return this.loadAsync_;
};


/**
 * Set if requests will load asynchronously with respect to one another, or one at a time.
 * @param {boolean} value
 */
os.source.MultiRequest.prototype.setLoadAsync = function(value) {
  this.loadAsync_ = value;
};


/**
 * @return {boolean}
 */
os.source.MultiRequest.prototype.getUseCache = function() {
  return this.useCache_;
};


/**
 * @param {boolean} value
 */
os.source.MultiRequest.prototype.setUseCache = function(value) {
  this.useCache_ = value;
};

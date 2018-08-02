goog.provide('plugin.arc.source.ArcRequestSource');
goog.require('goog.async.Delay');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.event.DataEventType');
goog.require('os.im.IImporter');
goog.require('os.net.Request');
goog.require('os.registerClass');
goog.require('os.source.Request');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');



/**
 * The Arc request source requests the IDs of all of the features in an area. ArcGIS servers will
 * not return more than 1000 features in a single request, so instead, this source chunks its requests
 * out in packs of 1000 by ID in order to complete a single request.
 * @extends {os.source.Request}
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @constructor
 */
plugin.arc.source.ArcRequestSource = function(opt_options) {
  plugin.arc.source.ArcRequestSource.base(this, 'constructor', opt_options);
  this.log = plugin.arc.source.ArcRequestSource.LOGGER_;

  /**
   * @type {!Array<os.net.Request>}
   * @private
   */
  this.idRequests_ = [];

  /**
   * @type {number}
   * @private
   */
  this.loadCount_ = 0;

  // all ArcRequestSources should be lockable
  this.setLockable(true);
};
goog.inherits(plugin.arc.source.ArcRequestSource, os.source.Request);


/**
 * Class name
 * @type {string}
 * @const
 */
plugin.arc.source.ArcRequestSource.NAME = 'plugin.arc.source.ArcRequestSource';
os.registerClass(plugin.arc.source.ArcRequestSource.NAME, plugin.arc.source.ArcRequestSource);


/**
 * @type {number}
 * @const
 */
plugin.arc.source.ArcRequestSource.MAX = 1000;


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.arc.source.ArcRequestSource.LOGGER_ = goog.log.getLogger(plugin.arc.source.ArcRequestSource.NAME);


/**
 * @inheritDoc
 */
plugin.arc.source.ArcRequestSource.prototype.disposeInternal = function() {
  this.disposeIdRequests_();
  plugin.arc.source.ArcRequestSource.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.arc.source.ArcRequestSource.prototype.abortRequest = function() {
  this.disposeIdRequests_();
  plugin.arc.source.ArcRequestSource.base(this, 'abortRequest');
};


/**
 * @inheritDoc
 */
plugin.arc.source.ArcRequestSource.prototype.onRequestComplete = function(event) {
  var msg = 'Request complete for ' + this.getTitle();
  goog.log.info(this.log, msg);

  this.loadCount_ = 0;
  this.disposeIdRequests_();

  var response = /** @type {string} */ (this.request.getResponse());

  try {
    var json = JSON.parse(response);
  } catch (e) {
    this.setLoading(false);
    return;
  }

  var url = this.request.getUri().clone();
  var method = this.request.getMethod();
  var params = url.getQueryData();
  params.remove('geometry');
  params.remove('geometryType');
  params.remove('objectIds');
  params.remove('returnIdsOnly');
  params.remove('time');
  params.remove('where');

  var ids = json['objectIds'];
  var j = null;

  // when no features are found, some arc servers return null, others return an empty array
  if (ids && goog.isArray(ids) && ids.length > 0) {
    for (var i = 0, ii = ids.length; i < ii; i += plugin.arc.source.ArcRequestSource.MAX) {
      j = Math.min(ii, i + plugin.arc.source.ArcRequestSource.MAX);
      params.set('objectIds', ids.slice(i, j).join(','));

      var request = new os.net.Request(url);
      request.setMethod(method);
      request.listen(goog.net.EventType.SUCCESS, this.onIdLoad_, false, this);
      request.listen(goog.net.EventType.ERROR, this.onIdError_, false, this);
      request.load();
      this.idRequests_.push(request);
      this.loadCount_++;
    }
  } else {
    this.setLoading(false);
  }
};


/**
 * Disposes all of the ID requests and clears the list.
 * @private
 */
plugin.arc.source.ArcRequestSource.prototype.disposeIdRequests_ = function() {
  for (var i = 0, ii = this.idRequests_.length; i < ii; i++) {
    var req = this.idRequests_[i];
    goog.dispose(req);
  }

  this.idRequests_ = [];
};


/**
 * Success handler for ID loads.
 * @param {goog.events.Event} event
 * @private
 */
plugin.arc.source.ArcRequestSource.prototype.onIdLoad_ = function(event) {
  this.loadCount_--;

  var request = /** @type {os.net.Request} */ (event.target);
  var response = /** @type {string} */ (request.getResponse());
  goog.dispose(request);

  this.importer.startImport(response);

  if (this.loadCount_ === 0) {
    // nothing else to import
    this.setLoading(false);
  }
};


/**
 * Error handler for ID loads.
 * @param {goog.events.Event} event
 * @private
 */
plugin.arc.source.ArcRequestSource.prototype.onIdError_ = function(event) {
  this.loadCount_--;

  goog.log.error(this.log, 'Error loading IDs for Arc source: ' + this.getTitle());
  var request = /** @type {os.net.Request} */ (event.target);
  goog.dispose(request);

  if (this.loadCount_ === 0) {
    // nothing else to import
    this.setLoading(false);
  }
};

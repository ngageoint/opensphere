goog.provide('os.source.ImportQueue');
goog.require('goog.async.Delay');
goog.require('goog.async.nextTick');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os.events.EventType');
goog.require('os.im.IImporter');
goog.require('os.source.Request');
goog.require('os.thread.EventType');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');



/**
 * A source designed to import one-off data to a source.
 * @extends {os.source.Request}
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @constructor
 */
os.source.ImportQueue = function(opt_options) {
  os.source.ImportQueue.base(this, 'constructor', opt_options);
  this.log = os.source.ImportQueue.LOGGER_;
  this.refreshEnabled = false;

  /**
   * @type {!Array<!(Object|string)>}
   * @private
   */
  this.importQueue_ = [];
};
goog.inherits(os.source.ImportQueue, os.source.Request);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.source.ImportQueue.LOGGER_ = goog.log.getLogger('os.source.ImportQueue');


/**
 * @inheritDoc
 */
os.source.ImportQueue.prototype.abortRequest = function() {
  this.importQueue_.length = 0;
  os.source.ImportQueue.base(this, 'abortRequest');
};


/**
 * @inheritDoc
 */
os.source.ImportQueue.prototype.clear = function() {
  this.importQueue_.length = 0;
  os.source.ImportQueue.base(this, 'clear');
};


/**
 * Queue data for import.
 * @param {!(Object|string)} data
 */
os.source.ImportQueue.prototype.queueData = function(data) {
  this.importQueue_.push(data);

  if (!this.isLoading()) {
    this.durationStart = goog.now();
    this.setLoading(true);
    this.importNext();
  }
};


/**
 * Import the next item in the queue.
 * @protected
 */
os.source.ImportQueue.prototype.importNext = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.importer), 'No importer set on source "' + this.getTitle() + '"!');

  if (this.importQueue_.length > 0) {
    var next = this.importQueue_.shift();
    this.importer.startImport(next);
  } else {
    this.setLoading(false);
  }
};


/**
 * @inheritDoc
 */
os.source.ImportQueue.prototype.onImportComplete = function(opt_event) {
  var msg = 'Import complete for ' + this.getTitle() + this.durationString();
  goog.log.info(this.log, msg);

  // THIN-6757: let the importer finish cleaning up before working on the next item in the queue, or the importer may
  // be reset after the next queue item has been loaded. this causes features to be lost.
  goog.async.nextTick(this.importNext, this);
};


/**
 * @inheritDoc
 */
os.source.ImportQueue.prototype.onImporterError = function(opt_event) {
  var msg = 'Import completed with errors for ' + this.getTitle();
  goog.log.warning(this.log, msg);

  // THIN-6757: let the importer finish cleaning up before working on the next item in the queue, or the importer may
  // be reset after the next queue item has been loaded. this causes features to be lost.
  goog.async.nextTick(this.importNext, this);
};


/**
 * @inheritDoc
 */
os.source.ImportQueue.prototype.getRequest = function() {
  // this source does not have a request
  return null;
};


/**
 * @inheritDoc
 */
os.source.ImportQueue.prototype.setRequest = function(request) {
  // this source does not have a request
};

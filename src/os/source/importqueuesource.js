goog.module('os.source.ImportQueue');
goog.module.declareLegacyNamespace();

const {assert} = goog.require('goog.asserts');
const nextTick = goog.require('goog.async.nextTick');
const log = goog.require('goog.log');
const RequestSource = goog.require('os.source.Request');

const Logger = goog.requireType('goog.log.Logger');


/**
 * A source designed to import one-off data to a source.
 */
class ImportQueue extends RequestSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.log = logger;
    this.refreshEnabled = false;

    /**
     * @type {!Array<!(Object|string)>}
     * @private
     */
    this.importQueue_ = [];
  }

  /**
   * @inheritDoc
   */
  abortRequest() {
    this.importQueue_.length = 0;
    super.abortRequest();
  }

  /**
   * @inheritDoc
   */
  clear() {
    this.importQueue_.length = 0;
    super.clear();
  }

  /**
   * Queue data for import.
   *
   * @param {!(Object|string)} data
   */
  queueData(data) {
    this.importQueue_.push(data);

    if (!this.isLoading()) {
      this.durationStart = Date.now();
      this.setLoading(true);
      this.importNext();
    }
  }

  /**
   * Import the next item in the queue.
   *
   * @protected
   */
  importNext() {
    assert(this.importer != null, 'No importer set on source "' + this.getTitle() + '"!');

    if (this.importQueue_.length > 0) {
      var next = this.importQueue_.shift();
      this.importer.startImport(next);
    } else {
      this.setLoading(false);
    }
  }

  /**
   * @inheritDoc
   */
  onImportComplete(opt_event) {
    var msg = 'Import complete for ' + this.getTitle() + this.durationString();
    log.info(this.log, msg);

    // THIN-6757: let the importer finish cleaning up before working on the next item in the queue, or the importer may
    // be reset after the next queue item has been loaded. this causes features to be lost.
    nextTick(this.importNext, this);
  }

  /**
   * @inheritDoc
   */
  onImporterError(opt_event) {
    var msg = 'Import completed with errors for ' + this.getTitle();
    log.warning(this.log, msg);

    // THIN-6757: let the importer finish cleaning up before working on the next item in the queue, or the importer may
    // be reset after the next queue item has been loaded. this causes features to be lost.
    nextTick(this.importNext, this);
  }

  /**
   * @inheritDoc
   */
  getRequest() {
    // this source does not have a request
    return null;
  }

  /**
   * @inheritDoc
   */
  setRequest(request) {
    // this source does not have a request
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.source.ImportQueue');

exports = ImportQueue;

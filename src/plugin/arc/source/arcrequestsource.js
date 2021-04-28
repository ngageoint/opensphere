goog.module('plugin.arc.source.ArcRequestSource');

const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const Request = goog.require('os.net.Request');
const registerClass = goog.require('os.registerClass');
const RequestSource = goog.require('os.source.Request');

const Logger = goog.requireType('goog.log.Logger');


/**
 * The Arc request source requests the IDs of all of the features in an area. ArcGIS servers will
 * not return more than 1000 features in a single request, so instead, this source chunks its requests
 * out in packs of 1000 by ID in order to complete a single request.
 */
class ArcRequestSource extends RequestSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.log = logger;

    /**
     * @type {!Array<Request>}
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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.disposeIdRequests_();
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  abortRequest() {
    this.disposeIdRequests_();
    super.abortRequest();
  }

  /**
   * @inheritDoc
   */
  onRequestComplete(event) {
    var msg = 'Request complete for ' + this.getTitle();
    log.info(this.log, msg);

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
    if (ids && Array.isArray(ids) && ids.length > 0) {
      for (var i = 0, ii = ids.length; i < ii; i += ArcRequestSource.MAX) {
        j = Math.min(ii, i + ArcRequestSource.MAX);
        params.set('objectIds', ids.slice(i, j).join(','));

        var request = new Request(url);
        request.setMethod(method);
        request.listen(EventType.SUCCESS, this.onIdLoad_, false, this);
        request.listen(EventType.ERROR, this.onIdError_, false, this);
        request.load();
        this.idRequests_.push(request);
        this.loadCount_++;
      }
    } else {
      this.setLoading(false);
    }
  }

  /**
   * Disposes all of the ID requests and clears the list.
   *
   * @private
   */
  disposeIdRequests_() {
    for (var i = 0, ii = this.idRequests_.length; i < ii; i++) {
      var req = this.idRequests_[i];
      dispose(req);
    }

    this.idRequests_ = [];
  }

  /**
   * Success handler for ID loads.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onIdLoad_(event) {
    this.loadCount_--;

    var request = /** @type {Request} */ (event.target);
    var response = /** @type {string} */ (request.getResponse());
    dispose(request);

    this.importer.startImport(response);

    if (this.loadCount_ === 0) {
      // nothing else to import
      this.setLoading(false);
    }
  }

  /**
   * Error handler for ID loads.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onIdError_(event) {
    this.loadCount_--;

    log.error(this.log, 'Error loading IDs for Arc source: ' + this.getTitle());
    var request = /** @type {Request} */ (event.target);
    dispose(request);

    if (this.loadCount_ === 0) {
      // nothing else to import
      this.setLoading(false);
    }
  }
}


/**
 * Class name
 * @type {string}
 */
const className = 'plugin.arc.source.ArcRequestSource';
registerClass(className, ArcRequestSource);


/**
 * @type {number}
 * @const
 */
ArcRequestSource.MAX = 1000;


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger(className);


exports = ArcRequestSource;

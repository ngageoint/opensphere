goog.module('os.metrics.GraphiteMetricsProvider');

const Timer = goog.require('goog.Timer');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const {getSettings} = goog.require('os.config.instance');
const Request = goog.require('os.net.Request');
const GoogEvent = goog.requireType('goog.events.Event');

const Logger = goog.requireType('goog.log.Logger');
const IMetricServiceProvider = goog.requireType('os.metrics.IMetricServiceProvider');
const IDataFormatter = goog.requireType('os.net.IDataFormatter');


/**
 * Metric service provider for graphite/grafana
 *
 * @implements {IMetricServiceProvider}
 * @implements {IDataFormatter}
 */
class GraphiteMetricsProvider {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * The logger.
     * @type {Logger}
     * @private
     */
    this.log_ = logger;

    /**
     * Array of metrics to push to graphite when the timer expires
     * @type {Array}
     * @private
     */
    this.metrics_ = [];

    /**
     * URL to post metrics
     * @type {string}
     * @private
     */
    this.metricUrl_ = /** @type {string} */ (getSettings().get(['metrics', 'baseUrl']));

    /**
     * How often to send metrics, graphite refreshes every minute
     * @type {number}
     * @private
     */
    this.interval_ = /** @type {number} */ (getSettings().get(['metrics', 'interval'], 60000));

    /**
     * The number of times we have failed (in succession) to send metrics
     * @type {number}
     * @private
     */
    this.failures_ = 0;

    /**
     * Send metrics on tick
     * @type {?Timer}
     * @private
     */
    this.timer_ = new Timer(this.interval_);
    this.timer_.listen(Timer.TICK, this.onTimer_, false, this);
    this.timer_.start();
  }

  /**
   * @inheritDoc
   */
  recordMetric(key, value) {
    // add the metric to our queue
    if (this.timer_.enabled) {
      var metric = {'name': key, 'value': value};
      this.metrics_.push(metric);
    }
  }

  /**
   * @inheritDoc
   */
  getContentType() {
    return 'application/json';
  }

  /**
   * @inheritDoc
   */
  format(uri) {
    // merge our json array into a single json object
    return JSON.stringify(this.metrics_);
  }

  /**
   * Publish metrics to the server - viewable in graphite
   *
   * @private
   */
  onTimer_() {
    if (this.metricUrl_ && this.metrics_.length > 0) {
      var request = new Request();
      request.setUri(this.metricUrl_);
      request.setMethod(Request.METHOD_POST);
      request.setDataFormatter(this);
      request.setHeader('Accept', 'application/json, text/plain, */*');
      request.listen(EventType.SUCCESS, this.onSuccess_, false, this);
      request.listen(EventType.ERROR, this.onError_, false, this);
      request.load();
    }
  }

  /**
   * Publish metrics to server without waiting for the timer
   */
  publish() {
    this.onTimer_();
  }

  /**
   * Handles request complete
   *
   * @param {GoogEvent} e
   * @private
   */
  onSuccess_(e) {
    // metrics sent, reset
    this.metrics_ = [];
    this.failures_ = 0;
  }

  /**
   * Handles request error
   *
   * @param {GoogEvent} e
   * @private
   */
  onError_(e) {
    log.error(this.log_, 'Failed to send metrics to server - ' + this.metricUrl_);
    this.failures_ += 1;
    if (this.failures_ >= 3) {
      log.error(this.log_, 'Metrics will not be sent to server, too many failures.');
      this.timer_.stop();
      this.metrics_ = [];
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.metrics.GraphiteMetricsProvider');

exports = GraphiteMetricsProvider;

goog.provide('os.metrics.GraphiteMetricsProvider');
goog.require('goog.Timer');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('os.config.Settings');
goog.require('os.metrics.IMetricServiceProvider');
goog.require('os.net.IDataFormatter');
goog.require('os.net.Request');
goog.require('os.plugin.IPlugin');



/**
 * Metric service provider for graphite/grafana
 * @implements {os.metrics.IMetricServiceProvider}
 * @implements {os.net.IDataFormatter}
 * @constructor
 */
os.metrics.GraphiteMetricsProvider = function() {
  /**
   * The logger.
   * @type {goog.log.Logger}
   * @private
   */
  this.log_ = os.metrics.GraphiteMetricsProvider.LOGGER_;

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
  this.metricUrl_ = /** @type {string} */ (os.settings.get(['metrics', 'baseUrl']));

  /**
   * How often to send metrics, graphite refreshes every minute
   * @type {number}
   * @private
   */
  this.interval_ = /** @type {number} */ (os.settings.get(['metrics', 'interval'], 60000));

  /**
   * The number of times we have failed (in succession) to send metrics
   * @type {number}
   * @private
   */
  this.failures_ = 0;

  /**
   * Send metrics on tick
   * @type {?goog.Timer}
   * @private
   */
  this.timer_ = new goog.Timer(this.interval_);
  this.timer_.listen(goog.Timer.TICK, this.onTimer_, false, this);
  this.timer_.start();
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.metrics.GraphiteMetricsProvider.LOGGER_ = goog.log.getLogger('os.metrics.GraphiteMetricsProvider');


/**
 * @inheritDoc
 */
os.metrics.GraphiteMetricsProvider.prototype.recordMetric = function(key, value) {
  // add the metric to our queue
  if (this.timer_.enabled) {
    var metric = {'name': key, 'value': value};
    this.metrics_.push(metric);
  }
};


/**
 * @inheritDoc
 */
os.metrics.GraphiteMetricsProvider.prototype.getContentType = function() {
  return 'application/json';
};


/**
 * @inheritDoc
 */
os.metrics.GraphiteMetricsProvider.prototype.format = function(uri) {
  // merge our json array into a single json object
  return JSON.stringify(this.metrics_);
};


/**
 * Publish metrics to the server - viewable in graphite
 * @private
 */
os.metrics.GraphiteMetricsProvider.prototype.onTimer_ = function() {
  if (this.metricUrl_ && this.metrics_.length > 0) {
    var request = new os.net.Request();
    request.setUri(this.metricUrl_);
    request.setMethod(os.net.Request.METHOD_POST);
    request.setDataFormatter(this);
    request.setHeader('Accept', 'application/json, text/plain, */*');
    request.listen(goog.net.EventType.SUCCESS, this.onSuccess_, false, this);
    request.listen(goog.net.EventType.ERROR, this.onError_, false, this);
    request.load();
  }
};

/**
 * Publish metrics to server without waiting for the timer
 */
os.metrics.GraphiteMetricsProvider.prototype.publish = function() {
  this.onTimer_();
};


/**
 * Handles request complete
 * @param {goog.events.Event} e
 * @private
 */
os.metrics.GraphiteMetricsProvider.prototype.onSuccess_ = function(e) {
  // metrics sent, reset
  this.metrics_ = [];
  this.failures_ = 0;
};


/**
 * Handles request error
 * @param {goog.events.Event} e
 * @private
 */
os.metrics.GraphiteMetricsProvider.prototype.onError_ = function(e) {
  goog.log.error(this.log_, 'Failed to send metrics to server - ' + this.metricUrl_);
  this.failures_ += 1;
  if (this.failures_ >= 3) {
    goog.log.error(this.log_, 'Metrics will not be sent to server, too many failures.');
    this.timer_.stop();
    this.metrics_ = [];
  }
};

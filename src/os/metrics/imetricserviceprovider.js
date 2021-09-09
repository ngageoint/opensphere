goog.module('os.metrics.IMetricServiceProvider');

/**
 * Interface for sending metic date to metric service provider,
 * like Graphite/Grafana.
 *
 * @interface
 */
class IMetricServiceProvider {
  /**
   * Records a specifc metric.
   * @param {?string} key metric key
   * @param {?number} value metric value
   */
  recordMetric(key, value) {}
}

exports = IMetricServiceProvider;

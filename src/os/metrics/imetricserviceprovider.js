goog.provide('os.metrics.IMetricServiceProvider');



/**
 * Interface for sending metic date to metric service provider,
 * like Graphite/Grafana.
 * @interface
 */
os.metrics.IMetricServiceProvider = function() {};


/**
 * Records a specifc metric.
 * @param {?string} key metric key
 * @param {?number} value metric value
 */
os.metrics.IMetricServiceProvider.prototype.recordMetric;

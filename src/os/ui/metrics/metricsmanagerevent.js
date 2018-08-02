goog.provide('os.ui.metrics.MetricsManagerEvent');
goog.provide('os.ui.metrics.MetricsManagerEventType');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.ui.metrics.MetricsManagerEventType = {
  METRIC_CHANGE: 'metricsmanager:selectedchange',
  METRIC_ADDED: 'metricsmanager:pluginadded'
};



/**
 * @param {string} type
 * @param {os.ui.metrics.MetricsPlugin=} opt_plugin
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.metrics.MetricsManagerEvent = function(type, opt_plugin) {
  os.ui.metrics.MetricsManagerEvent.base(this, 'constructor', type);

  /**
   * @type {os.ui.metrics.MetricsPlugin}
   */
  this.plugin = opt_plugin || null;
};
goog.inherits(os.ui.metrics.MetricsManagerEvent, goog.events.Event);



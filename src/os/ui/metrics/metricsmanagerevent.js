goog.declareModuleId('os.ui.metrics.MetricsManagerEvent');

const GoogEvent = goog.require('goog.events.Event');
const {default: MetricsPlugin} = goog.requireType('os.ui.metrics.MetricsPlugin');


/**
 */
export default class MetricsManagerEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {MetricsPlugin=} opt_plugin
   */
  constructor(type, opt_plugin) {
    super(type);

    /**
     * @type {MetricsPlugin}
     */
    this.plugin = opt_plugin || null;
  }
}

goog.declareModuleId('plugin.cookbook_metrics');

import OSMetrics from 'opensphere/src/os/metrics/metrics.js';

/**
 * @type {string}
 */
export const ID = 'cookbook_metrics';

/**
 * @type {string}
 */
export const MYGROUP = 'Cookbook Group';

/**
 * Our event types
 * @enum {string}
 */
export const EventType = {
  DO_SOMETHING: 'cookbook:do_y',
  DO_ANOTHER_THING: 'cookbook:do_x'
};

export const Metrics = {
  FIRST_THING: 'Metric for First Item',
  SECOND_THING: 'Metric for Second Item',
  EXTRA_THING: 'Metric for programmatic item'
};

/**
 * Process a menu item
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
export const handleItem = function(event) {
  alert('item selected:' + event.type);
  OSMetrics.getInstance().updateMetric(Metrics.EXTRA_THING, 1);
};

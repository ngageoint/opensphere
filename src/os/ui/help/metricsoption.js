goog.declareModuleId('os.ui.help.metricsOption');

import {MENU, showWindow} from './help.js';
import EventType from './helpeventtype.js';

const Settings = goog.require('os.config.Settings');


/**
 * Add the What's New link
 */
export const addToNav = function() {
  if (Settings.getInstance().get('metrics.enabled', false)) {
    var menu = MENU;
    menu.getRoot().addChild({
      eventType: EventType.CAPABILITIES,
      label: '{APP} Capabilities',
      tooltip: 'Display the {APP} Capabilities',
      icons: ['<i class="fa fa-fw fa-cubes"></i>'],
      sort: 135
    });
    menu.listen(EventType.CAPABILITIES, showMetricsWindow);
  }
};

/**
 * Show the metrics window.
 */
const showMetricsWindow = function() {
  showWindow('metrics');
};

goog.module('os.ui.help.metricsOption');
goog.module.declareLegacyNamespace();

const Settings = goog.require('os.config.Settings');
const {MENU, showWindow} = goog.require('os.ui.help');
const EventType = goog.require('os.ui.help.EventType');


/**
 * Add the What's New link
 */
const addToNav = function() {
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

exports = {
  addToNav
};

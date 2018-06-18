goog.provide('os.ui.help.metricsOption');

goog.require('os.ui.help');


/**
 * Add the What's New link
 */
os.ui.help.metricsOption.addToNav = function() {
  if (os.settings.get('metrics.enabled', false)) {
    var menu = os.ui.help.MENU;
    menu.getRoot().addChild({
      eventType: os.ui.help.EventType.CAPABILITIES,
      label: '{APP} Capabilities',
      tooltip: 'Display the {APP} Capabilities',
      icons: ['<i class="fa fa-fw fa-cubes"></i>'],
      sort: 135
    });
    menu.listen(os.ui.help.EventType.CAPABILITIES, os.ui.help.showMetricsWindow_, false, this);
  }
};


/**
 * Show the metrics window.
 * @private
 */
os.ui.help.showMetricsWindow_ = function() {
  os.ui.help.showWindow('metrics');
};

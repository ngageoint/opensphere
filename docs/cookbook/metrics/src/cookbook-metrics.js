goog.provide('plugin.cookbook_metrics.CookbookMetrics');
goog.provide('plugin.cookbook_metrics.Metrics');

goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');
goog.require('os.ui.metrics.MetricsManager');
goog.require('os.ui.metrics.MetricsPlugin');

plugin.cookbook_metrics.metrics = {
  FIRST_THING: 'Metric for First Item',
  SECOND_THING: 'Metric for Second Item',
  EXTRA_THING: 'Metric for programmatic item'
};
/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
plugin.cookbook_metrics.Metrics = function() {
  plugin.cookbook_metrics.Metrics.base(this, 'constructor');

  this.setLabel('Cookbook');
  this.setIcon('fa fa-book');
  this.setCollapsed(true);
  this.setDescription('Plugin for metrics example.');

  var leaf = this.getLeafNode();
  this.addChild(leaf, {
    label: 'First Metric Item',
    description: 'This is an item.',
    key: plugin.cookbook_metrics.metrics.FIRST_THING
  });

  this.addChild(leaf, {
    label: 'Second Metric Item',
    description: 'Does something.',
    key: plugin.cookbook_metrics.metrics.SECOND_THING
  });

  this.addChild(leaf, {
    label: 'Third Metric Item',
    description: 'Combination, programmatic.',
    key: plugin.cookbook_metrics.metrics.EXTRA_THING
  });
};

goog.inherits(plugin.cookbook_metrics.Metrics, os.ui.metrics.MetricsPlugin);

/**
 * Cookbook example of metrics
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cookbook_metrics.CookbookMetrics = function() {
  plugin.cookbook_metrics.CookbookMetrics.base(this, 'constructor');
  this.id = plugin.cookbook_metrics.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.cookbook_metrics.CookbookMetrics, os.plugin.AbstractPlugin);

/**
 * @type {string}
 * @const
 */
plugin.cookbook_metrics.ID = 'cookbook_metrics';

/**
 * @type {string}
 * @const
 */
plugin.cookbook_metrics.MYGROUP = 'Cookbook Group';

/**
 * Our event types
 * @enum {string}
 */
plugin.cookbook_metrics.EventType = {
  DO_SOMETHING: 'cookbook:do_y',
  DO_ANOTHER_THING: 'cookbook:do_x'
};


/**
 * @inheritDoc
 */
plugin.cookbook_metrics.CookbookMetrics.prototype.init = function() {
  var metricsManager = os.ui.metrics.MetricsManager.getInstance();
  metricsManager.addMetricsPlugin(new plugin.cookbook_metrics.Metrics());

  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(plugin.cookbook_metrics.MYGROUP);
    if (!group) {
      group = root.addChild({
        type: os.ui.menu.MenuItemType.GROUP,
        label: plugin.cookbook_metrics.MYGROUP,
        tooltip: 'Added by cookbook metrics example',
      });
      group.addChild({
        type: os.ui.menu.MenuItemType.ITEM,
        eventType: plugin.cookbook_metrics.EventType.DO_ANOTHER_THING,
        label: 'Item 1',
        metricKey: plugin.cookbook_metrics.metrics.FIRST_THING,
        handler: plugin.cookbook_metrics.handleItem
      });
      group.addChild({
        type: os.ui.menu.MenuItemType.ITEM,
        eventType: plugin.cookbook_metrics.EventType.DO_SOMETHING,
        label: 'Item 2',
        metricKey: plugin.cookbook_metrics.metrics.SECOND_THING,
        handler: plugin.cookbook_metrics.handleItem
      });
    }
  }
};

/**
 * Process a menu item
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
plugin.cookbook_metrics.handleItem = function(event) {
  alert('item selected:' + event.type);
  os.metrics.Metrics.getInstance().updateMetric(plugin.cookbook_metrics.metrics.EXTRA_THING, 1);
};

// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.cookbook_metrics.CookbookMetrics());




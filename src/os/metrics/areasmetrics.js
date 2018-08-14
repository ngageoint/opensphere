goog.provide('os.metrics.AreasMetrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');


/**
 * Areas metrics
 * @enum {string}
 */
os.metrics.keys.Areas = {
  TODO: 'Areas.toDo'
};



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.AreasMetrics = function() {
  os.metrics.AreasMetrics.base(this, 'constructor');

  this.setLabel('Areas');
  this.setDescription('Areas description');
  this.setTags(['TODO']);
  this.setIcon('fa fa-question');
  this.setCollapsed(true);

  // manually build the tree
  var leaf = this.getLeafNode();
  this.addChild(leaf, {
    label: 'Need to add a metric for this..??',
    description: 'TODO',
    key: os.metrics.keys.Areas.TODO
  });
};
goog.inherits(os.metrics.AreasMetrics, os.ui.metrics.MetricsPlugin);

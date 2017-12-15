goog.provide('os.metrics.AddDataMetrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.AddDataMetrics = function() {
  os.metrics.AddDataMetrics.base(this, 'constructor');

  this.setLabel('Add Data');
  this.setDescription('The Add Data window allows' +
      ' both feature and imagery data from an expanding pool of data providers to be added to the map.');
  this.setTags(['data', 'providers', 'search']);
  this.setIcon('fa fa-plus');
  this.setCollapsed(true);

  // manually build the tree
  var leaf = this.getLeafNode();

  this.addChild(leaf, {
    label: 'Open',
    description: 'Open Add Data window.',
    key: os.metrics.keys.AddData.OPEN
  });
  this.addChild(leaf, {
    label: 'Add Data',
    icon: 'fa fa-plus green-icon',
    description: 'Add a data layer to the map.',
    key: os.metrics.keys.AddData.ADD_LAYER_COMMAND
  });
  this.addChild(leaf, {
    label: 'Remove Data',
    icon: 'fa fa-plus green-icon',
    description: 'Remove a data layer from the map',
    key: os.metrics.keys.AddData.REMOVE_LAYER_COMMAND
  });
  this.addChild(leaf, {
    label: 'Search',
    description: 'Perform a search through the available data layers.',
    key: os.metrics.keys.AddData.SEARCH
  });
  this.addChild(leaf, {
    label: 'Group By',
    description: 'Group the available data layers by a facet.',
    key: os.metrics.keys.AddData.GROUP_BY
  });
  this.addChild(leaf, {
    label: 'Open File/URL',
    description: 'Import data from a local file or URL.',
    key: os.metrics.keys.AddData.IMPORT
  });
  this.addChild(leaf, {
    label: 'View Layer Info',
    description: 'Click on a layer to see information about it.',
    key: os.metrics.keys.AddData.GET_INFO
  });
};
goog.inherits(os.metrics.AddDataMetrics, os.ui.metrics.MetricsPlugin);

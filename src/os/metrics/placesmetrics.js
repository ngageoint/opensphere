goog.provide('os.metrics.PlacesMetrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.PlacesMetrics = function() {
  os.metrics.PlacesMetrics.base(this, 'constructor');

  this.setLabel('Places');
  // this.setDescription('Places description');
  // this.setTags(['TODO']);
  this.setIcon('fa fa-circle-o');
  this.setCollapsed(true);

  // manually build the tree
  var leaf = this.getLeafNode();
  this.addChild(leaf, {
    label: 'Add Place',
    description: 'Add a Place to your Places list.',
    key: os.metrics.Places.ADD_PLACE
  });
  this.addChild(leaf, {
    label: 'Add Folder',
    description: 'Add a folder to your Places list.',
    key: os.metrics.Places.ADD_FOLDER
  });
  this.addChild(leaf, {
    label: 'Export',
    description: 'Export your Places list.',
    key: os.metrics.Places.EXPORT
  });
  this.addChild(leaf, {
    label: 'Expand All',
    description: 'Click the expand all button on your Places list.',
    key: os.metrics.Places.EXPAND_ALL
  });
  this.addChild(leaf, {
    label: 'Collapse All',
    description: 'Click the collapse all button on your Places list.',
    key: os.metrics.Places.COLLAPSE_ALL
  });

  // context menu
  var contextMenu = this.addChild(leaf, {
    label: 'Places Context Menu'
  });

  this.addChild(contextMenu, {
    label: 'Edit Folder',
    description: 'Edit a Places folder.',
    key: os.metrics.Places.EDIT_FOLDER
  });
  this.addChild(contextMenu, {
    label: 'Edit Place',
    description: 'Edit a Place.',
    key: os.metrics.Places.EDIT_PLACEMARK
  });
  this.addChild(contextMenu, {
    label: 'Export Node',
    description: 'Export a Place or a folder from the Places list.',
    key: os.metrics.Places.EXPORT_CONTEXT
  });
};
goog.inherits(os.metrics.PlacesMetrics, os.ui.metrics.MetricsPlugin);

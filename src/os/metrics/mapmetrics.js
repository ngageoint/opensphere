goog.provide('os.metrics.MapMetrics');
goog.require('os.metrics');
goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.MapMetrics = function() {
  os.metrics.MapMetrics.base(this, 'constructor');

  this.setLabel('Map');
  this.setDescription('Start application in 2D or 3D mode');
  this.setTags(['2D', '3D', 'Dimension']);
  this.setIcon('fa fa-globe');
  this.setCollapsed(true);
  // this.setUI('MapMetrics');

  // manually build the tree
  var leaf = this.getLeafNode();
  this.addChild(leaf, {
    label: '2D Mode',
    key: os.metrics.keys.Map.MODE_2D
  });
  this.addChild(leaf, {
    label: '3D Mode',
    key: os.metrics.keys.Map.MODE_3D
  });
  this.addChild(leaf, {
    label: 'Save State',
    key: os.metrics.keys.Map.SAVE_STATE
  });
  this.addChild(leaf, {
    label: 'Import State',
    key: os.metrics.keys.Map.IMPORT_STATE
  });
  this.addChild(leaf, {
    label: 'Clear State',
    key: os.metrics.keys.Map.CLEAR_STATE
  });
  this.addChild(leaf, {
    label: 'Save Screen Shot',
    key: os.metrics.keys.Map.SCREEN_CAPTURE
  });
  this.addChild(leaf, {
    label: 'Draw',
    key: os.metrics.keys.Map.DRAW
  });
  this.addChild(leaf, {
    label: 'Measure',
    key: os.metrics.keys.Map.MEASURE_TOGGLE
  });
  this.addChild(leaf, {
    label: 'Show Legend',
    key: os.metrics.keys.Map.SHOW_LEGEND
  });
  this.addChild(leaf, {
    label: 'Show Layer Window',
    key: os.metrics.keys.Map.SHOW_LAYER_WINDOW
  });

  var contextMenu = this.addChild(leaf, {
    label: 'Context Menu'
  });
  this.addChild(contextMenu, {
    label: 'Reset View',
    key: os.metrics.keys.Map.RESET_VIEW
  });
  this.addChild(contextMenu, {
    label: 'Reset Rotation',
    key: os.metrics.keys.Map.RESET_ROTATION
  });
  this.addChild(contextMenu, {
    label: 'Toggle 2D/3D View',
    key: os.metrics.keys.Map.TOGGLE_MODE
  });
  this.addChild(contextMenu, {
    label: 'Show Legend',
    key: os.metrics.keys.Map.SHOW_LEGEND_CONTEXT
  });
  this.addChild(contextMenu, {
    label: 'Clear Selection',
    key: os.metrics.keys.Map.CLEAR_SELECTION
  });
  this.addChild(contextMenu, {
    label: 'Set Background Color',
    key: os.metrics.keys.Map.BACKGROUND_COLOR
  });

  var unitsMenu = this.addChild(leaf, {
    label: 'Units Menu'
  });
  this.addChild(unitsMenu, {
    label: 'Use Imperial Units',
    key: os.metrics.keys.Map.UNITS_IMPERIAL
  });
  this.addChild(unitsMenu, {
    label: 'Use Metric Units',
    key: os.metrics.keys.Map.UNITS_METRIC
  });
  this.addChild(unitsMenu, {
    label: 'Use Nautical Units',
    key: os.metrics.keys.Map.UNITS_NAUTICAL
  });
  this.addChild(unitsMenu, {
    label: 'Use Miles Only Units',
    key: os.metrics.keys.Map.UNITS_MILE
  });
  this.addChild(unitsMenu, {
    label: 'Use Nautical Miles Only Units',
    key: os.metrics.keys.Map.UNITS_NAUTICALMILE
  });
  this.addChild(unitsMenu, {
    label: 'Use Yards Only Units',
    key: os.metrics.keys.Map.UNITS_YARD
  });
  this.addChild(unitsMenu, {
    label: 'Use Feet Only Units',
    key: os.metrics.keys.Map.UNITS_FEET
  });
};
goog.inherits(os.metrics.MapMetrics, os.ui.metrics.MetricsPlugin);

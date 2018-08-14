goog.provide('os.metrics.LayersMetrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.LayersMetrics = function() {
  os.metrics.LayersMetrics.base(this, 'constructor');

  this.setLabel('Layers');
  this.setDescription('Layer controls for the map');
  this.setTags(['Add', 'Layer', 'Tile', 'Feature', 'Imagery', 'Zoom', 'Style', 'Remove', 'Rename',
    'Convolve', 'Buffer', 'Export']);
  this.setIcon('fa fa-bars');
  this.setCollapsed(true);

  // manually build the tree
  var leaf = this.getLeafNode();

  var styleLeaf = this.addChild(leaf, {
    label: 'Style Panel',
    collapsed: true,
    description: 'The layer style panel allows control over a layer\'s opacity, color and size.'});

  this.addChild(styleLeaf, {
    label: 'Change Feature Layer Color',
    description: 'The color used to render the data for this layer.',
    key: os.metrics.Layer.VECTOR_COLOR
  });
  this.addChild(styleLeaf, {
    label: 'Change Feature Layer Shape',
    description: 'The icon shape used for data points on this layer.',
    key: os.metrics.Layer.VECTOR_SHAPE
  });
  this.addChild(styleLeaf, {
    label: 'Change Feature Layer Center Shape',
    description: 'The icon shape used in the ellipse center for data points on this layer.',
    key: os.metrics.Layer.VECTOR_CENTER_SHAPE
  });
  this.addChild(styleLeaf, {
    label: 'Change Feature Layer Size',
    description: 'The icon size used for data points on this layer.',
    key: os.metrics.Layer.VECTOR_SIZE
  });
  this.addChild(styleLeaf, {
    label: 'Toggle Ellipsoid',
    description: 'Whether or not ellipses are rendered as ellipsoids.',
    key: os.metrics.Layer.VECTOR_ELLIPSOID
  });
  this.addChild(styleLeaf, {
    label: 'Toggle Ground Reference',
    description: 'Whether or not ellipses are rendered with a ground reference line.',
    key: os.metrics.Layer.VECTOR_GROUND_REF
  });
  this.addChild(styleLeaf, {
    label: 'Toggle Line of Bearing Arrow',
    description: 'Whether or not lines of bearing are rendered with arrows.',
    key: os.metrics.Layer.VECTOR_SHOW_ARROW
  });
  this.addChild(styleLeaf, {
    label: 'Toggle Line of Bearing Show Error',
    description: 'Whether or not lines of bearing are rendered with error arcs.',
    key: os.metrics.Layer.VECTOR_SHOW_ERROR
  });
  this.addChild(styleLeaf, {
    label: 'Toggle Line of Bearing Show Ellipse',
    description: 'Whether or not lines of bearing are rendered with error ellipses.',
    key: os.metrics.Layer.VECTOR_SHOW_ELLIPSE
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Arrow Length',
    description: 'The length of an arrow drawn with lines of bearing.',
    key: os.metrics.Layer.VECTOR_ARROW_SIZE
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Arrow Length Units',
    description: 'The units of the length of an arrow drawn with lines of bearing.',
    key: os.metrics.Layer.VECTOR_ARROW_UNITS
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Multiplier',
    description: 'The multiplier on the length of a line of bearing.',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Type',
    description: 'The type of the length of a line of bearing (manual or column).',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH_TYPE
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length',
    description: 'The length of a line of bearing. Can be defined by a column.',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH_COLUMN
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Column Multiplier',
    description: 'The multiplier on the length of a line of bearing, column option.',
    key: os.metrics.Layer.VECTOR_LOB_COLUMN_LENGTH
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Units',
    description: 'The units on the length of a line of bearing.',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH_UNITS
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Error',
    description: 'The length error of a line of bearing. Can be defined by a column.',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH_ERROR_COLUMN
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Error Multiplier',
    description: 'The multiplier on the error length of a line of bearing.',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH_ERROR
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Length Error Units',
    description: 'The units of the length error of a line of bearing.',
    key: os.metrics.Layer.VECTOR_LOB_LENGTH_ERROR_UNITS
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Orientation',
    description: 'The orientation of a line of bearing. Can be defined by a column.',
    key: os.metrics.Layer.VECTOR_LOB_BEARING_COLUMN
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Orientation Error',
    description: 'The orientation error of a line of bearing. Can be defined by a column.',
    key: os.metrics.Layer.VECTOR_LOB_BEARING_ERROR_COLUMN
  });
  this.addChild(styleLeaf, {
    label: 'Line of Bearing Orientation Error Multiplier',
    description: 'The multipler on the orientation error of a line of bearing. Can be defined by a column.',
    key: os.metrics.Layer.VECTOR_LOB_BEARING_ERROR
  });
  this.addChild(styleLeaf, {
    label: 'Toggle Show Icon Rotation',
    description: 'Whether or not icons are shown with rotation.',
    key: os.metrics.Layer.VECTOR_SHOW_ROTATION
  });
  this.addChild(styleLeaf, {
    label: 'Icon Rotation Column',
    description: 'The orientation of an icon. Can be defined by a column.',
    key: os.metrics.Layer.VECTOR_ROTATION_COLUMN
  });
  this.addChild(styleLeaf, {
    label: 'Change Feature Auto Refresh',
    description: 'How often the layer will automatically refresh its data.',
    key: os.metrics.Layer.VECTOR_AUTO_REFRESH
  });

  var labelLeaf = this.addChild(leaf, {
    label: 'Label Panel',
    collapsed: true,
    description: 'The layer label panel allows control over a layer\'s.' +
        ' label settings, including label color and columns.'});

  this.addChild(labelLeaf, {
    label: 'Change Label Color',
    description: 'The color used for labels on this layer when "Always Show Labels"' +
        ' is checked. <br/>NOTE: The label color does not affect the label color' +
        ' used when hovering, which is alaways red.',
    key: os.metrics.Layer.LABEL_COLOR
  });
  this.addChild(labelLeaf, {
    label: 'Change Label Size',
    description: 'The font size used for labels on this layer.',
    key: os.metrics.Layer.LABEL_SIZE
  });
  this.addChild(labelLeaf, {
    label: 'Always Show Labels',
    description: 'When checked, labels will be rendered for all features.',
    key: os.metrics.Layer.LABEL_TOGGLE
  });
  this.addChild(labelLeaf, {
    label: 'Select a label column',
    description: 'Controls the data column used for labels on this layer.',
    key: os.metrics.Layer.LABEL_COLUMN_SELECT
  });
  this.addChild(labelLeaf, {
    label: 'Add a label column',
    description: 'Add additional columns used for labels.',
    key: os.metrics.Layer.LABEL_COLUMN_ADD
  });
  this.addChild(labelLeaf, {
    label: 'Remove a label column',
    description: 'Add remove columns used for the labels.',
    key: os.metrics.Layer.LABEL_COLUMN_REMOVE
  });

  var contextLayersMenuLeaf = this.addChild(leaf, {
    label: 'Layer Context Menu',
    collapsed: true,
    description: 'Layer right-click context menu commands.'});

  this.addChild(contextLayersMenuLeaf, {
    label: 'Identify',
    key: os.metrics.Layer.IDENTIFY
  });
  this.addChild(contextLayersMenuLeaf, {
    label: 'Most Recent',
    key: os.metrics.Layer.MOST_RECENT
  });
  this.addChild(contextLayersMenuLeaf, {
    label: 'Refresh',
    key: os.metrics.Layer.REFRESH
  });
  this.addChild(contextLayersMenuLeaf, {
    label: 'Remove',
    key: os.metrics.Layer.REMOVE,
    description: 'Removes this layer.'
  });
  this.addChild(contextLayersMenuLeaf, {
    label: 'Rename',
    key: os.metrics.Layer.RENAME
  });

  var contextFeatureLayersMenuLeaf = this.addChild(leaf, {
    label: 'Feature Layer Context Menu',
    collapsed: true,
    description: 'Layer right-click context menu commands.'});

  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Go to layer',
    description: 'Zooms to data loaded by this layer.',
    key: os.metrics.Layer.GO_TO
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Identify',
    description: 'Causes current layer to blink.',
    key: os.metrics.Layer.IDENTIFY
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Clear Selection',
    description: 'Clear any selected data from layer.',
    key: os.metrics.Layer.CLEAR_SELECTION
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Most Recent',
    description: 'Focuses time filter (in main menu bar) to most recent data available.',
    key: os.metrics.Layer.MOST_RECENT
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Refresh',
    description: 'Refreshes the layer form the server.',
    key: os.metrics.Layer.REFRESH
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Remove',
    description: 'Removes this layer.',
    key: os.metrics.Layer.REMOVE
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Rename',
    description: 'Renames this layer.',
    key: os.metrics.Layer.RENAME
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Generate 2D Heatmap',
    description: 'Generate 2D Heatmap for this layer.',
    key: os.metrics.Layer.HEATMAP
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Export...',
    description: 'Exports data from this layer.',
    key: os.metrics.Layer.EXPORT
  });
  this.addChild(contextFeatureLayersMenuLeaf, {
    label: 'Create Buffer Region',
    description: 'Creates buffered region from data in this layer.',
    key: os.metrics.Layer.CREATE_BUFFER
  });
};
goog.inherits(os.metrics.LayersMetrics, os.ui.metrics.MetricsPlugin);

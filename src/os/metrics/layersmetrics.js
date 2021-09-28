goog.module('os.metrics.LayersMetrics');

const {Layer} = goog.require('os.metrics.keys');
const {default: MetricsPlugin} = goog.require('os.ui.metrics.MetricsPlugin');


/**
 */
class LayersMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
      key: Layer.VECTOR_COLOR
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Fill Color',
      description: 'The fill color used to render the data for this layer.',
      key: Layer.VECTOR_FILL_COLOR
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Shape',
      description: 'The icon shape used for data points on this layer.',
      key: Layer.VECTOR_SHAPE
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Icon',
      description: 'The icon used for data points on this layer.',
      key: Layer.VECTOR_ICON
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Center Shape',
      description: 'The icon shape used in the ellipse center for data points on this layer.',
      key: Layer.VECTOR_CENTER_SHAPE
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Size',
      description: 'The icon size used for data points on this layer.',
      key: Layer.VECTOR_SIZE
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Opacity',
      description: 'The opacity used to render the data for this layer.',
      key: Layer.VECTOR_OPACITY
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Fill Opacity',
      description: 'The fill opacity used to render the data for this layer.',
      key: Layer.VECTOR_FILL_OPACITY
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Line Dash',
      description: 'The line dash for polygons and lines on this layer.',
      key: Layer.VECTOR_LINE_DASH
    });
    this.addChild(styleLeaf, {
      label: 'Toggle Ellipsoid',
      description: 'Whether or not ellipses are rendered as ellipsoids.',
      key: Layer.VECTOR_ELLIPSOID
    });
    this.addChild(styleLeaf, {
      label: 'Toggle Ground Reference',
      description: 'Whether or not ellipses are rendered with a ground reference line.',
      key: Layer.VECTOR_GROUND_REF
    });
    this.addChild(styleLeaf, {
      label: 'Toggle Line of Bearing Arrow',
      description: 'Whether or not lines of bearing are rendered with arrows.',
      key: Layer.VECTOR_SHOW_ARROW
    });
    this.addChild(styleLeaf, {
      label: 'Toggle Line of Bearing Show Error',
      description: 'Whether or not lines of bearing are rendered with error arcs.',
      key: Layer.VECTOR_SHOW_ERROR
    });
    this.addChild(styleLeaf, {
      label: 'Toggle Line of Bearing Show Ellipse',
      description: 'Whether or not lines of bearing are rendered with error ellipses.',
      key: Layer.VECTOR_SHOW_ELLIPSE
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Arrow Length',
      description: 'The length of an arrow drawn with lines of bearing.',
      key: Layer.VECTOR_ARROW_SIZE
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Arrow Length Units',
      description: 'The units of the length of an arrow drawn with lines of bearing.',
      key: Layer.VECTOR_ARROW_UNITS
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Multiplier',
      description: 'The multiplier on the length of a line of bearing.',
      key: Layer.VECTOR_LOB_LENGTH
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Type',
      description: 'The type of the length of a line of bearing (manual or column).',
      key: Layer.VECTOR_LOB_LENGTH_TYPE
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length',
      description: 'The length of a line of bearing. Can be defined by a column.',
      key: Layer.VECTOR_LOB_LENGTH_COLUMN
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Column Multiplier',
      description: 'The multiplier on the length of a line of bearing, column option.',
      key: Layer.VECTOR_LOB_COLUMN_LENGTH
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Units',
      description: 'The units on the length of a line of bearing.',
      key: Layer.VECTOR_LOB_LENGTH_UNITS
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Error',
      description: 'The length error of a line of bearing. Can be defined by a column.',
      key: Layer.VECTOR_LOB_LENGTH_ERROR_COLUMN
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Error Multiplier',
      description: 'The multiplier on the error length of a line of bearing.',
      key: Layer.VECTOR_LOB_LENGTH_ERROR
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Length Error Units',
      description: 'The units of the length error of a line of bearing.',
      key: Layer.VECTOR_LOB_LENGTH_ERROR_UNITS
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Orientation',
      description: 'The orientation of a line of bearing. Can be defined by a column.',
      key: Layer.VECTOR_LOB_BEARING_COLUMN
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Orientation Error',
      description: 'The orientation error of a line of bearing. Can be defined by a column.',
      key: Layer.VECTOR_LOB_BEARING_ERROR_COLUMN
    });
    this.addChild(styleLeaf, {
      label: 'Line of Bearing Orientation Error Multiplier',
      description: 'The multipler on the orientation error of a line of bearing. Can be defined by a column.',
      key: Layer.VECTOR_LOB_BEARING_ERROR
    });
    this.addChild(styleLeaf, {
      label: 'Toggle Show Icon Rotation',
      description: 'Whether or not icons are shown with rotation.',
      key: Layer.VECTOR_SHOW_ROTATION
    });
    this.addChild(styleLeaf, {
      label: 'Icon Rotation Column',
      description: 'The orientation of an icon. Can be defined by a column.',
      key: Layer.VECTOR_ROTATION_COLUMN
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Auto Refresh',
      description: 'How often the layer will automatically refresh its data.',
      key: Layer.VECTOR_AUTO_REFRESH
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Color',
      description: 'The color used to render the data for this feature.',
      key: Layer.FEATURE_COLOR
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Fill Color',
      description: 'The fill color used to render the data for this feature.',
      key: Layer.FEATURE_FILL_COLOR
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Icon',
      description: 'The icon used for data points on this feature.',
      key: Layer.FEATURE_ICON
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Opacity',
      description: 'The opacity used to render the data for this feature.',
      key: Layer.FEATURE_OPACITY
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Fill Opacity',
      description: 'The fill opacity used to render the data for this feature.',
      key: Layer.FEATURE_FILL_OPACITY
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Layer Size',
      description: 'The icon size used for data points on this feature.',
      key: Layer.FEATURE_SIZE
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Line Dash',
      description: 'The line dash for polygons and lines on this feature.',
      key: Layer.FEATURE_LINE_DASH
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Shape',
      description: 'The icon shape used for data points on this feature.',
      key: Layer.FEATURE_SHAPE
    });
    this.addChild(styleLeaf, {
      label: 'Change Feature Center Shape',
      description: 'The icon shape used in the ellipse center for data points on this feature.',
      key: Layer.FEATURE_CENTER_SHAPE
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
      key: Layer.LABEL_COLOR
    });
    this.addChild(labelLeaf, {
      label: 'Change Label Size',
      description: 'The font size used for labels on this layer.',
      key: Layer.LABEL_SIZE
    });
    this.addChild(labelLeaf, {
      label: 'Always Show Labels',
      description: 'When checked, labels will be rendered for all features.',
      key: Layer.LABEL_TOGGLE
    });
    this.addChild(labelLeaf, {
      label: 'Select a label column',
      description: 'Controls the data column used for labels on this layer.',
      key: Layer.LABEL_COLUMN_SELECT
    });
    this.addChild(labelLeaf, {
      label: 'Add a label column',
      description: 'Add additional columns used for labels.',
      key: Layer.LABEL_COLUMN_ADD
    });
    this.addChild(labelLeaf, {
      label: 'Remove a label column',
      description: 'Add remove columns used for the labels.',
      key: Layer.LABEL_COLUMN_REMOVE
    });
    this.addChild(labelLeaf, {
      label: 'Change Feature Label Color',
      description: 'The color used for labels on this feature when "Always Show Labels"' +
          ' is checked. <br/>NOTE: The label color does not affect the label color' +
          ' used when hovering, which is alaways red.',
      key: Layer.FEATURE_LABEL_COLOR
    });
    this.addChild(labelLeaf, {
      label: 'Change Feature Label Size',
      description: 'The font size used for labels on this feature.',
      key: Layer.FEATURE_LABEL_SIZE
    });
    this.addChild(labelLeaf, {
      label: 'Always Show Feature Labels',
      description: 'When checked, labels will be rendered this feature.',
      key: Layer.FEATURE_LABEL_TOGGLE
    });
    this.addChild(labelLeaf, {
      label: 'Select a feature label column',
      description: 'Controls the data column used for labels on this feature.',
      key: Layer.FEATURE_LABEL_COLUMN_SELECT
    });

    var contextLayersMenuLeaf = this.addChild(leaf, {
      label: 'Layer Context Menu',
      collapsed: true,
      description: 'Layer right-click context menu commands.'});

    this.addChild(contextLayersMenuLeaf, {
      label: 'Identify',
      key: Layer.IDENTIFY
    });
    this.addChild(contextLayersMenuLeaf, {
      label: 'Most Recent',
      key: Layer.MOST_RECENT
    });
    this.addChild(contextLayersMenuLeaf, {
      label: 'Refresh',
      key: Layer.REFRESH
    });
    this.addChild(contextLayersMenuLeaf, {
      label: 'Remove',
      key: Layer.REMOVE,
      description: 'Removes this layer.'
    });
    this.addChild(contextLayersMenuLeaf, {
      label: 'Rename',
      key: Layer.RENAME
    });

    var contextFeatureLayersMenuLeaf = this.addChild(leaf, {
      label: 'Feature Layer Context Menu',
      collapsed: true,
      description: 'Layer right-click context menu commands.'});

    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Go to layer',
      description: 'Zooms to data loaded by this layer.',
      key: Layer.GO_TO
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Identify',
      description: 'Causes current layer to blink.',
      key: Layer.IDENTIFY
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Clear Selection',
      description: 'Clear any selected data from layer.',
      key: Layer.CLEAR_SELECTION
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Most Recent',
      description: 'Focuses time filter (in main menu bar) to most recent data available.',
      key: Layer.MOST_RECENT
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Refresh',
      description: 'Refreshes the layer form the server.',
      key: Layer.REFRESH
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Remove',
      description: 'Removes this layer.',
      key: Layer.REMOVE
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Rename',
      description: 'Renames this layer.',
      key: Layer.RENAME
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Generate 2D Heatmap',
      description: 'Generate 2D Heatmap for this layer.',
      key: Layer.HEATMAP
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Export...',
      description: 'Exports data from this layer.',
      key: Layer.EXPORT
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Show Features',
      description: 'Displays metadata for features in the layer.',
      key: Layer.FEATURE_LIST
    });
    this.addChild(contextFeatureLayersMenuLeaf, {
      label: 'Create Buffer Region',
      description: 'Creates buffered region from data in this layer.',
      key: Layer.CREATE_BUFFER
    });
  }
}

exports = LayersMetrics;

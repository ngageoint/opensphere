goog.module('os.metrics.MapMetrics');
goog.module.declareLegacyNamespace();

const {Map: MapKeys} = goog.require('os.metrics.keys');
const MetricsPlugin = goog.require('os.ui.metrics.MetricsPlugin');


/**
 */
class MapMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
      key: MapKeys.MODE_2D
    });
    this.addChild(leaf, {
      label: '3D Mode',
      key: MapKeys.MODE_3D
    });
    this.addChild(leaf, {
      label: 'Save State',
      key: MapKeys.SAVE_STATE
    });
    this.addChild(leaf, {
      label: 'Import State',
      key: MapKeys.IMPORT_STATE
    });
    this.addChild(leaf, {
      label: 'Clear State',
      key: MapKeys.CLEAR_STATE
    });
    this.addChild(leaf, {
      label: 'Save Screen Shot',
      key: MapKeys.SCREEN_CAPTURE
    });
    this.addChild(leaf, {
      label: 'Draw',
      key: MapKeys.DRAW
    });
    this.addChild(leaf, {
      label: 'Measure',
      key: MapKeys.MEASURE_TOGGLE
    });
    this.addChild(leaf, {
      label: 'Show Legend',
      key: MapKeys.SHOW_LEGEND
    });
    this.addChild(leaf, {
      label: 'Show Layer Window',
      key: MapKeys.SHOW_LAYER_WINDOW
    });

    var contextMenu = this.addChild(leaf, {
      label: 'Context Menu'
    });
    this.addChild(contextMenu, {
      label: 'Reset View',
      key: MapKeys.RESET_VIEW
    });
    this.addChild(contextMenu, {
      label: 'Reset Rotation',
      key: MapKeys.RESET_ROTATION
    });
    this.addChild(contextMenu, {
      label: 'Toggle 2D/3D View',
      key: MapKeys.TOGGLE_MODE
    });
    this.addChild(contextMenu, {
      label: 'Show Legend',
      key: MapKeys.SHOW_LEGEND_CONTEXT
    });
    this.addChild(contextMenu, {
      label: 'Clear Selection',
      key: MapKeys.CLEAR_SELECTION
    });
    this.addChild(contextMenu, {
      label: 'Set Background Color',
      key: MapKeys.BACKGROUND_COLOR
    });

    var unitsMenu = this.addChild(leaf, {
      label: 'Units Menu'
    });
    this.addChild(unitsMenu, {
      label: 'Use Imperial Units',
      key: MapKeys.UNITS_IMPERIAL
    });
    this.addChild(unitsMenu, {
      label: 'Use Metric Units',
      key: MapKeys.UNITS_METRIC
    });
    this.addChild(unitsMenu, {
      label: 'Use Nautical Units',
      key: MapKeys.UNITS_NAUTICAL
    });
    this.addChild(unitsMenu, {
      label: 'Use Miles Only Units',
      key: MapKeys.UNITS_MILE
    });
    this.addChild(unitsMenu, {
      label: 'Use Nautical Miles Only Units',
      key: MapKeys.UNITS_NAUTICALMILE
    });
    this.addChild(unitsMenu, {
      label: 'Use Yards Only Units',
      key: MapKeys.UNITS_YARD
    });
    this.addChild(unitsMenu, {
      label: 'Use Feet Only Units',
      key: MapKeys.UNITS_FEET
    });
  }
}

exports = MapMetrics;

goog.provide('os.ui.layer');

goog.require('os.style.label');


/**
 * Intervals for the layer refresh option, in seconds.
 * @type {!Array<!osx.layer.RefreshOption>}
 * @const
 */
os.ui.layer.REFRESH_DURATIONS = [
  {label: '-- None --', interval: 0},
  {label: '15 seconds', interval: 15},
  {label: '30 seconds', interval: 30},
  {label: '1 minute', interval: 60},
  {label: '5 minutes', interval: 300},
  {label: '10 minutes', interval: 600},
  {label: '15 minutes', interval: 900},
  {label: '30 minutes', interval: 1800},
  {label: '1 hour', interval: 3600},
  {label: '2 hours', interval: 7200},
  {label: '3 hours', interval: 3 * 3600},
  {label: '6 hours', interval: 6 * 3600},
  {label: '12 hours', interval: 12 * 3600},
  {label: '1 day', interval: 24 * 3600}
];


/**
 * Get the label column for the layer
 * @param {os.layer.ILayer} layer
 * @return {Array<os.style.label.LabelConfig>}
 */
os.ui.layer.getColumn = function(layer) {
  var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[os.style.StyleField.LABELS] || [os.style.label.cloneConfig()];
};


/**
 * Get if labels should be shown on the layer
 * @param {os.layer.ILayer} layer
 * @return {string}
 */
os.ui.layer.getShowLabel = function(layer) {
  var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[os.style.StyleField.SHOW_LABELS] || false;
};


/**
 * Get the label color for the layer.
 * @param {os.layer.ILayer} layer
 * @return {string}
 */
os.ui.layer.getLabelColor = function(layer) {
  var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[os.style.StyleField.LABEL_COLOR] || os.style.getConfigColor(layerConfig);
};


/**
 * Get the label size for the layer.
 * @param {os.layer.ILayer} layer
 * @return {string}
 */
os.ui.layer.getLabelSize = function(layer) {
  var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[os.style.StyleField.LABEL_SIZE] || false;
};


/**
 * Get the available columns for the layer
 * @param {os.layer.ILayer} layer
 * @return {Array<os.data.ColumnDefinition>}
 */
os.ui.layer.getColumns = function(layer) {
  var source = /** @type {os.layer.Vector} */ (layer).getSource();
  if (source && os.instanceOf(source, os.source.Vector.NAME)) {
    return os.ui.layer.getColumnsFromSource(/** @type {!os.source.Vector} */ (source));
  }
  return null;
};


/**
 * Get the available columns for the source
 * @param {os.source.Vector} source
 * @return {Array<os.data.ColumnDefinition>}
 */
os.ui.layer.getColumnsFromSource = function(source) {
  var columns = source.getColumns().slice();
  columns.sort(os.ui.slick.column.nameCompare);
  return columns;
};


/**
 * @param {os.layer.ILayer} layer
 * @return {Array.<osx.ogc.TileStyle>}
 */
os.ui.layer.getStyles = function(layer) {
  return /** @type {os.layer.Tile} */ (layer).getStyles();
};


/**
 * @param {os.layer.ILayer} layer
 * @return {?osx.ogc.TileStyle}
 */
os.ui.layer.getStyle = function(layer) {
  var style = /** @type {os.layer.Tile} */ (layer).getStyle();

  if (goog.isObject(style)) {
    return /** @type {!osx.ogc.TileStyle} */ (style);
  }

  return null;
};


/**
 * @param {os.layer.ILayer} layer
 * @param {osx.ogc.TileStyle} value
 */
os.ui.layer.setStyle = function(layer, value) {
  /** @type {os.layer.Tile} */ (layer).setStyle(value);
};


/**
 * @param {os.layer.ILayer} layer
 * @return {?boolean}
 */
os.ui.layer.getColorize = function(layer) {
  return /** @type {os.layer.Tile} */ (layer).getColorize();
};


/**
 * @param {os.layer.ILayer} layer
 * @param {boolean} value
 */
os.ui.layer.setColorize = function(layer, value) {
  /** @type {os.layer.Tile} */ (layer).setColorize(value);
};


/**
 * Get the unique ID column for a layer
 * @param {os.layer.ILayer} layer
 * @return {os.data.ColumnDefinition}
 */
os.ui.layer.getUniqueId = function(layer) {
  var value = null;
  var source = /** @type {os.layer.Vector} */ (layer).getSource();
  if (source && os.instanceOf(source, os.source.Vector.NAME)) {
    source = /** @type {!os.source.Vector} */ (source);
    value = source.getUniqueId();
  }

  return value;
};

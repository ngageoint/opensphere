goog.module('os.ui.layer');
goog.module.declareLegacyNamespace();

const {instanceOf} = goog.require('os.classRegistry');
const SourceClass = goog.require('os.source.SourceClass');
const {getConfigColor} = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const {cloneConfig} = goog.require('os.style.label');
const {nameCompare} = goog.require('os.ui.slick.column');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');
const ILayer = goog.requireType('os.layer.ILayer');
const TileLayer = goog.requireType('os.layer.Tile');
const VectorLayer = goog.requireType('os.layer.Vector');
const VectorSource = goog.requireType('os.source.Vector');
const {LabelConfig} = goog.requireType('os.style.label');


/**
 * Intervals for the layer refresh option, in seconds.
 * @type {!Array<!osx.layer.RefreshOption>}
 */
const REFRESH_DURATIONS = [
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
 *
 * @param {ILayer} layer
 * @return {Array<LabelConfig>}
 */
const getColumn = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.LABELS] || [cloneConfig()];
};

/**
 * Get if labels should be shown on the layer
 *
 * @param {ILayer} layer
 * @return {string}
 */
const getShowLabel = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.SHOW_LABELS] || false;
};

/**
 * Get the label color for the layer.
 *
 * @param {ILayer} layer
 * @return {string}
 */
const getLabelColor = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.LABEL_COLOR] || getConfigColor(layerConfig);
};

/**
 * Get the label size for the layer.
 *
 * @param {ILayer} layer
 * @return {string}
 */
const getLabelSize = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.LABEL_SIZE] || false;
};

/**
 * Get the available columns for the layer
 *
 * @param {ILayer} layer
 * @return {Array<ColumnDefinition>}
 */
const getColumns = function(layer) {
  var source = /** @type {VectorLayer} */ (layer).getSource();
  if (source && instanceOf(source, SourceClass.VECTOR)) {
    return getColumnsFromSource(/** @type {VectorSource} */ (source));
  }
  return null;
};

/**
 * Get the available columns for the source
 *
 * @param {VectorSource} source
 * @return {Array<ColumnDefinition>}
 */
const getColumnsFromSource = function(source) {
  return source ? source.getColumns().sort(nameCompare) : [];
};

/**
 * @param {ILayer} layer
 * @return {Array<osx.ogc.TileStyle>}
 */
const getStyles = function(layer) {
  return /** @type {TileLayer} */ (layer).getStyles();
};

/**
 * @param {ILayer} layer
 * @return {?osx.ogc.TileStyle}
 */
const getStyle = function(layer) {
  var style = /** @type {TileLayer} */ (layer).getStyle();

  if (goog.isObject(style)) {
    return /** @type {!osx.ogc.TileStyle} */ (style);
  }

  return null;
};

/**
 * @param {ILayer} layer
 * @param {osx.ogc.TileStyle} value
 */
const setStyle = function(layer, value) {
  /** @type {TileLayer} */ (layer).setStyle(value);
};

/**
 * @param {ILayer} layer
 * @return {?boolean}
 */
const getColorize = function(layer) {
  return /** @type {TileLayer} */ (layer).getColorize();
};

/**
 * @param {ILayer} layer
 * @param {boolean} value
 */
const setColorize = function(layer, value) {
  /** @type {TileLayer} */ (layer).setColorize(value);
};

/**
 * Get the unique ID column for a layer
 *
 * @param {ILayer} layer
 * @return {ColumnDefinition}
 */
const getUniqueId = function(layer) {
  var source = /** @type {VectorLayer} */ (layer).getSource();
  if (source && instanceOf(source, SourceClass.VECTOR)) {
    source = /** @type {!VectorSource} */ (source);
    return source.getUniqueId();
  }

  return null;
};

exports = {
  REFRESH_DURATIONS,
  getColumn,
  getShowLabel,
  getLabelColor,
  getLabelSize,
  getColumns,
  getColumnsFromSource,
  getStyles,
  getStyle,
  setStyle,
  getColorize,
  setColorize,
  getUniqueId
};

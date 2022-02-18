goog.declareModuleId('os.ui.layer');

import {instanceOf} from '../../classregistry.js';
import {isObject} from '../../object/object.js';
import SourceClass from '../../source/sourceclass.js';
import {cloneConfig} from '../../style/label.js';
import {getConfigColor} from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import StyleManager from '../../style/stylemanager_shim.js';
import {nameCompare} from '../slick/column.js';

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: TileLayer} = goog.requireType('os.layer.Tile');
const {default: VectorLayer} = goog.requireType('os.layer.Vector');
const {default: VectorSource} = goog.requireType('os.source.Vector');
const {LabelConfig} = goog.requireType('os.style.label');


/**
 * Intervals for the layer refresh option, in seconds.
 * @type {!Array<!osx.layer.RefreshOption>}
 */
export const REFRESH_DURATIONS = [
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
export const getColumn = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.LABELS] || [cloneConfig()];
};

/**
 * Get if labels should be shown on the layer
 *
 * @param {ILayer} layer
 * @return {string}
 */
export const getShowLabel = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.SHOW_LABELS] || false;
};

/**
 * Get the label color for the layer.
 *
 * @param {ILayer} layer
 * @return {string}
 */
export const getLabelColor = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.LABEL_COLOR] || getConfigColor(layerConfig);
};

/**
 * Get the label size for the layer.
 *
 * @param {ILayer} layer
 * @return {string}
 */
export const getLabelSize = function(layer) {
  var layerConfig = StyleManager.getInstance().getLayerConfig(layer.getId());
  return layerConfig && layerConfig[StyleField.LABEL_SIZE] || false;
};

/**
 * Get the available columns for the layer
 *
 * @param {ILayer} layer
 * @return {Array<ColumnDefinition>}
 */
export const getColumns = function(layer) {
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
export const getColumnsFromSource = function(source) {
  return source ? source.getColumns().sort(nameCompare) : [];
};

/**
 * @param {ILayer} layer
 * @return {Array<osx.ogc.TileStyle>}
 */
export const getStyles = function(layer) {
  return /** @type {TileLayer} */ (layer).getStyles();
};

/**
 * @param {ILayer} layer
 * @return {?osx.ogc.TileStyle}
 */
export const getStyle = function(layer) {
  var style = /** @type {TileLayer} */ (layer).getStyle();

  if (isObject(style)) {
    return /** @type {!osx.ogc.TileStyle} */ (style);
  }

  return null;
};

/**
 * @param {ILayer} layer
 * @param {osx.ogc.TileStyle} value
 */
export const setStyle = function(layer, value) {
  /** @type {TileLayer} */ (layer).setStyle(value);
};

/**
 * @param {ILayer} layer
 * @return {?boolean}
 */
export const getColorize = function(layer) {
  return /** @type {TileLayer} */ (layer).getColorize();
};

/**
 * @param {ILayer} layer
 * @param {boolean} value
 */
export const setColorize = function(layer, value) {
  /** @type {TileLayer} */ (layer).setColorize(value);
};

/**
 * Get the unique ID column for a layer
 *
 * @param {ILayer} layer
 * @return {ColumnDefinition}
 */
export const getUniqueId = function(layer) {
  var source = /** @type {VectorLayer} */ (layer).getSource();
  if (source && instanceOf(source, SourceClass.VECTOR)) {
    source = /** @type {!VectorSource} */ (source);
    return source.getUniqueId();
  }

  return null;
};

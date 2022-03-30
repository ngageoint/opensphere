goog.declareModuleId('os.style.label');

import {asArray} from 'ol/src/color.js';
import {equals, createEmpty, getCenter, createOrUpdateFromCoordinate, containsCoordinate} from 'ol/src/extent.js';
import Geometry from 'ol/src/geom/Geometry.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import {fromExtent as polyFromExtent} from 'ol/src/geom/Polygon.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import Style from 'ol/src/style/Style.js';

import {instanceOf} from '../classregistry.js';
import DataManager from '../data/datamanager.js';
import RecordField from '../data/recordfield.js';
import {hideLabel, showLabel} from '../feature/feature.js';
import Fields from '../fields/fields.js';
import {filterFalsey} from '../fn/fn.js';
import PropertyChange from '../layer/propertychange.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {getFirstValue} from '../object/object.js';
import {zIndexCompare} from '../source/source.js';
import SourceClass from '../source/sourceclass.js';
import {measureText} from '../ui/ui.js';
import * as osStyle from './style.js';
import StyleField from './stylefield.js';
import {getStyleManager} from './styleinstance.js';
import StyleType from './styletype.js';

const {assert} = goog.require('goog.asserts');
const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const log = goog.require('goog.log');
const {clamp} = goog.require('goog.math');
const {isEmptyOrWhitespace, makeSafe, truncate} = goog.require('goog.string');

const Logger = goog.requireType('goog.log.Logger');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.style.label');

/**
 * @typedef {{column: (string|null), showColumn: !boolean}}
 */
export let LabelConfig;

/**
 * Default label config.
 * @type {!LabelConfig}
 */
export const DEFAULT_LABEL = {
  'column': null,
  'showColumn': false
};

/**
 * Checks whether a set of labels has any non-default labels.
 *
 * @param {Array<LabelConfig>} labels The label configs.
 * @return {boolean} If one or more label configs have a non-default column.
 */
export const hasNonDefaultLabels = function(labels) {
  if (labels && labels.length) {
    for (var i = 0; i < labels.length; i++) {
      if (labels[i]['column'] !== DEFAULT_LABEL['column']) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Gets the first non-default set of labels between the feature and layer configs.
 *
 * @param {?Array<LabelConfig>} featureLabels
 * @param {?Array<LabelConfig>} layerLabels
 * @return {!Array<LabelConfig>}
 */
export const getLabels = function(featureLabels, layerLabels) {
  // prefer feature labels
  if (featureLabels) {
    return featureLabels;
  }

  // no feature labels - check if layer labels are defined and not the defaults
  if (layerLabels && hasNonDefaultLabels(layerLabels)) {
    return layerLabels;
  }

  // return the default label config
  return [cloneConfig()];
};

/**
 * Gets the first non-default set of labels between the feature and layer configs.
 *
 * @param {Array<Object>|Object|undefined} config
 * @return {Array<LabelConfig>}
 */
export const getConfigLabels = function(config) {
  if (config) {
    if (config[StyleField.LABELS]) {
      return config[StyleField.LABELS];
    } else if (Array.isArray(config)) {
      // return the first non-empty label config
      for (var i = 0; i < config.length; i++) {
        var labels = /** @type {Array<LabelConfig>} */ (config[i][StyleField.LABELS]);
        if (hasNonDefaultLabels(labels)) {
          return labels;
        }
      }
    }
  }

  return null;
};

/**
 * Clone a label config. This copies explicit properties to avoid properties like $$hashKey and closure_uid_nnn used by
 * Angular and Closure. If a config is not provided, the default config is cloned.
 *
 * @param {LabelConfig=} opt_config The config to clone
 * @return {!LabelConfig}
 */
export const cloneConfig = function(opt_config) {
  var config = opt_config || DEFAULT_LABEL;
  return {
    'column': config['column'],
    'showColumn': config['showColumn']
  };
};

/**
 * Filter label configs, returning those that are defined and have a column set.
 *
 * @param {Array<LabelConfig>} configs The label configs.
 * @return {!Array<!LabelConfig>}
 */
export const filterValid = function(configs) {
  if (configs) {
    return configs.filter(function(config) {
      return config != null && !!config['column'];
    });
  }

  return [];
};

/**
 * Default font.
 * @type {string}
 */
export const DEFAULT_FONT = 'Arial';

/**
 * Default font size.
 * @type {number}
 */
export const DEFAULT_SIZE = 14;

/**
 * Minimum font size.
 * @type {number}
 */
export const MIN_SIZE = 8;

/**
 * Maximum font size.
 * @type {number}
 */
export const MAX_SIZE = 48;

/**
 * Z-index for label styles.
 * @type {number}
 */
export const Z_INDEX = 500;

/**
 * The truncation length for labels.
 * @type {number}
 */
export const TRUNCATE_LENGTH = 50;

/**
 * Update which features should have their labels shown.
 *
 * @return {boolean}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
const updateShown_ = function() {
  // if the map/view aren't ready, return false so the conditional delay will keep trying
  var map = getMapContainer();
  var view = null;
  if (map.getMap() && map.getMap().getView()) {
    view = map.getMap().getView();
  } else {
    return false;
  }

  var resolution = view.getResolution();
  if (resolution === undefined) {
    return false;
  }

  // check if the view extent is ready to update labels. if the viewport was resized recently, the map size may be zero,
  // which will prevent labels from updating correctly.
  var viewExtent = map.getViewExtent();
  if (equals(viewExtent, osMap.ZERO_EXTENT)) {
    return false;
  }

  // this is precise in 2D but gets less precise in 3D as the globe is tilted/rotated. the extent will still be focused
  // in the center of the screen, but keep this in mind if label updates seem off in 3D.
  var viewPoly = polyFromExtent(viewExtent);
  assert(viewPoly, 'failed creating polygon from view');

  // reusable extent to reduce GC
  var extent = createEmpty();

  var then = Date.now();
  var labelSources = [];
  var features = [];
  var changed = {};
  var fields = {};

  // gather sources/features that may have labels shown and sorte by z-index so higher indexed layers generate labels
  // first
  var dm = DataManager.getInstance();
  var sources = dm.getSources();
  sources.sort(zIndexCompare);

  for (var i = 0, ii = sources.length; i < ii; i++) {
    var source = sources[i];
    if (instanceOf(source, SourceClass.VECTOR)) {
      source = /** @type {VectorSource} */ (source);

      if (source.isEnabled() && source.getVisible()) {
        var id = source.getId();
        var config = getStyleManager().getLayerConfig(id);
        if (config && config[StyleField.SHOW_LABELS]) {
          // source is configured to show labels. keep a reference to the label column, init the changed features array.
          fields[id] = config[StyleField.LABELS];
          changed[id] = [];
          labelSources.push(source);

          // add time-filtered features in the current view extent
          var tempFeatures = source.getFilteredFeatures(false);
          features = features.concat(source.getFeaturesInGeometry(viewPoly, tempFeatures));
        }
      }
    }
  }

  /**
   * @type {Object<string, boolean>}
   */
  var visited = {};

  const visitFeature = (feature) => {
    visited[feature['id']] = true;

    // labels set on the feature config take precedence over source labels
    var featureConfig = feature.values_[StyleType.FEATURE];
    var featureLabels = getConfigLabels(featureConfig);
    var featureSourceId = feature.values_[RecordField.SOURCE_ID];
    var layerLabels = fields[featureSourceId];
    var labels = getLabels(featureLabels, layerLabels);
    var labelText = getLabelsText(feature, labels, featureConfig);

    var geometry = defaultGeometryFunction(feature);
    if (!(geometry instanceof SimpleGeometry) || !labelText) {
      // unsupported geometry type or there is no text to display - ignore it
      return;
    }

    // compute the size of the label on screen. this is accurate for Openlayers, not necessarily other renderers
    var config = getStyleManager().getLayerConfig(featureSourceId);
    var labelFont = getFont(config[StyleField.LABEL_SIZE]);
    var labelSize = measureText(labelText, 'feature-label', labelFont);

    // pad labels by 10px to reduce crowding
    var xBuffer = (labelSize.width + 5) * resolution;
    var yBuffer = (labelSize.height + 5) * resolution;

    // show the label for this feature
    if (showLabel(feature)) {
      changed[featureSourceId].push(feature);
    }

    // create the map extent for the label (in 2D without rotation)
    var labelCenter = getCenter(geometry.getExtent());
    createOrUpdateFromCoordinate(labelCenter, extent);

    extent[0] -= xBuffer;
    extent[1] -= yBuffer;
    extent[2] += xBuffer;
    extent[3] += yBuffer;

    // hide labels for all neighbors within the label's extent. note this is checking around the center point of the
    // feature, not where the label will be drawn, but we use the same offset for all labels so the net result is the
    // same.
    for (var j = 0, jj = labelSources.length; j < jj; j++) {
      var labelSource = labelSources[j];
      var labelSourceId = labelSource.getId();
      var neighbors = labelSource.getFeaturesInExtent(extent);
      if (neighbors) {
        for (var k = 0, kk = neighbors.length; k < kk; k++) {
          var neighbor = neighbors[k];
          if (!(neighbor['id'] in visited)) {
            // non-point geometries need to be tested against the center of their extent, where the label will be
            // positioned or they may be hidden when they don't need to be.
            var neighborGeometry = neighbor.getGeometry();
            if (neighborGeometry && neighborGeometry.getType() != GeometryType.POINT) {
              var neighborCenter = getCenter(neighborGeometry.getExtent());
              if (!containsCoordinate(extent, neighborCenter)) {
                // the neighbor's label position is not within the extent of the current label, so don't turn it off
                return;
              }
            }

            visited[neighbor['id']] = true;

            if (hideLabel(neighbor)) {
              changed[labelSourceId].push(neighbor);
            }
          }
        }
      }
    }
  };

  // First show labels for all features with the override flag set.
  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    if (feature.values_[RecordField.FORCE_SHOW_LABEL] && !(feature['id'] in visited)) {
      visitFeature(feature);
    }
  }

  // Then process everything else that hasn't already been visited.
  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    if (!(feature['id'] in visited)) {
      visitFeature(feature);
    }
  }

  for (var id in changed) {
    if (changed[id].length > 0) {
      // update the style on all changed features so the label will be shown/hidden
      osStyle.setFeaturesStyle(changed[id]);

      var layer = map.getLayer(id);
      if (layer) {
        // THIN-6912: use a specific event type since os.layer.PropertyChange.STYLE is handled in many other places,
        // specifically updating the vector controls UI. we only want to tell opensphere to redraw labels.
        osStyle.notifyStyleChange(layer, changed[id], PropertyChange.LABEL_VISIBILITY);
      }
    }
  }

  var msg = 'Label visibility computed in ' + (Date.now() - then) + 'ms.';
  log.fine(logger, msg);

  // return true to stop the conditional delay
  return true;
};

/**
 * A delay to limit how often labels are updated. This reduces bursts of update calls from multiple sources/paths.
 *
 * Label update depends on the map/view being initialized, so the callback is executed using a conditional delay that
 * will fire until the update succeeds or times out.
 *
 * @type {ConditionalDelay}
 */
const UPDATE_DELAY_ = new ConditionalDelay(updateShown_);

/**
 * Update which features should have their labels shown.
 */
export const updateShown = function() {
  if (!UPDATE_DELAY_.isActive()) {
    // try once every 100ms for 5 seconds or until the update succeeds
    UPDATE_DELAY_.start(100, 5000);
  }
};

/**
 * Creates or updates a label style for the provided feature. Label styles are saved to each feature instead of being
 * cached on the reader like other styles. This prevents saving a style for each text/font/color combo which would get
 * out of hand real fast.
 *
 * @param {Feature} feature The feature
 * @param {Object} config Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {Style|undefined} The label style, or undefined if the feature isn't labelled
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createOrUpdate = function(feature, config, opt_layerConfig) {
  var labelStyle;

  // always show labels for highlighted features, otherwise show if the flag isn't explicity set to false. this is
  // managed by the hit detection function, and if that isn't run on the feature we should show the label.
  if (feature.values_[StyleType.HIGHLIGHT] || feature.values_[StyleField.SHOW_LABELS] !== false) {
    var featureLabels = config[StyleField.LABELS];
    var layerLabels = opt_layerConfig ?
      opt_layerConfig[StyleField.LABELS] : [cloneConfig()];
    var labelConfigs = getLabels(featureLabels, layerLabels);

    var labelText = getLabelsText(feature, labelConfigs, config);
    if (!isEmptyOrWhitespace(makeSafe(labelText))) {
      labelStyle = /** @type {Style|undefined} */ (feature.get(StyleType.LABEL));

      const baseLabelConfig = getLabelConfig(config, opt_layerConfig);

      if (!labelStyle) {
        // label style hasn't been created for the layer yet - do it now!
        var reader = getStyleManager().getReader('text');
        assert(reader);

        // look for the text style configuration on the feature config, then the layer config.
        // if these change in the future we'll have to rework this a bit.
        var labelConfig = {};
        osStyle.mergeConfig(baseLabelConfig, labelConfig);

        // create the style using the text reader
        var textStyle = reader.getOrCreateStyle(labelConfig);
        labelStyle = new Style({
          geometry: defaultGeometryFunction,
          text: textStyle
        });
      }

      updateLabelStyle(labelStyle, feature, config, opt_layerConfig);

      updateText(labelStyle, labelText);
      updateDefaultOffsetX(labelStyle, config);
      updateDefaultTextAlign(labelStyle, config, 'left');

      // update the cache on the feature
      feature.set(StyleType.LABEL, labelStyle, true);
    }
  }

  return labelStyle;
};

/**
 * Creates label styles for additional label config included on a feature.
 *
 * @param {Feature} feature The feature
 * @param {Object} config Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {Array<Style>|undefined} The label style, or undefined if the feature isn't labelled
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createAdditionalLabels = function(feature, config, opt_layerConfig) {
  var additionalLabels = feature.get(StyleField.ADDITIONAL_LABELS);
  var labelStyles;

  if (additionalLabels) {
    labelStyles = [];

    var reader = getStyleManager().getReader('text');
    assert(reader);

    additionalLabels.forEach(function(additionalConfig) {
      // look for the text style configuration on the feature config, then the layer config.
      // if these change in the future we'll have to rework this a bit.
      var labelConfig = {};
      var baseLabelConfig = getLabelConfig(config, opt_layerConfig);
      osStyle.mergeConfig(config, labelConfig);
      osStyle.mergeConfig(baseLabelConfig, labelConfig);
      osStyle.mergeConfig(additionalConfig, labelConfig);

      // create the style using the text reader
      var textStyle = reader.getOrCreateStyle(labelConfig);
      var labelStyle = new Style({
        geometry: additionalConfig['geometry'] || defaultGeometryFunction,
        text: textStyle
      });

      updateLabelStyle(labelStyle, feature, config, opt_layerConfig);

      labelStyles.push(labelStyle);
    });
  }

  return labelStyles;
};

/**
 * Prepare label text for display to the user. Strips HTML and newlines and truncates the label.
 *
 * @param {Style} labelStyle The style.
 * @param {Feature} feature The feature.
 * @param {Object} config Base configuration for the feature.
 * @param {Object=} opt_layerConfig Layer configuration for the feature.
 */
export const updateLabelStyle = function(labelStyle, feature, config, opt_layerConfig) {
  updateZIndex(labelStyle, config);
  updateDefaultFontFromSize(labelStyle, config, opt_layerConfig);
  updateDefaultFillColor(labelStyle, feature, config, opt_layerConfig);
  updateDefaultStrokeColor(labelStyle, feature, config, opt_layerConfig);
};

/**
 * @param {Object} featureConfig
 * @param {Object=} opt_layerConfig
 * @return {!Object}
 */
export const getLabelConfig = function(featureConfig, opt_layerConfig) {
  return /** @type {Object|undefined} */ (getFirstValue('text', featureConfig, opt_layerConfig)) || {};
};

/**
 * @param {Style} labelStyle
 * @param {Object} config
 */
const updateZIndex = function(labelStyle, config) {
  const baseZIndex = config['zIndex'] || 0;
  labelStyle.setZIndex(baseZIndex + Z_INDEX);
};

/**
 * @param {Style} labelStyle
 * @param {Object} config
 * @param {Object=} opt_layerConfig
 */
export const updateDefaultFontFromSize = function(labelStyle, config, opt_layerConfig) {
  if (!config || !config['text'] || config['text']['font'] === undefined) {
    const textStyle = labelStyle.getText();
    // update the font and colors
    let fontSize = /** @type {string|number|undefined} */ (getFirstValue(
        StyleField.LABEL_SIZE, config, opt_layerConfig));
    if (typeof fontSize == 'string') {
      fontSize = parseInt(fontSize, 10) || undefined;
    }

    fontSize = fontSize || DEFAULT_SIZE;

    const labelFont = getFont(fontSize);
    textStyle.setFont(labelFont);
  }
};

/**
 * @param {Style} labelStyle
 * @param {Feature} feature
 * @param {Object} config
 * @param {Object=} opt_layerConfig
 */
export const updateDefaultFillColor = function(labelStyle, feature, config, opt_layerConfig) {
  if (!config || !config['text'] || (
    config['text']['fillColor'] === undefined && (
      config['text']['fill'] === undefined ||
          config['text']['fill']['color'] === undefined))) {
    const textStyle = labelStyle.getText();
    const labelColor = getColor(feature, config, opt_layerConfig);
    const fill = textStyle.getFill();
    if (fill) {
      fill.setColor(labelColor);
    }
  }
};

/**
 * @param {Style} labelStyle
 * @param {Feature} feature
 * @param {Object} config
 * @param {Object=} opt_layerConfig
 */
export const updateDefaultStrokeColor = function(labelStyle, feature, config, opt_layerConfig) {
  if (!config || !config['text'] || (
    config['text']['strokeColor'] === undefined && (
      config['text']['stroke'] === undefined ||
      config['text']['stroke']['color'] === undefined))) {
    const textStyle = labelStyle.getText();
    const labelColor = getColor(feature, config, opt_layerConfig);
    const stroke = textStyle.getStroke();
    if (stroke) {
      const fillColor = asArray(labelColor);
      const strokeColor = asArray(/** @type {Array<number>|string} */ (stroke.getColor()));
      strokeColor[3] = fillColor[3];
      stroke.setColor(osStyle.toRgbaString(strokeColor));
    }
  }
};

/**
 * @param {Style} labelStyle
 * @param {string} label
 */
export const updateText = function(labelStyle, label) {
  const text = labelStyle.getText();
  text.setText(prepareText(label, true));
};

/**
 * @param {Style} labelStyle
 * @param {Object} config
 */
export const updateDefaultOffsetX = function(labelStyle, config) {
  // labels need to be offset a little more when next to an icon. this helps, but isn't nearly complete.
  // TODO: determine the size of the rendered feature and use that for the x offset
  if (!config || !config['text'] || config['text']['offsetX'] === undefined) {
    const text = labelStyle.getText();
    const fontSize = DEFAULT_SIZE;
    const offsetx = osStyle.isIconConfig(config) ? fontSize : (fontSize / 2);
    text.setOffsetX(offsetx);
  }
};

/**
 * @param {Style} labelStyle
 * @param {Object} config
 * @param {string} align
 */
export const updateDefaultTextAlign = function(labelStyle, config, align) {
  if (!config || !config['text'] || !config['text']['textAlign']) {
    const text = labelStyle.getText();
    text.setTextAlign(align);
  }
};

/**
 * Prepare label text for display to the user. Strips HTML and newlines and truncates the label.
 *
 * @param {string} text The label text
 * @param {boolean=} opt_truncate If the label should be truncated. Defaults to true.
 * @return {string} The stripped label text, or the original text if an error was encountered
 */
export const prepareText = function(text, opt_truncate) {
  var shouldTruncate = opt_truncate != null ? opt_truncate : false;

  var result;
  try {
    // parse HTML and grab only the remaining text content
    result = new DOMParser().parseFromString(text, 'text/html').body.textContent;
  } catch (e) {
    result = text;
  }

  result = result.trim();

  if (shouldTruncate) {
    result = result.split('\n').map(function(l) {
      return truncate(l.trim(), TRUNCATE_LENGTH);
    }).join('\n');
  }

  return result;
};

/**
 * Get the label text for a feature field.
 *
 * @param {Feature} feature The feature
 * @param {string} field The field
 * @return {string} The label text
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getText = function(feature, field) {
  var value;

  // handle special fields here
  switch (field) {
    case Fields.TIME:
      value = feature.values_[RecordField.TIME] || '';
      break;
    default:
      value = feature.values_[field];
      break;
  }

  value = value != null ? value.toString() : '';

  return value;
};

/**
 * Gets the text string from all the label fields
 *
 * @param {Feature} feature The feature
 * @param {LabelConfig} label
 * @return {string} the label text
 */
export const getLabelText = function(feature, label) {
  var value = getText(feature, label['column']);
  if (value && label['showColumn']) {
    // Dont ever just show the key. only if theres a value
    value = label['column'] + ': ' + value;
  }
  return value;
};

/**
 * Gets the text string from all the label fields
 *
 * @param {Feature} feature The feature
 * @param {Array<LabelConfig>} labels
 * @param {Object} config
 * @return {string} the label text
 */
export const getLabelsText = function(feature, labels, config) {
  if (config && config['text'] && config['text']['text']) {
    return /** @type {string} */ (config['text']['text']);
  }

  return labels.map(function(label) {
    return getLabelText(feature, label);
  }).filter(filterFalsey).join('\n');
};

/**
 * Get the label color for a feature.
 *
 * @param {Feature} feature The feature
 * @param {Object} config Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {string}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getColor = function(feature, config, opt_layerConfig) {
  var color = config[StyleField.LABEL_COLOR] ||
      (opt_layerConfig && opt_layerConfig[StyleField.LABEL_COLOR]);
  if (!color || feature.values_[StyleType.HIGHLIGHT] || feature.values_[StyleType.SELECT]) {
    // label color wasn't defined, or the feature is highlighed/selected. use the config color.
    color = osStyle.getConfigColor(config);
  }

  return color || osStyle.DEFAULT_LAYER_COLOR;
};

/**
 * Generate a CSS font style for labels. Assume bold because non-bold fonts are generally hard to read.
 *
 * @param {number=} opt_size The font size.
 * @return {string} The CSS font style.
 */
export const getFont = function(opt_size) {
  // using size/size sets the line height to the font size, creating compact labels
  var size = clamp(opt_size || DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
  var pxSize = size + 'px';
  return 'bold ' + pxSize + '/' + pxSize + ' ' + DEFAULT_FONT;
};

/**
 * Get the default geometry for a feature. If the default geometry is a collection, only use the first geometry in the
 * collection. I intentionally didn't handle collections of collections until we actually encounter it for the sake of
 * simplicity.
 *
 * @param {Feature} feature Feature to get the geometry for.
 * @return {Geometry|undefined} Geometry to render.
 */
export const defaultGeometryFunction = function(feature) {
  var geometry;
  assert(feature != undefined, 'feature must be defined');

  var labelGeometry = /** @type {string|undefined} */ (feature.get(StyleField.LABEL_GEOMETRY));
  if (labelGeometry) {
    // get the defined label geometry, and verify it is an OpenLayers geometry
    geometry = feature.get(labelGeometry);

    if (!(geometry instanceof Geometry)) {
      geometry = undefined;
    }
  } else {
    // use the feature default
    geometry = feature.getGeometry();
  }

  // only display the label on the first geometry in a collection, to avoid excessive labels
  if (geometry instanceof GeometryCollection) {
    var geometries = geometry.getGeometriesArray();
    geometry = geometries && geometries[0] || null;
  }

  return geometry;
};

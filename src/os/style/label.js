goog.provide('os.style.label');

goog.require('goog.async.ConditionalDelay');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.style.Style');
goog.require('os.map');


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.style.label.LOGGER_ = goog.log.getLogger('os.style.label');


/**
 * @typedef {{column: (string|null), showColumn: !boolean}}
 */
os.style.label.LabelConfig;


/**
 * Default label config.
 * @type {!os.style.label.LabelConfig}
 * @const
 */
os.style.label.DEFAULT_LABEL = {
  'column': null,
  'showColumn': false
};


/**
 * Checks whether a set of labels has any non-default labels.
 * @param {Array<os.style.label.LabelConfig>} labels
 * @return {boolean}
 */
os.style.label.hasNonDefaultLabels = function(labels) {
  for (var i = 0, ii = labels.length; i < ii; i++) {
    if (labels[i]['column'] !== os.style.label.DEFAULT_LABEL['column']) {
      return false;
    }
  }

  return true;
};


/**
 * Gets the first non-default set of labels between the feature and layer configs.
 * @param {?Array<os.style.label.LabelConfig>} featureLabels
 * @param {?Array<os.style.label.LabelConfig>} layerLabels
 * @return {!Array<os.style.label.LabelConfig>}
 */
os.style.label.getLabels = function(featureLabels, layerLabels) {
  // prefer feature labels
  if (featureLabels) {
    return featureLabels;
  }

  // no feature labels - check if layer labels are defined and not the defaults
  if (layerLabels && !os.style.label.hasNonDefaultLabels(layerLabels)) {
    return layerLabels;
  }

  // return the default label config
  return [os.style.label.cloneConfig()];
};


/**
 * Clone a label config. This copies explicit properties to avoid properties like $$hashKey and closure_uid_nnn used by
 * Angular and Closure. If a config is not provided, the default config is cloned.
 *
 * @param {os.style.label.LabelConfig=} opt_config The config to clone
 * @return {!os.style.label.LabelConfig}
 */
os.style.label.cloneConfig = function(opt_config) {
  var config = opt_config || os.style.label.DEFAULT_LABEL;
  return {
    'column': config['column'],
    'showColumn': config['showColumn']
  };
};


/**
 * Filter label configs, returning those that are defined and have a column set.
 * @param {Array<os.style.label.LabelConfig>} configs The label configs.
 * @return {!Array<!os.style.label.LabelConfig>}
 */
os.style.label.filterValid = function(configs) {
  if (configs) {
    return configs.filter(function(config) {
      return config != null && !!config['column'];
    });
  }

  return [];
};


/**
 * Default label config.
 * @type {Object}
 * @const
 */
os.style.label.DEFAULT_CONFIG = {
  'offsetY': -5
};


/**
 * Default font size.
 * @type {number}
 * @const
 */
os.style.label.DEFAULT_SIZE = 12;


/**
 * Minimum font size.
 * @type {number}
 * @const
 */
os.style.label.MIN_SIZE = 8;


/**
 * Maximum font size.
 * @type {number}
 * @const
 */
os.style.label.MAX_SIZE = 20;


/**
 * Z-index for label styles.
 * @type {number}
 * @const
 */
os.style.label.Z_INDEX = 500;


/**
 * The truncation length for labels.
 * @type {number}
 * @const
 */
os.style.label.TRUNCATE_LENGTH = 50;


/**
 * Update which features should have their labels shown.
 * @return {boolean}
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.label.updateShown_ = function() {
  // if the map/view aren't ready, return false so the conditional delay will keep trying
  var map = os.map.mapContainer;
  var view;
  if (map && map.getMap() && map.getMap().getView()) {
    view = map.getMap().getView();
  } else {
    return false;
  }

  var resolution = view ? view.getResolution() : undefined;
  if (!goog.isDef(resolution)) {
    return false;
  }

  // check if the view extent is ready to update labels. if the viewport was resized recently, the map size may be zero,
  // which will prevent labels from updating correctly.
  var viewExtent = map.getViewExtent();
  if (ol.extent.equals(viewExtent, os.map.ZERO_EXTENT)) {
    return false;
  }

  // this is precise in 2D but gets less precise in 3D as the globe is tilted/rotated. the extent will still be focused
  // in the center of the screen, but keep this in mind if label updates seem off in 3D.
  var viewPoly = ol.geom.Polygon.fromExtent(viewExtent);
  goog.asserts.assert(viewPoly, 'failed creating polygon from view');

  // reusable extent to reduce GC
  var extent = ol.extent.createEmpty();

  var then = goog.now();
  var labelSources = [];
  var features = [];
  var changed = {};
  var fields = {};

  // gather sources/features that may have labels shown and sorte by z-index so higher indexed layers generate labels
  // first
  var dm = os.dataManager;
  var sources = dm.getSources();
  sources.sort(os.source.zIndexCompare);

  for (var i = 0, ii = sources.length; i < ii; i++) {
    var source = sources[i];
    if (source instanceof os.source.Vector && source.getVisible()) {
      var id = source.getId();
      var config = os.style.StyleManager.getInstance().getLayerConfig(id);
      if (config && config[os.style.StyleField.SHOW_LABELS]) {
        // source is configured to show labels. keep a reference to the label column, init the changed features array.
        fields[id] = config[os.style.StyleField.LABELS];
        changed[id] = [];
        labelSources.push(source);

        // add time-filtered features in the current view extent
        var tempFeatures = source.getFilteredFeatures(false);
        features = features.concat(source.getFeaturesInGeometry(viewPoly, tempFeatures));
      }
    }
  }

  /**
   * @type {Object<string, boolean>}
   */
  var visited = {};
  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    if (!(feature['id'] in visited)) {
      visited[feature['id']] = true;

      // labels set on the feature config take precedence over source labels
      var featureConfig = feature.values_[os.style.StyleType.FEATURE];
      var featureLabels = featureConfig ? featureConfig[os.style.StyleField.LABELS] : null;
      var featureSourceId = feature.values_[os.data.RecordField.SOURCE_ID];
      var layerLabels = fields[featureSourceId];
      var labels = os.style.label.getLabels(featureLabels, layerLabels);
      var labelText = os.style.label.getLabelsText(feature, labels);

      var geometry = os.style.label.defaultGeometryFunction(feature);
      if (!(geometry instanceof ol.geom.SimpleGeometry) || !labelText) {
        // unsupported geometry type or there is no text to display - ignore it
        continue;
      }

      // compute the size of the label on screen. this is accurate for 2D, but Cesium's method of creating labels will
      // result in them being slightly larger.
      var config = os.style.StyleManager.getInstance().getLayerConfig(featureSourceId);
      var labelFont = os.style.label.getFont(config[os.style.StyleField.LABEL_SIZE]);
      var labelSize = os.ui.measureText(labelText, 'feature-label', labelFont);

      // pad labels by 10px to reduce crowding
      var xBuffer = (labelSize.width + 5) * resolution;
      var yBuffer = (labelSize.height + 5) * resolution;

      // show the label for this feature
      if (os.feature.showLabel(feature)) {
        changed[featureSourceId].push(feature);
      }

      // create the map extent for the label (in 2D without rotation)
      var labelCenter = ol.extent.getCenter(geometry.getExtent());
      ol.extent.createOrUpdateFromCoordinate(labelCenter, extent);

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
              if (neighborGeometry && neighborGeometry.getType() != ol.geom.GeometryType.POINT) {
                var neighborCenter = ol.extent.getCenter(neighborGeometry.getExtent());
                if (!ol.extent.containsCoordinate(extent, neighborCenter)) {
                  // the neighbor's label position is not within the extent of the current label, so don't turn it off
                  continue;
                }
              }

              visited[neighbor['id']] = true;

              if (os.feature.hideLabel(neighbor)) {
                changed[labelSourceId].push(neighbor);
              }
            }
          }
        }
      }
    }
  }

  for (var id in changed) {
    if (changed[id].length > 0) {
      // update the style on all changed features so the label will be shown/hidden
      os.style.setFeaturesStyle(changed[id]);

      var layer = map.getLayer(id);
      if (layer) {
        // THIN-6912: use a specific event type since os.layer.PropertyChange.STYLE is handled in many other places,
        // specifically updating the vector controls UI. we only want to tell opensphere to redraw labels.
        os.style.notifyStyleChange(layer, changed[id], os.layer.PropertyChange.LABEL_VISIBILITY);
      }
    }
  }

  var msg = 'Label visibility computed in ' + (goog.now() - then) + 'ms.';
  goog.log.fine(os.style.label.LOGGER_, msg);
  // console.log(msg);

  // return true to stop the conditional delay
  return true;
};


/**
 * A delay to limit how often labels are updated. This reduces bursts of update calls from multiple sources/paths.
 *
 * Label update depends on the map/view being initialized, so the callback is executed using a conditional delay that
 * will fire until the update succeeds or times out.
 *
 * @type {goog.async.ConditionalDelay}
 * @private
 * @const
 */
os.style.label.UPDATE_DELAY_ = new goog.async.ConditionalDelay(os.style.label.updateShown_);


/**
 * Update which features should have their labels shown.
 */
os.style.label.updateShown = function() {
  if (!os.style.label.UPDATE_DELAY_.isActive()) {
    // try once every 100ms for 5 seconds or until the update succeeds
    os.style.label.UPDATE_DELAY_.start(100, 5000);
  }
};


/**
 * Creates or updates a label style for the provided feature. Label styles are saved to each feature instead of being
 * cached on the reader like other styles. This prevents saving a style for each text/font/color combo which would get
 * out of hand real fast.
 *
 * @param {ol.Feature} feature The feature
 * @param {Object} config Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {Array<!ol.style.Style>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.label.createOrUpdate = function(feature, config, opt_layerConfig) {
  var labelStyles = [];

  // always show labels for highlighted features, otherwise show if the flag isn't explicity set to false. this is
  // managed by the hit detection function, and if that isn't run on the feature we should show the label.
  if (feature.values_[os.style.StyleType.HIGHLIGHT] || feature.values_[os.style.StyleField.SHOW_LABELS] !== false) {
    var featureLabels = config[os.style.StyleField.LABELS];
    var layerLabels = opt_layerConfig ?
        opt_layerConfig[os.style.StyleField.LABELS] : [os.style.label.cloneConfig()];
    var labelConfigs = os.style.label.getLabels(featureLabels, layerLabels);

    if (labelConfigs) {
      var labelText = os.style.label.getLabelsText(feature, labelConfigs);
      if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(labelText))) {
        var labels = labelText.split('\n');

        labelStyles =
            /** @type {Array<!ol.style.Style>|undefined} */ (feature.get(os.style.StyleType.LABELS)) || [];

        // reuse label styles when possible, but truncate the array if we have more styles than labels to display
        if (labelStyles.length > labels.length) {
          labelStyles.length = labels.length;
        }

        goog.array.forEach(labels, function(labelText, index) {
          var labelStyle = labelStyles[index];
          if (!labelStyle) {
            // label style hasn't been created for the layer yet - do it now!
            var reader = os.style.StyleManager.getInstance().getReader('text');
            goog.asserts.assert(reader);

            // look for the text style configuration on the feature config, then the layer config.
            // if these change in the future we'll have to rework this a bit.
            var labelConfig = {};
            var baseLabelConfig = /** @type {Object|undefined} */ (os.object.getFirstValue('text', config,
                opt_layerConfig)) || os.style.label.DEFAULT_CONFIG;
            os.style.mergeConfig(baseLabelConfig, labelConfig);

            // create the style using the text reader
            var textStyle = reader.getOrCreateStyle(labelConfig);
            labelStyle = new ol.style.Style({
              geometry: os.style.label.defaultGeometryFunction,
              text: textStyle
            });

            labelStyles.push(labelStyle);
          }

          // update the z-index of the label
          var baseZIndex = config['zIndex'] || 0;
          labelStyle.setZIndex(baseZIndex + os.style.label.Z_INDEX);

          // update the style with dynamic values
          var labelColor = os.style.label.getColor(feature, config, opt_layerConfig);

          // force font size to an integer, and drop NaN values
          var fontSize = /** @type {string|number|undefined} */ (os.object.getFirstValue(
              os.style.StyleField.LABEL_SIZE, config, opt_layerConfig));
          if (typeof fontSize == 'string') {
            fontSize = parseInt(fontSize, 10) || undefined;
          }

          // if there isn't a font size (or it's zero), use the default size to ensure labels are drawn
          if (!fontSize) {
            fontSize = os.style.label.DEFAULT_SIZE;
          }

          var labelFont = os.style.label.getFont(fontSize);
          var text = labelStyle.getText();
          text.setFont(labelFont);
          text.setText(os.style.label.prepareText(labelText, true));
          text.getFill().setColor(labelColor);

          // match the fill/stroke opacity
          var fillColor = ol.color.asArray(labelColor);
          var strokeColor = ol.color.asArray(text.getStroke().getColor());
          strokeColor[3] = fillColor[3];
          text.getStroke().setColor(os.style.toRgbaString(strokeColor));

          // compute the y offset using the font size, number of labels, and current label index so they are rendered
          // in top-down order.
          var center = -(fontSize + 2) * ((labels.length / 2) - 1);
          var offsety = index * (fontSize + 2);
          text.setOffsetY(center + offsety);

          // labels need to be offset a little more when next to an icon. this helps, but isn't nearly complete.
          // TODO: determine the size of the rendered feature and use that for the x offset
          var offsetx = os.style.isIconConfig(config) ? fontSize : (fontSize / 2);
          text.setOffsetX(offsetx);

          // draw labels to the right of the feature
          // TODO: make this configurable. this will require more advanced x/y offset computations.
          text.setTextAlign('left');
        });

        // update the cache on the feature
        feature.set(os.style.StyleType.LABELS, labelStyles, true);
      }
    }
  }

  return labelStyles;
};


/**
 * Prepare label text for display to the user. Strips HTML and newlines and truncates the label.
 *
 * @param {string} text The label text
 * @param {boolean=} opt_truncate If the label should be truncated. Defaults to true.
 * @return {string} The stripped label text, or the original text if an error was encountered
 */
os.style.label.prepareText = function(text, opt_truncate) {
  var truncate = opt_truncate != null ? opt_truncate : false;

  var result;
  try {
    // parse HTML and grab only the remaining text content
    result = new DOMParser().parseFromString(text, 'text/html').body.textContent;

    // strip any line breaks
    result = result.replace(/[\n\r]+/g, ' ');
  } catch (e) {
    result = text;
  }

  if (truncate) {
    result = goog.string.truncate(result, os.style.label.TRUNCATE_LENGTH);
  }

  return result;
};


/**
 * Get the label text for a feature field.
 *
 * @param {ol.Feature} feature The feature
 * @param {string} field The field
 * @return {string} The label text
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.label.getText = function(feature, field) {
  var value;

  // handle special fields here
  switch (field) {
    case os.Fields.TIME:
      value = feature.values_[os.data.RecordField.TIME] || '';
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
 * @param {ol.Feature} feature The feature
 * @param {os.style.label.LabelConfig} label
 * @return {string} the label text
 */
os.style.label.getLabelText = function(feature, label) {
  var value = os.style.label.getText(feature, label['column']);
  if (value && label['showColumn']) {
    // Dont ever just show the key. only if theres a value
    value = label['column'] + ': ' + value;
  }
  return value;
};


/**
 * Gets the text string from all the label fields
 * @param {ol.Feature} feature The feature
 * @param {Array<os.style.label.LabelConfig>} labels
 * @return {string} the label text
 */
os.style.label.getLabelsText = function(feature, labels) {
  var value = '';
  goog.array.forEach(labels, function(label, index) {
    var labelText = os.style.label.getLabelText(feature, label);
    if (labelText) {
      if (index > 0 && value != '') {
        value += '\n';
      }
      value += labelText;
    }
  });
  return value;
};


/**
 * Get the label color for a feature.
 * @param {ol.Feature} feature The feature
 * @param {Object} config Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {string}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.label.getColor = function(feature, config, opt_layerConfig) {
  var color = config[os.style.StyleField.LABEL_COLOR] ||
      (opt_layerConfig && opt_layerConfig[os.style.StyleField.LABEL_COLOR]);
  if (!color || feature.values_[os.style.StyleType.HIGHLIGHT] || feature.values_[os.style.StyleType.SELECT]) {
    // label color wasn't defined, or the feature is highlighed/selected. use the config color.
    color = os.style.getConfigColor(config);
  }

  return color || os.style.DEFAULT_LAYER_COLOR;
};


/**
 * For now we'll just support font size. Non-bold fonts can be hard to read, and we'll assume Arial.
 * @param {number=} opt_size The font size to use.
 * @return {string} The font string
 */
os.style.label.getFont = function(opt_size) {
  // using size/size sets the line height to the font size, creating compact labels
  var size = (opt_size || os.style.label.DEFAULT_SIZE) + 'px';
  return 'bold ' + size + '/' + size + ' Arial';
};


/**
 * Get the default geometry for a feature. If the default geometry is a collection, only use the first geometry in the
 * collection. I intentionally didn't handle collections of collections until we actually encounter it for the sake of
 * simplicity.
 * @param {ol.Feature} feature Feature to get the geometry for.
 * @return {ol.geom.Geometry|undefined} Geometry to render.
 */
os.style.label.defaultGeometryFunction = function(feature) {
  var geometry;
  goog.asserts.assert(feature != undefined, 'feature must be defined');

  // check if the label geometry field is defined explicitly on the feature
  var labelGeometry = /** @type {string|undefined} */ (feature.get(os.style.StyleField.LABEL_GEOMETRY));
  if (labelGeometry) {
    geometry = /** @type {ol.geom.Geometry|undefined} */ (feature.get(labelGeometry));
  }

  // if a geometry isn't found, use the feature default
  if (!geometry) {
    geometry = feature.getGeometry();
  }

  // only display the label on the first geometry in a collection, to avoid excessive labels
  if (geometry instanceof ol.geom.GeometryCollection) {
    var geometries = geometry.getGeometriesArray();
    geometry = geometries && geometries[0] || null;
  }

  return geometry;
};

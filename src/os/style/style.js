/**
 * @fileoverview Some default styles to use for different geometry types. This will be replaced/removed as we start
 * styling features based on the data/user settings.
 */
goog.provide('os.style');

goog.require('goog.array');
goog.require('goog.color');
goog.require('goog.string');
goog.require('ol.color');
goog.require('os.color');
goog.require('os.data.RecordField');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.math.Units');
goog.require('os.object');
goog.require('os.style.StyleField');
goog.require('os.style.StyleType');


/**
 * Default alpha for tile/feature layers.
 * @type {number}
 * @const
 */
os.style.DEFAULT_ALPHA = 1.0;


/**
 * Default color for tile/feature layers.
 * @type {string}
 * @const
 */
os.style.DEFAULT_LAYER_COLOR = 'rgba(255,255,255,1)';


/**
 * Default color for tile/feature layers.
 * @type {string}
 * @const
 */
os.style.DEFAULT_INVERSE_COLOR = 'rgba(255,0,0,1)';


/**
 * Default size for geometries. Radius for points.
 * @type {number}
 * @const
 */
os.style.DEFAULT_FEATURE_SIZE = 3;


/**
 * Default size for geometries. Width for lines/polygons.
 * @type {number}
 * @const
 */
os.style.DEFAULT_STROKE_WIDTH = 3;


/**
 * @type {number}
 * @const
 */
os.style.DEFAULT_ARROW_SIZE = 100;


/**
 * @type {number}
 * @const
 */
os.style.DEFAULT_LOB_LENGTH = 1000;


/**
 * @type {string}
 * @const
 */
os.style.DEFAULT_UNITS = os.math.Units.METERS;


/**
 * @type {string}
 * @const
 */
os.style.DEFAULT_LOB_LENGTH_TYPE = 'manual';


/**
 * @type {number}
 * @const
 */
os.style.DEFAULT_LOB_LENGTH_ERROR = 1;


/**
 * @type {number}
 * @const
 */
os.style.DEFAULT_LOB_BEARING_ERROR = 1;


/**
 * @type {number}
 * @const
 */
os.style.DEFAULT_LOB_MULTIPLIER = 1;


/**
 * Arrow Picture
 * @type {string}
 */
os.style.ARROW_ICON = os.ROOT + 'images/arrow.png';


/**
 * @type {Object<string, *>}
 * @const
 */
os.style.POINT_CONFIG = {
  'image': {
    'type': 'circle'
  }
};


/**
 * Shape types available in the application. These should map to the keys below.
 * @enum {string}
 * @const
 */
os.style.ShapeType = {
  DEFAULT: 'Default',
  NONE: 'None',
  POINT: 'Point',
  SQUARE: 'Square',
  TRIANGLE: 'Triangle',
  ICON: 'Icon',
  ELLIPSE: 'Ellipse',
  ELLIPSE_CENTER: 'Ellipse with Center',
  SELECTED_ELLIPSE: 'Selected Ellipse',
  SELECTED_ELLIPSE_CENTER: 'Selected Ellipse with Center',
  LINE_OF_BEARING: 'Line of Bearing',
  LINE_OF_BEARING_CENTER: 'Line of Bearing with Center'
};


/**
 * @type {string}
 * @const
 */
os.style.DEFAULT_SHAPE = os.style.ShapeType.DEFAULT;


/**
 * @type {string}
 * @const
 */
os.style.DEFAULT_CENTER_SHAPE = os.style.ShapeType.POINT;


/**
 * Shape configurations available in the application. These should only contain values that will override the defaults.
 * @type {!Object<string, (Object|undefined)>}
 * @const
 */
os.style.SHAPES = {
  'Default': undefined,
  'Point': {
    'config': {
      'image': {
        'type': 'circle'
      }
    }
  },
  'Square': {
    'config': {
      'image': {
        'type': 'shape',
        'subType': 'square'
      }
    }
  },
  'Triangle': {
    'config': {
      'image': {
        'type': 'shape',
        'subType': 'triangle'
      }
    }
  },
  'Icon': {
    'config': {
      'image': {
        'type': 'icon'
      }
    }
  },
  'Ellipse': {
    'config': {
      'geometry': os.data.RecordField.ELLIPSE
    }
  },
  'Ellipse with Center': {
    'config': {
      'geometries': [os.data.RecordField.GEOM, os.data.RecordField.ELLIPSE]
    }
  },
  'Selected Ellipse': {
    'config': {
      'selectedConfig': {
        'geometry': os.data.RecordField.ELLIPSE
      }
    }
  },
  'Selected Ellipse with Center': {
    'config': {
      'selectedConfig': {
        'geometries': [os.data.RecordField.GEOM, os.data.RecordField.ELLIPSE]
      }
    }
  },
  'Line of Bearing': {
    'config': {
      'geometries': [os.data.RecordField.LINE_OF_BEARING, os.data.RecordField.LINE_OF_BEARING_ERROR_HIGH,
        os.data.RecordField.LINE_OF_BEARING_ERROR_LOW, os.data.RecordField.ELLIPSE]
    }
  },
  'Line of Bearing with Center': {
    'config': {
      'geometries': [os.data.RecordField.LINE_OF_BEARING, os.data.RecordField.LINE_OF_BEARING_ERROR_HIGH,
        os.data.RecordField.LINE_OF_BEARING_ERROR_LOW, os.data.RecordField.ELLIPSE, os.data.RecordField.GEOM]
    }
  }
};


/**
 * @type {RegExp}
 * @const
 */
os.style.ICON_REGEXP = /icon/i;


/**
 * @type {RegExp}
 * @const
 */
os.style.LOB_REGEXP = /line of bearing/i;


/**
 * @type {RegExp}
 * @const
 */
os.style.ELLIPSE_REGEXP = /ellipse/i;


/**
 * @type {RegExp}
 * @const
 */
os.style.CENTER_REGEXP = /center/i;


/**
 * @type {RegExp}
 * @const
 */
os.style.SELECTED_REGEXP = /selected/i;


/**
 * @type {RegExp}
 * @const
 */
os.style.DEFAULT_REGEXP = /default/i;


/**
 * @type {Object.<string, boolean>}
 */
os.style.CENTER_LOOKUP = (function() {
  var lookup = {};
  for (var key in os.style.SHAPES) {
    lookup[key] = os.style.CENTER_REGEXP.test(key);
  }
  return lookup;
})();


/**
 * Default style config for vector layers
 * @type {!Object}
 * @const
 */
os.style.DEFAULT_VECTOR_CONFIG = {
  // this will only be applied to point types
  'image': {
    'type': 'circle',
    'radius': os.style.DEFAULT_FEATURE_SIZE,
    'fill': {
      'color': os.style.DEFAULT_LAYER_COLOR
    }
  },
  // this will only be applied to line and polygon types
  'stroke': {
    'width': os.style.DEFAULT_STROKE_WIDTH,
    'color': os.style.DEFAULT_LAYER_COLOR
  }
};


/**
 * Z-index for selected features.
 * @type {number}
 * @const
 */
os.style.SELECTED_Z = 100;


/**
 * Z-index for selected features.
 * @type {number}
 * @const
 */
os.style.HIGHLIGHT_Z = 102;


/**
 * Overrides to the default style for selected features
 * @type {!Object}
 * @const
 */
os.style.DEFAULT_SELECT_CONFIG = {
  'image': {
    'color': 'rgba(255,0,0,1)',
    'fill': {
      'color': 'rgba(255,0,0,1)'
    }
  },
  'stroke': {
    'color': 'rgba(255,0,0,1)'
  },
  'zIndex': os.style.SELECTED_Z
};


/**
 * Overrides to the default style for highlighted features
 * @type {!Object}
 * @const
 */
os.style.INVERSE_SELECT_CONFIG = {
  'image': {
    'color': 'rgba(255,255,255,1)',
    'fill': {
      'color': 'rgba(255,255,255,1)'
    },
    'stroke': {
      'color': 'rgba(255,0,0,1)',
      'width': 1
    }
  },
  'stroke': {
    'color': 'rgba(255,255,255,1)'
  },
  'zIndex': os.style.SELECTED_Z + 1
};


/**
 * Overrides to the default style for highlighted features
 * @type {!Object}
 * @const
 */
os.style.DEFAULT_HIGHLIGHT_CONFIG = {
  'image': {
    'color': 'rgba(255,0,0,1)',
    'fill': {
      'color': 'rgba(255,0,0,1)'
    },
    'stroke': {
      'color': 'rgba(255,255,0,1)',
      'width': 1
    }
  },
  'stroke': {
    'color': 'rgba(255,0,0,1)'
  },
  'zIndex': os.style.HIGHLIGHT_Z
};


/**
 * Style config for feature previews.
 * @type {!Object}
 * @const
 */
os.style.PREVIEW_CONFIG = {
  'fill': {
    'color': 'rgba(0,255,255,0.15)'
  },
  'stroke': {
    'width': os.style.DEFAULT_STROKE_WIDTH,
    'color': 'rgba(0,255,255,1)'
  }
};


/**
 * The default style fields to check for a color.
 * @type {!Array<string>}
 * @const
 */
os.style.DEFAULT_COLOR_STYLE_FIELDS = [
  os.style.StyleField.IMAGE,
  os.style.StyleField.FILL,
  os.style.StyleField.STROKE
];


/**
 * Creates an override config for stroke/fill color.
 * @param {string} color The color
 * @return {Object<string, *>} The style config
 */
os.style.createColorOverride = function(color) {
  return {
    'image': {
      'fill': {
        'color': color
      }
    },
    'stroke': {
      'color': color
    }
  };
};


/**
 * Converts all color types to a standard abgr string.
 *
 * @param {Array<number>|string} color Color.
 * @return {string}
 */
os.style.toAbgrString = function(color) {
  var rgba = ol.color.asArray(color);
  var opacity = (rgba.length == 4) ? rgba[3] : 1;
  var abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  var i;
  for (i = 0; i < 4; ++i) {
    var hex = parseInt(abgr[i], 10).toString(16);
    abgr[i] = (hex.length == 1) ? '0' + hex : hex;
  }

  return abgr.join('');
};


/**
 * Converts all color types to a standard rgba string.
 *
 * @param {Array<number>|string} color
 * @return {string}
 */
os.style.toRgbaString = function(color) {
  return ol.color.asString(typeof color === 'string' ? os.color.toRgbArray(color) : color);
};


/**
 * Ordered fields to use in determining the color for a style.
 * @type {!Array<string>}
 * @private
 * @const
 */
os.style.STYLE_COLOR_FIELDS_ = ['image', 'fill', 'stroke'];


/**
 * Gets the first color value defined on the config
 * @param {Object} config The configuration to search for a color
 * @param {boolean=} opt_array If the color should be returned as an rgb array
 * @param {(os.style.StyleField|string)=} opt_colorFieldHint A hint to where to find the color to use.
 * @return {?(string|Array<number>)} The color or null if none was found
 */
os.style.getConfigColor = function(config, opt_array, opt_colorFieldHint) {
  if (config) {
    if (opt_colorFieldHint &&
        config[opt_colorFieldHint] &&
        config[opt_colorFieldHint][os.style.StyleField.COLOR] != null) {
      return opt_array ? os.color.toRgbArray(config[opt_colorFieldHint][os.style.StyleField.COLOR]) :
          config[opt_colorFieldHint][os.style.StyleField.COLOR];
    } else if (config[os.style.StyleField.COLOR] != null) {
      return opt_array ? os.color.toRgbArray(config[os.style.StyleField.COLOR]) :
          config[os.style.StyleField.COLOR];
    } else {
      for (var i = 0; i < os.style.STYLE_COLOR_FIELDS_.length; i++) {
        var key = os.style.STYLE_COLOR_FIELDS_[i];
        if (!os.object.isPrimitive(config[key])) {
          var result = os.style.getConfigColor(config[key], opt_array);

          if (result) {
            return result;
          }
        }
      }
    }
  }

  return null;
};


/**
 * Sets all color values on the config. Colors are always set as an rgba string to minimize conversion both in
 * opensphere style functions and OL3 rendering functions.
 * @param {Object} config
 * @param {Array<number>|string} color
 * @param {Array<string>=} opt_includeStyleFields optional array of style fields to color,
 *                                                e.g. os.style.StyleField.IMAGE.
 */
os.style.setConfigColor = function(config, color, opt_includeStyleFields) {
  if (config) {
    var styleFields = opt_includeStyleFields || os.style.DEFAULT_COLOR_STYLE_FIELDS;
    for (var key in config) {
      // color can exist in the image, fill, or stroke styles. in the case of icons, there may not be a color property
      // but we still need to ensure the color is set correctly. set the color if a key that may contain a color is
      // encountered.
      if (styleFields.indexOf(key) !== -1) {
        config[key][os.style.StyleField.COLOR] = color;
      }

      if (!os.object.isPrimitive(config[key])) {
        os.style.setConfigColor(config[key], color, opt_includeStyleFields);
      }
    }
  }
};


/**
 * Gets the icon used in a config.
 * @param {Object|undefined} config The style config.
 * @return {?osx.icon.Icon} The icon or null if none was found.
 */
os.style.getConfigIcon = function(config) {
  var icon = null;
  if (config) {
    var imageConfig = config[os.style.StyleField.IMAGE];
    if (imageConfig && imageConfig['src']) {
      icon = /** @type {!osx.icon.Icon} */ ({
        path: imageConfig['src']
      });
    }
  }

  return icon;
};


/**
 * Sets all color values on the config. Colors are always set as an rgba string to minimize conversion both in
 * Open Sphere style functions and OL3 rendering functions.
 * @param {Object} config
 * @param {?osx.icon.Icon} icon
 */
os.style.setConfigIcon = function(config, icon) {
  if (icon && config) {
    var imageConfig = config[os.style.StyleField.IMAGE];
    if (imageConfig) {
      imageConfig['src'] = icon['path'];
    }
  }
};


/**
 * Gets the icon rotation column used in a config.
 * @param {Object|undefined} config The style config.
 * @return {number} The icon or null if none was found.
 */
os.style.getConfigIconRotation = function(config) {
  if (config) {
    var imageConfig = config[os.style.StyleField.IMAGE];
    if (imageConfig && imageConfig['rotation']) {
      return imageConfig['rotation'];
    }
  }

  return 0;
};


/**
 * Sets all color opacity values on the config. Colors are always set as an rgba string to minimize conversion both in
 * opensphere style functions and OL3 rendering functions.
 * @param {Object} config The style config.
 * @param {number} opacity The opacity value, from 0 to 1.
 * @param {boolean=} opt_multiply If the opacity should be multiplied with the original.
 */
os.style.setConfigOpacityColor = function(config, opacity, opt_multiply) {
  if (config) {
    var styleFields = os.style.DEFAULT_COLOR_STYLE_FIELDS;
    var colorArr;
    for (var key in config) {
      // color can exist in the image, fill, or stroke styles. in the case of icons, there may not be a color property
      // but we still need to ensure the color is set correctly. set the color if a key that may contain a color is
      // encountered.
      if (styleFields.indexOf(key) !== -1) {
        colorArr = os.color.toRgbArray(config[key][os.style.StyleField.COLOR]);
        if (colorArr) {
          if (opt_multiply) {
            colorArr[3] *= opacity;
          } else {
            colorArr[3] = opacity;
          }

          config[key][os.style.StyleField.COLOR] = os.style.toRgbaString(colorArr);
        }
      }

      if (!os.object.isPrimitive(config[key])) {
        os.style.setConfigOpacityColor(config[key], opacity, opt_multiply);
      }
    }
  }
};


/**
 * Gets first color opacity values on the config. Colors are always set as an rgba string to minimize conversion both in
 * opensphere style functions and OL3 rendering functions.
 * @param {Object} config The style config.
 * @return {number} The opacity value, from 0 to 1.
 */
os.style.getConfigOpacityColor = function(config) {
  if (config) {
    var styleFields = os.style.DEFAULT_COLOR_STYLE_FIELDS;
    var colorArr;
    for (var key in config) {
      // color can exist in the image, fill, or stroke styles. in the case of icons, there may not be a color property
      // but we still need to ensure the color is set correctly. set the color if a key that may contain a color is
      // encountered.
      if (styleFields.indexOf(key) !== -1) {
        colorArr = os.color.toRgbArray(config[key][os.style.StyleField.COLOR]);
        if (colorArr) {
          return colorArr[3];
        }
      }

      if (!os.object.isPrimitive(config[key])) {
        return os.style.getConfigOpacityColor(config[key]);
      }
    }
  }
  return 1;
};


/**
 * Gets the first size value defined on the config
 * @param {Object} config
 * @return {number|undefined} The size
 */
os.style.getConfigSize = function(config) {
  if (config) {
    if (config['radius'] != undefined) {
      return /** @type {number} */ (config['radius']);
    } else if (config['width'] != undefined) {
      return /** @type {number} */ (config['width']);
    } else if (config['scale'] != undefined) {
      return os.style.scaleToSize(/** @type {number} */ (config['scale']));
    } else {
      for (var key in config) {
        if (!os.object.isPrimitive(config[key])) {
          var result = os.style.getConfigSize(config[key]);

          if (result !== undefined) {
            return result;
          }
        }
      }
    }
  }

  return undefined;
};


/**
 * Sets the size config on the object. This may modify the provided size slightly to account for the following:
 *  - Stroke width is not allowed to be < 1 to avoid hiding lines completely.
 *  - Some KML's may use an icon scale of 0 as a hack to hide the icon. OL3 rendering breaks if an icon has a scale of
 *    zero, so we instead make the scale very small.
 *
 * @param {Object} config
 * @param {number} size
 */
os.style.setConfigSize = function(config, size) {
  if (config) {
    for (var key in config) {
      if (key == 'radius') {
        config[key] = size;
      } else if (key == 'scale') {
        config[key] = os.style.sizeToScale(Math.max(size, 0.01));
      } else if (key == 'width') {
        config[key] = Math.max(size, 1);
      } else if (!os.object.isPrimitive(config[key])) {
        if (key == 'stroke') {
          config[key]['width'] = Math.max(size, 1);
        } else if (key == 'image') {
          if (config[key]['type'] == 'icon') {
            config[key]['scale'] = os.style.sizeToScale(Math.max(size, 0.01));
            config[key]['radius'] = undefined;
          } else {
            config[key]['radius'] = size;
            config[key]['scale'] = undefined;
          }
        } else {
          os.style.setConfigSize(config[key], size);
        }
      }
    }
  }
};


/**
 * Merge sizes from two style configs into the target config.
 * @param {Array<number>} sizes
 * @param {number=} opt_default
 * @return {number}
 */
os.style.getMergedSize = function(sizes, opt_default) {
  if (!sizes || !sizes.length) {
    return opt_default || os.style.DEFAULT_FEATURE_SIZE;
  }

  var scale = 1;
  var i = sizes.length;
  while (i--) {
    if (sizes[i] != null) {
      scale *= os.style.sizeToScale(sizes[i]);
    }
  }

  return os.style.scaleToSize(scale);
};


/**
 * Convert a vector size to an icon scale.
 * @param {number} size The vector size value
 * @return {number} The icon scale value
 */
os.style.sizeToScale = function(size) {
  return Math.floor(size / os.style.DEFAULT_FEATURE_SIZE * 100) / 100;
};


/**
 * Convert an icon scale value to a vector size.
 * @param {number} scale The icon scale value
 * @return {number} The vector size value
 */
os.style.scaleToSize = function(scale) {
  return Math.round(scale * os.style.DEFAULT_FEATURE_SIZE);
};


/**
 * Update the style on a feature.
 * @param {!ol.Feature} feature The feature to update
 * @param {os.source.Vector=} opt_source The source containing the feature
 * @param {(Array<ol.style.Style>|ol.style.Style)=} opt_style The style to use
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.setFeatureStyle = function(feature, opt_source, opt_style) {
  var style = opt_style;
  if (!style) {
    var layerConfig = os.style.getLayerConfig(feature, opt_source);
    var baseConfig = os.style.getBaseFeatureConfig(feature, layerConfig);
    style = os.style.createFeatureStyle(feature, baseConfig, layerConfig);
  }

  feature.setStyle(style);

  opt_source = /** @type {os.source.Vector} */ (opt_source || os.feature.getSource(feature));

  if (opt_source && opt_source.idIndex_[feature.id_.toString()]) {
    opt_source.updateIndex(feature);
  }
};


/**
 * @const
 * @type {Array}
 * @private
 */
os.style.scratchFeatureConfigArray_ = [];


/**
 * Update the style on an array of features.
 * @param {Array<!ol.Feature>} features The features to update
 * @param {os.source.Vector=} opt_source The source containing the features
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.setFeaturesStyle = function(features, opt_source) {
  if (features.length > 0) {
    var layerConfigs = [];
    var layerConfig = os.style.getLayerConfig(features[0], opt_source);
    if (layerConfig) {
      layerConfigs.push(layerConfig);
    }

    os.style.addShapeConfigsForLayer_(features[0], layerConfigs);
    var replaceStyle = this.getValue(os.style.StyleField.REPLACE_STYLE, layerConfigs);

    var styleConfigs = [];
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];

      styleConfigs.length = 0;
      if (replaceStyle || !(feature.get(os.style.StyleField.SKIP_LAYER_STYLE))) {
        Array.prototype.push.apply(styleConfigs, layerConfigs);
      }

      var resetLength = styleConfigs.length;
      var featureConfigs = /** @type {Object|undefined} */ (feature.values_[os.style.StyleType.FEATURE]);
      if (!replaceStyle && featureConfigs) {
        if (!Array.isArray(featureConfigs)) {
          var tmp = os.style.scratchFeatureConfigArray_;
          tmp.length = 0;
          tmp[0] = featureConfigs;
          featureConfigs = tmp;
        }

        for (var j = 0, m = featureConfigs.length; j < m; j++) {
          styleConfigs.length = resetLength;
          styleConfigs.push(featureConfigs[i]);
          os.style.addTransientConfig_(feature, featureConfigs[i], styleConfigs);
        }
      }

      var style = os.style.createFeatureStyle(feature, baseConfig, layerConfig);
      os.style.setFeatureStyle(feature, opt_source, style);
    }
  }
};


/**
 * Gets the layer config for a feature.
 * @param {!ol.Feature} feature The feature
 * @param {os.source.Vector=} opt_source The source containing the feature
 * @return {Object|undefined}
 */
os.style.getLayerConfig = function(feature, opt_source) {
  var id = /** @type {string} */ (feature.get(os.data.RecordField.SOURCE_ID));
  return id ? os.style.StyleManager.getInstance().getLayerConfig(id) || os.style.DEFAULT_VECTOR_CONFIG : undefined;
};


/**
 * Adds shape configs to the configs array
 * @param {ol.Feature} feature
 * @param {Array<Object<string, *>>} configs
 * @private
 */
os.style.addShapeConfigsForLayer_ = function(feature, configs) {
  if (/** @type {boolean} */ (feature.get(os.style.StyleField.SKIP_LAYER_STYLE))) {
    return;
  }

  // add shape config from the source if set
  var source = opt_source || os.feature.getSource(feature);
  if (source && os.instanceOf(source, os.source.Vector.NAME)) {
    var sourceShape = source.getGeometryShape();
    var shape = sourceShape ? os.style.SHAPES[sourceShape] : undefined;
    if (shape) {
      if (shape['config']) {
        configs.push(shape['config']);
      }

      if (os.style.CENTER_LOOKUP[sourceShape]) {
        var centerSourceShape = source.getCenterGeometryShape();
        var centerShape = centerSourceShape ? os.style.SHAPES[centerSourceShape] : undefined;
        if (centerShape) {
          if (centerShape['config']) {
            configs.push(centerShape['config']);
          }
        }
      }

      // if the source shape is an icon, set the scale field from the radius (size)
      if (sourceShape == os.style.ShapeType.ICON || centerShape == os.style.ShapeType.ICON) {
        var imageRadius = os.style.getValue(configs);
        if (imageRadius) {
          configs.push({
            'image': {
              'scale': os.style.sizeToScale(imageRadius)
            }
          });
        }
      }
    }
  }
};


/**
 * @const
 * @type {Array<string>}
 * @private
 */
os.style.getValueScratchKeys_ = [];


/**
 * @const
 * @type {Array}
 * @private
 */
os.style.getValueScratchConfigs_ = [];


/**
 * @param {string|Array<string>} keys
 * @param {Object<string, *>|Array<Object<string, *>>} configs
 * @return {*}
 */
os.style.getValue = function(keys, configs) {
  if (!Array.isArray(keys)) {
    var tmpKeys = os.style.getValueScratchKeys_;
    tmpKeys.length = 0;
    tmpKeys.push(keys);
    keys = tmpKeys;
  }

  if (!Array.isArray(configs)) {
    var tmp = os.style.getValueScratchConfigs_;
    tmp[0] = configs;
    configs = tmp;
  }

  var i = configs.length;
  while (i--) {
    var obj = configs[i];
    for (var j = 0, jj = keys.length; j < jj; j++) {
      var key = keys[j];
      if (key in obj) {
        obj = obj[key];
      } else {
        break;
      }
    }

    if (j === keys.length) {
      return obj;
    }
  }
};


/**
 * Check if a config contains an icon style
 * @param {Object} config The config object
 * @return {boolean}
 */
os.style.isIconConfig = function(config) {
  return config[os.style.StyleField.IMAGE] != null && config[os.style.StyleField.IMAGE]['type'] == 'icon';
};


/**
 * @const
 * @type {Object<string, *>}
 * @private
 */
os.style.transientConfig_ = {};

/**
 * @const
 * @type {Object<string, *>}
 * @private
 */
os.style.transientImageConfig_ = {};

/**
 * @const
 * @type {Object<string, *>}
 * @private
 */
os.style.transientStrokeConfig_ = {};


/**
 * @param {Object} obj
 * @private
 */
os.style.clear_ = function(obj) {
  for (var key in obj) {
    obj[key] = undefined;
  }
};


/**
 * @param {!ol.Feature} feature The feature
 * @param {Object<string, *>} baseConfig Base configuration for the feature
 * @param {Array<Object<string, *>>} configs
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.addTransientConfig_ = function(feature, baseConfig, configs) {
  var transientConfig = os.style.transientConfig_;

  os.style.clear_(transientConfig);

  var changed = false;
  if (baseConfig) {
    var i = configs.length;
    var mergedScale = 1;
    while (i--) {
      var size = os.style.getConfigSize(configs[i]);
      if (size) {
        mergedScale *= os.style.sizeToScale(size);
      }
    }

    if (os.style.getValue(os.style.StyleField.IMAGE, configs)) {
      var imageConfig = os.style.transientImageConfig_;
      os.style.clear_(imageConfig);

      imageConfig['radius'] = os.style.scaleToSize(mergedScale);
      imageConfig['scale'] = Math.max(mergedScale, 0.01);

      // rotate icon as specified
      var showRotation = os.style.getValue(os.style.StyleField.SHOW_ROTATION, configs) ||
          feature.values_[os.style.StyleField.SHOW_ROTATION] || false;
      var rotationColumn = os.style.getValue(os.style.StyleField.ROTATION_COLUMN, configs) ||
          feature.values_[os.style.StyleField.ROTATION_COLUMN] || '';
      var rotateAmount = Number(feature.values_[rotationColumn]);
      rotateAmount = typeof rotateAmount === 'number' && !isNaN(rotateAmount) ? rotateAmount : 0;
      imageConfig['rotation'] = showRotation ? goog.math.toRadians(rotateAmount) : 0;

      transientConfig[os.style.StyleField.IMAGE] = imageConfig;
      changed = true;
    }

    if (os.style.getValue(os.style.StyleField.STROKE, configs)) {
      var strokeConfig = os.style.transientStrokeConfig_;
      os.style.clear_(strokeConfig);

      // merge the layer size into the feature size
      var mergedWidth = os.style.scaleToSize(mergedScale);
      strokeConfig['width'] = Math.max(mergedWidth, 1);

      transientConfig[os.style.StyleField.STROKE] = strokeConfig;
      changed = true;
    }
  }

  // color override ALWAYS wins, so apply it whether replacing feature styles or not
  var colorOverride = /** @type {string|undefined} */ (feature.values_[os.data.RecordField.COLOR]);
  if (colorOverride) {
    os.style.setConfigColor(transientConfig, colorOverride);
  }

    // if the feature has a custom opacity set, override the config opacity
  var opacity = /** @type {string|number|undefined} */ (feature.get(os.style.StyleField.OPACITY));
  if (opacity != null && !isNaN(opacity)) {
    transientConfig['opacity'] = Number(opacity);
    changed = true;
  }

  if (changed) {
    configs.push(transientConfig);
  }
};


/**
 * @param {ol.Feature} feature
 * @param {Array<Object<string, *>>} configs
 * @private
 */
os.style.addColorOverrides_ = function(feature, configs) {
  var transientConfig = os.style.transientConfig_;

  var found = false;
  var i = configs.length;
  while (i--) {
    if (configs[i] === transientConfig) {
      found = true;
      break;
    }
  }

  // color override ALWAYS wins, so apply it whether replacing feature styles or not
  var colorOverride = /** @type {string|undefined} */ (feature.values_[os.data.RecordField.COLOR]);
  if (colorOverride) {
    if (os.style.getValue(os.style.StyleField.IMAGE, configs)) {
      transientConfig[os.style.StyleField.IMAGE] = os.style.transientImageConfig_;

    os.style.setConfigColor(transientConfig, colorOverride);
  }

    // if the feature has a custom opacity set, override the config opacity
  var opacity = /** @type {string|number|undefined} */ (feature.get(os.style.StyleField.OPACITY));
  if (opacity != null && !isNaN(opacity)) {
    transientConfig['opacity'] = Number(opacity);
    changed = true;
  }

  if (!found) {
    configs.push(transientConfig);
  }
};

/**
 * Verify appropriate geometries in a config object exist on a feature.
 *
 * @param {!ol.Feature} feature The feature.
 * @param {Array<Object<string, *>>} configs
 * @param {Object=} opt_layerConfig The layerConfig object.
 * @private
 */
os.style.verifyGeometries_ = function(feature, configs) {
  var geometry = os.style.getValue('geometry', configs);
  var geometries = os.style.getValue('geometries', configs);

  if (geometry == os.data.RecordField.LINE_OF_BEARING ||
      (geometries && geometries.indexOf(os.data.RecordField.LINE_OF_BEARING) != -1)) {
    // verify a line of bearing has been created
    var bearingColumn = os.style.getValue(os.style.StyleField.LOB_BEARING_COLUMN, configs);
    if (bearingColumn) {
      var lobOptions = /** type {os.feature.LOBOptions} */ {
        arrowLength: os.style.getValue(os.style.StyleField.ARROW_SIZE, configs),
        arrowUnits: os.style.getValue(os.style.StyleField.ARROW_UNITS, configs),
        bearingColumn: bearingColumn,
        bearingError: os.style.getValue(os.style.StyleField.LOB_BEARING_ERROR, configs),
        bearingErrorColumn: os.style.getValue(os.style.StyleField.LOB_BEARING_ERROR_COLUMN, configs),
        columnLength: os.style.getValue(os.style.StyleField.LOB_COLUMN_LENGTH, configs),
        length: os.style.getValue(os.style.StyleField.LOB_LENGTH, configs),
        lengthType: os.style.getValue(os.style.StyleField.LOB_LENGTH_TYPE, configs),
        lengthColumn: os.style.getValue(os.style.StyleField.LOB_LENGTH_COLUMN, configs),
        lengthUnits: os.style.getValue(os.style.StyleField.LOB_LENGTH_UNITS, configs),
        lengthError: os.style.getValue(os.style.StyleField.LOB_LENGTH_ERROR, configs),
        lengthErrorColumn: os.style.getValue(os.style.StyleField.LOB_LENGTH_ERROR_COLUMN, configs),
        lengthErrorUnits: os.style.getValue(os.style.StyleField.LOB_LENGTH_ERROR_UNITS, configs),
        showArrow: os.style.getValue(os.style.StyleField.SHOW_ARROW, configs),
        showEllipse: os.style.getValue(os.style.StyleField.SHOW_ELLIPSE, configs),
        showError: os.style.getValue(os.style.StyleField.SHOW_ERROR, configs)
      };
      os.feature.createLineOfBearing(feature, true, lobOptions);
    } else {
      os.feature.createLineOfBearing(feature);
    }
  } else if (geometry == os.data.RecordField.ELLIPSE ||
      (geometries && geometries.indexOf(os.data.RecordField.ELLIPSE) != -1)) {
    // verify an ellipse has been created
    os.feature.createEllipse(feature);
  }
};


/**
 * @param {ol.Feature} feature
 * @param {boolean} replaceFeatureStyle
 * @param {Array<Object<string, *>>} configs
 * @private
 */
os.style.addShapeConfigsForFeature_ = function(feature, replaceFeatureStyle, configs) {
};

/**
 * Creates a style from the provided feature.
 * @param {ol.Feature} feature The feature
 * @param {Object} baseConfig Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {Array<ol.style.Style>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.createFeatureStyle = function(feature, baseConfig, opt_layerConfig) {
  var styles = [];
  if (!feature) {
    return styles;
  }

  if (typeof baseConfig.length === 'number') {
    for (var i = 0, n = baseConfig.length; i < n; i++) {
      styles.push(os.style.createFeatureStyle(feature, baseConfig[i], opt_layerConfig));
    }

    return goog.array.flatten(styles);
  } else {
    var featureConfig = os.style.createFeatureConfig(feature, baseConfig, opt_layerConfig);

    // check if the feature has a custom opacity defined
    var opacity = /** @type {string|number|undefined} */ (feature.values_[os.style.StyleField.OPACITY]);
    if (opacity != null && !isNaN(opacity)) {
      opacity = Number(opacity);
    } else {
      opacity = undefined;
    }

    // check if the layer is configured to override the feature style
    var replaceStyle = opt_layerConfig != null && !!opt_layerConfig[os.style.StyleField.REPLACE_STYLE];

    // set the shape if present - check for kml icons
    var shapeName = os.feature.getShapeName(feature, undefined, replaceStyle);
    var shape = shapeName ? os.style.SHAPES[shapeName] : undefined;
    if (shape) {
      if (shape['config']) {
        var shapeConfig = shape['config'];
        os.style.verifyGeometries(feature, shapeConfig, opt_layerConfig);

        var isFeatureIcon = os.style.isIconConfig(featureConfig);
        var isShapeIcon = os.style.isIconConfig(shapeConfig);

        if (shapeName && os.style.CENTER_LOOKUP[shapeName]) { // what about the center?
          var centerShapeName = os.feature.getCenterShapeName(feature, undefined, replaceStyle);
          var centerShape = centerShapeName ? os.style.SHAPES[centerShapeName] : undefined;
          if (centerShape && centerShape['config']) {
            os.style.mergeConfig(centerShape['config'], shapeConfig);
            isShapeIcon = os.style.isIconConfig(centerShape['config']);
          }
        }

        if (isFeatureIcon && !isShapeIcon) {
          // changing an icon config to a non-icon config. we need to dump all of the anchor config so it doesn't
          // affect the positioning of the shape
          var iconConfig = featureConfig[os.style.StyleField.IMAGE];

          var color = os.style.toRgbaString(os.style.getConfigColor(featureConfig) || os.style.DEFAULT_LAYER_COLOR);
          var size = iconConfig['scale'] != null ? os.style.scaleToSize(iconConfig['scale']) :
              os.style.DEFAULT_FEATURE_SIZE;

          var newImageConfig = {
            'radius': size,
            'fill': {
              'color': color
            }
          };

          featureConfig[os.style.StyleField.IMAGE] = newImageConfig;
          featureConfig[os.style.StyleField.STROKE] = featureConfig[os.style.StyleField.STROKE] || {};
          featureConfig[os.style.StyleField.STROKE]['color'] = color;
        } else if (replaceStyle && isFeatureIcon && isShapeIcon) {
          // replace the icon
          os.style.setConfigIcon(featureConfig, os.style.getConfigIcon(opt_layerConfig));
          os.style.setConfigIconRotationFromObject(featureConfig, featureConfig, feature);
        }

        os.style.mergeConfig(shapeConfig, featureConfig);
      }

      if (shape['selectedConfig']) {
        featureConfig['selectedConfig'] = shape['selectedConfig'];
      }
    }

    // merge in the select config
    var selectConfig = /** @type {Object|undefined} */ (feature.values_[os.style.StyleType.SELECT]);
    if (selectConfig) {
      if (opacity != null && selectConfig[os.style.StyleField.IMAGE]) {
        var selectColor = selectConfig[os.style.StyleField.IMAGE]['fill']['color'];
        var color = /** @type {Array<number>} */ (ol.color.asArray(selectColor));
        color[3] = opacity;
        os.style.setConfigColor(selectConfig, color);
      }

      os.style.mergeConfig(selectConfig, featureConfig);

      // add selection-specific shape config if it exists
      if (featureConfig['selectedConfig']) {
        selectConfig = featureConfig['selectedConfig'];
        featureConfig['selectedConfig'] = undefined;

        os.style.verifyGeometries(feature, selectConfig, opt_layerConfig);

        // only add the config if there isn't a geometry field defined or the feature has that field
        if (!selectConfig['geometry'] || feature.values_[selectConfig['geometry']]) {
          os.style.mergeConfig(selectConfig, featureConfig);
        }
      }
    }

    // merge in the highlight config
    var highlightConfig = /** @type {Object|undefined} */ (feature.values_[os.style.StyleType.HIGHLIGHT]);
    if (highlightConfig) {
      os.style.mergeConfig(highlightConfig, featureConfig);
    }

    if (featureConfig['geometries']) {
      // if multiple geometries are defined, create a style for each
      for (var i = 0, n = featureConfig['geometries'].length; i < n; i++) {
        var geometryName = featureConfig['geometries'][i];
        if (feature.values_[geometryName]) {
          featureConfig['geometry'] = geometryName;
          styles.push(os.style.StyleManager.getInstance().getOrCreateStyle(featureConfig));
        }
      }
    } else {
      // otherwise create a single feature style
      styles.push(os.style.StyleManager.getInstance().getOrCreateStyle(featureConfig));
    }

    // merge or create label style if no label geometry is defined, or the current config matches the geometry name
    var labelGeometry = feature.values_[os.style.StyleField.LABEL_GEOMETRY];
    if (!labelGeometry || labelGeometry == featureConfig['geometry']) {
      var labelStyle = os.style.label.createOrUpdate(feature, featureConfig, opt_layerConfig);
      if (labelStyle) {
        // update label opacity if set on the feature
        if (opacity != null) {
          // make sure the stroke opacity changes in addition to the fill
          var textStrokeColor = /** @type {Array<number>|string} */ (labelStyle.text_.stroke_.color_);
          var strokeColor = ol.color.asArray(textStrokeColor);
          strokeColor[3] *= opacity;
          labelStyle.text_.stroke_.color_ = ol.color.toString(strokeColor);

          // use the highlight/select config color if present, otherwise update the opacity
          if (!highlightConfig && !selectConfig) {
            var color = [];
            if (opt_layerConfig && opt_layerConfig[os.style.StyleField.LABEL_COLOR]) {
              // use label override color
              color = ol.color.asArray(opt_layerConfig[os.style.StyleField.LABEL_COLOR]);
            } else {
              color = ol.color.asArray(os.style.getConfigColor(featureConfig));
            }
            color[3] *= opacity;
            labelStyle.text_.fill_.color_ = ol.color.toString(color);
          }
        }

        styles.push(labelStyle);
      }
    }

    return styles;
  }
};


/**
 * Notify that the layer style changed and should be updated.
 * @param {ol.layer.Layer} layer The layer
 * @param {Array<ol.Feature>=} opt_features The features that changed
 * @param {string=} opt_type The style event type
 */
os.style.notifyStyleChange = function(layer, opt_features, opt_type) {
  // olcs will synchronize all features on this event
  var eventType = opt_type || os.layer.PropertyChange.STYLE;
  layer.dispatchEvent(new os.events.PropertyChangeEvent(eventType, opt_features));

  // ol map will refresh off this one. firing the event off the source causes the animation overlay to update as well.
  var source = layer.getSource();
  if (source) {
    source.changed();
  }
};


/**
 * Check whether this style config object has the labels config in it.
 * @param {Object} configEntry Style config object to query
 * @return {boolean} True if the config object contains the labels
 */
os.style.isLabelConfig = function(configEntry) {
  return !!configEntry[os.style.StyleField.LABELS];
};

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
goog.require('os.feature');
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
    'selectedConfig': {
      'geometry': os.data.RecordField.ELLIPSE
    }
  },
  'Selected Ellipse with Center': {
    'selectedConfig': {
      'geometries': [os.data.RecordField.GEOM, os.data.RecordField.ELLIPSE]
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
  return ol.color.asString(goog.isString(color) ? os.color.toRgbArray(color) : color);
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
 * Sets the rotation of an icon
 * Open Sphere style functions and OL3 rendering functions.
 * @param {Object} config
 * @param {boolean} showRotation
 * @param {number} rotateAmount
 */
os.style.setConfigIconRotation = function(config, showRotation, rotateAmount) {
  var rotation = {
    'image': {
      'rotation': showRotation ? goog.math.toRadians(rotateAmount) : 0
    }
  };
  os.style.mergeConfig(rotation, config);
};


/**
 * Sets the rotation of an icon from a config object
 * Open Sphere style functions and OL3 rendering functions.
 * @param {Object} config
 * @param {Object} origin
 * @param {!ol.Feature} feature The feature
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.setConfigIconRotationFromObject = function(config, origin, feature) {
  var showRotation = origin[os.style.StyleField.SHOW_ROTATION] || false;
  var rotationColumn = origin[os.style.StyleField.ROTATION_COLUMN];
  rotationColumn = goog.isString(rotationColumn) ? rotationColumn : '';
  var rotateAmount = Number(feature.values_[rotationColumn]);
  rotateAmount = goog.isNumber(rotateAmount) ? rotateAmount : 0;
  os.style.setConfigIconRotation(config, showRotation, rotateAmount);
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

          if (goog.isDef(result)) {
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
 * @param {Object} featureConfig The feature config
 * @param {Object} layerConfig The layer config
 * @param {number=} opt_default The default size
 * @return {number}
 */
os.style.getMergedSize = function(featureConfig, layerConfig, opt_default) {
  var defaultSize = opt_default || os.style.DEFAULT_FEATURE_SIZE;

  // combine the layer/feature scales to determine the final scale
  var layerSize = os.style.getConfigSize(layerConfig);
  var featureSize = os.style.getConfigSize(featureConfig);
  if (layerSize != null && featureSize != null) {
    // both available, so multiply the scale to determine final scale
    var layerScale = os.style.sizeToScale(layerSize);
    var featureScale = os.style.sizeToScale(featureSize);
    return os.style.scaleToSize(layerScale * featureScale);
  } else {
    // otherwise return the first defined value
    return layerSize || featureSize || defaultSize;
  }
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
 * Get the base style configuration for a feature.
 * @param {!ol.Feature} feature The feature to update.
 * @param {Object=} opt_layerConfig The layer config.
 * @return {!Object} The base style configuration.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.getBaseFeatureConfig = function(feature, opt_layerConfig) {
  // priority: feature > layer > default
  return /** @type {Object|undefined} */ (feature.values_[os.style.StyleType.FEATURE]) || opt_layerConfig ||
      os.style.DEFAULT_VECTOR_CONFIG;
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
};


/**
 * Update the style on an array of features.
 * @param {Array<!ol.Feature>} features The features to update
 * @param {os.source.Vector=} opt_source The source containing the features
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.setFeaturesStyle = function(features, opt_source) {
  if (features.length > 0) {
    var layerConfig = os.style.getLayerConfig(features[0], opt_source);

    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];

      var baseConfig = os.style.getBaseFeatureConfig(feature, layerConfig);
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
  var config;
  var id = /** @type {string} */ (feature.get(os.data.RecordField.SOURCE_ID));
  var skipLayerStyle = /** @type {boolean} */ (feature.get(os.style.StyleField.SKIP_LAYER_STYLE));
  if (id && !skipLayerStyle) {
    config = {};
    // initialize config with the layer configuration or the default vector config
    var defaultConfig = os.style.StyleManager.getInstance().getLayerConfig(id) || os.style.DEFAULT_VECTOR_CONFIG;
    os.style.mergeConfig(defaultConfig, config);

    // add shape config from the source if set
    var source = opt_source || os.feature.getSource(feature);
    if (source && os.instanceOf(source, os.source.Vector.NAME)) {
      var sourceShape = source.getGeometryShape();
      var shape = sourceShape ? os.style.SHAPES[sourceShape] : undefined;
      if (shape) {
        if (shape['config']) {
          var shapeConfig = shape['config'];
          os.style.mergeConfig(shapeConfig, config);
        }

        if (shape['selectedConfig']) {
          config['selectedConfig'] = shape['selectedConfig'];
        }

        // if the source shape is an icon, set the scale field from the radius (size)
        if (sourceShape == os.style.ShapeType.ICON) {
          var imageConfig = config[os.style.StyleField.IMAGE];
          if (imageConfig && imageConfig['radius']) {
            imageConfig['scale'] = os.style.sizeToScale(imageConfig['radius']);
          }
        } else if (os.style.CENTER_LOOKUP[sourceShape]) {
          var centerSourceShape = source.getCenterGeometryShape();
          var centerShape = centerSourceShape ? os.style.SHAPES[centerSourceShape] : undefined;
          if (centerShape) {
            if (centerShape['config']) {
              var centerShapeConfig = centerShape['config'];
              os.style.mergeConfig(centerShapeConfig, config);
            }

            if (centerSourceShape == os.style.ShapeType.ICON) {
              var centerImageConfig = config[os.style.StyleField.IMAGE];
              if (centerImageConfig && centerImageConfig['radius']) {
                centerImageConfig['scale'] = os.style.sizeToScale(centerImageConfig['radius']);
              }
            }
          }
        }
      }
    }
  }

  return config;
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
 * Combines all applicable style configs for a feature.
 * @param {!ol.Feature} feature The feature
 * @param {Object} baseConfig Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {Object}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.style.createFeatureConfig = function(feature, baseConfig, opt_layerConfig) {
  // color override ALWAYS wins, so apply it whether replacing feature styles or not
  var colorOverride = /** @type {string|undefined} */ (feature.values_[os.data.RecordField.COLOR]);

  if (opt_layerConfig && !!opt_layerConfig[os.style.StyleField.REPLACE_STYLE]) {
    if (colorOverride) {
      os.style.setConfigColor(opt_layerConfig, colorOverride);
    }

    return opt_layerConfig;
  }

  // create a clone so we can mess with the config :(
  var featureConfig = {};
  os.style.mergeConfig(baseConfig, featureConfig);

  if (!opt_layerConfig && feature) {
    opt_layerConfig = os.style.getLayerConfig(feature);
  }

  // if the feature has its own style config, we need to resolve a few things against the layer config
  var styleOverride = /** @type {Object|undefined} */ (feature.values_[os.style.StyleType.FEATURE]);
  if (styleOverride && opt_layerConfig) {
    if (styleOverride.length != undefined) {
      styleOverride = styleOverride[0];
    }

    var imageConfig = featureConfig[os.style.StyleField.IMAGE];
    if (imageConfig) {
      // merge the layer size into the feature size
      var mergedSize = os.style.getMergedSize(styleOverride[os.style.StyleField.IMAGE],
          opt_layerConfig[os.style.StyleField.IMAGE], os.style.DEFAULT_FEATURE_SIZE);
      imageConfig['radius'] = mergedSize;
      imageConfig['scale'] = Math.max(os.style.sizeToScale(mergedSize), 0.01);
    } else if (opt_layerConfig[os.style.StyleField.IMAGE]) {
      // ensure the feature has an image config
      featureConfig[os.style.StyleField.IMAGE] = {};
      os.style.mergeConfig(opt_layerConfig[os.style.StyleField.IMAGE],
          featureConfig[os.style.StyleField.IMAGE]);
    }

    // rotate icon as specified
    if (goog.isDef(featureConfig[os.style.StyleField.SHOW_ROTATION]) && // feature action
        goog.isDef(featureConfig[os.style.StyleField.ROTATION_COLUMN])) {
      os.style.setConfigIconRotationFromObject(featureConfig, featureConfig, feature);
    } else if (goog.isDef(feature.values_[os.style.StyleField.SHOW_ROTATION]) && // place
        goog.isDef(feature.values_[os.style.StyleField.ROTATION_COLUMN])) {
      os.style.setConfigIconRotationFromObject(featureConfig, feature.values_, feature);
    }

    var strokeConfig = featureConfig[os.style.StyleField.STROKE];
    if (strokeConfig) {
      // merge the layer size into the feature size
      var mergedWidth = os.style.getMergedSize(styleOverride[os.style.StyleField.STROKE],
          opt_layerConfig[os.style.StyleField.STROKE], os.style.DEFAULT_STROKE_WIDTH);
      strokeConfig['width'] = Math.max(mergedWidth, 1);
    } else if (opt_layerConfig[os.style.StyleField.STROKE]) {
      // ensure the feature has a stroke config
      featureConfig[os.style.StyleField.STROKE] = {};
      os.style.mergeConfig(opt_layerConfig[os.style.StyleField.STROKE],
          featureConfig[os.style.StyleField.STROKE]);
    }
  } else if (opt_layerConfig && goog.isDef(opt_layerConfig[os.style.StyleField.SHOW_ROTATION]) && // rotate icon
      goog.isDef(opt_layerConfig[os.style.StyleField.ROTATION_COLUMN])) {
    os.style.setConfigIconRotationFromObject(featureConfig, opt_layerConfig, feature);
  }

  if (colorOverride) {
    os.style.setConfigColor(featureConfig, colorOverride);
  }

  // if the feature has a custom opacity set, override the config opacity
  var opacity = /** @type {string|number|undefined} */ (feature.get(os.style.StyleField.OPACITY));
  if (opacity != null && !isNaN(opacity)) {
    os.style.setConfigOpacityColor(featureConfig, Number(opacity), true);
  }

  return featureConfig;
};


/**
 * Verify appropriate geometries in a config object exist on a feature.
 * @param {!ol.Feature} feature The feature.
 * @param {!Object} config The config object.
 * @param {Object=} opt_layerConfig The layerConfig object.
 */
os.style.verifyGeometries = function(feature, config, opt_layerConfig) {
  if (config['geometry'] == os.data.RecordField.LINE_OF_BEARING ||
      config['geometries'] && config['geometries'].indexOf(os.data.RecordField.LINE_OF_BEARING) != -1) {
    // verify a line of bearing has been created
    if (opt_layerConfig) {
      var lobOptions = /** type {os.feature.LOBOptions} */ {
        arrowLength: opt_layerConfig[os.style.StyleField.ARROW_SIZE],
        arrowUnits: opt_layerConfig[os.style.StyleField.ARROW_UNITS],
        bearingColumn: opt_layerConfig[os.style.StyleField.LOB_BEARING_COLUMN],
        bearingError: opt_layerConfig[os.style.StyleField.LOB_BEARING_ERROR],
        bearingErrorColumn: opt_layerConfig[os.style.StyleField.LOB_BEARING_ERROR_COLUMN],
        columnLength: opt_layerConfig[os.style.StyleField.LOB_COLUMN_LENGTH],
        length: opt_layerConfig[os.style.StyleField.LOB_LENGTH],
        lengthType: opt_layerConfig[os.style.StyleField.LOB_LENGTH_TYPE],
        lengthColumn: opt_layerConfig[os.style.StyleField.LOB_LENGTH_COLUMN],
        lengthUnits: opt_layerConfig[os.style.StyleField.LOB_LENGTH_UNITS],
        lengthError: opt_layerConfig[os.style.StyleField.LOB_LENGTH_ERROR],
        lengthErrorColumn: opt_layerConfig[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN],
        lengthErrorUnits: opt_layerConfig[os.style.StyleField.LOB_LENGTH_ERROR_UNITS],
        showArrow: opt_layerConfig[os.style.StyleField.SHOW_ARROW],
        showEllipse: opt_layerConfig[os.style.StyleField.SHOW_ELLIPSE],
        showError: opt_layerConfig[os.style.StyleField.SHOW_ERROR]
      };
      os.feature.createLineOfBearing(feature, false, lobOptions);
    } else {
      os.feature.createLineOfBearing(feature);
    }
  } else if (config['geometry'] == os.data.RecordField.ELLIPSE ||
      config['geometries'] && config['geometries'].indexOf(os.data.RecordField.ELLIPSE) != -1) {
    // verify an ellipse has been created
    os.feature.createEllipse(feature);
  }
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

  if (goog.isNumber(baseConfig.length)) {
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
      var labelStyles = os.style.label.createOrUpdate(feature, featureConfig, opt_layerConfig);
      if (labelStyles) {
        // fix all of the styles since we can have multiple labels...
        for (var i = 0; i < labelStyles.length; i++) {
          if (opacity != null) {
            // make sure the stroke opacity changes in addition to the fill
            var textStrokeColor = /** @type {Array<number>|string} */ (labelStyles[i].text_.stroke_.color_);
            var strokeColor = ol.color.asArray(textStrokeColor);
            strokeColor[3] *= opacity;
            labelStyles[i].text_.stroke_.color_ = ol.color.toString(strokeColor);

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
              labelStyles[i].text_.fill_.color_ = ol.color.toString(color);
            }
          }

          styles.push(labelStyles[i]);
        }
      }
    }

    return styles;
  }
};


/**
 * Creates a deep clone of a config, cloning objects but reusing array references. This makes a few assumptions to
 * speed up the process over {@link os.object.merge}:
 * - Arrays will be replaced and never modified, so the original array reference can be used
 * - Objects will not have a length property, so we can detect arrays using that instead of the expensive goog.typeOf
 * - Always overwrite existing properties
 *
 * @param {Object} from The object to merge
 * @param {Object} to The object to which to merge
 */
os.style.mergeConfig = function(from, to) {
  for (var key in from) {
    var fval = from[key];
    if (typeof fval == 'object' && !(typeof fval.length == 'number')) {
      // clone objects into the target
      if (!(key in to)) {
        to[key] = {};
      }

      os.style.mergeConfig(fval, to[key]);
    } else {
      to[key] = fval;
    }
  }
};


/**
 * Notify OL3/Cesium that the layer style changed and things should be updated.
 * @param {ol.layer.Layer} layer The layer
 * @param {Array<ol.Feature>=} opt_features The features that changed
 * @param {string=} opt_type The style event type
 */
os.style.notifyStyleChange = function(layer, opt_features, opt_type) {
  // olcs will synchronize all features on this event
  var eventType = opt_type || os.layer.PropertyChange.STYLE;
  layer.dispatchEvent(new os.events.PropertyChangeEvent(eventType, opt_features));

  // ol3 map will refresh off this one. firing the event off the source causes the animation overlay to update as well.
  layer.getSource().changed();
};

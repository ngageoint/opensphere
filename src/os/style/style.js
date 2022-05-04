/**
 * @fileoverview Some default styles to use for different geometry types. This will be replaced/removed as we start
 * styling features based on the data/user settings.
 */
goog.declareModuleId('os.style');

import {asArray, asString, toString} from 'ol/src/color.js';

import {toRgbArray} from '../color.js';
import RecordField from '../data/recordfield.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import * as osFeature from '../feature/feature.js';
import instanceOf from '../instanceof.js';
import LayerPropertyChange from '../layer/propertychange.js';
import Units from '../math/units.js';
import {IGNORE_VAL, isPrimitive} from '../object/object.js';
import {ROOT} from '../os.js';
import PropertyChange from '../source/propertychange.js';
import SourceClass from '../source/sourceclass.js';
import * as osLabel from './label.js';
import StyleField from './stylefield.js';
import StyleManager from './stylemanager.js';

import StyleType from './styletype.js';

const {equals} = goog.require('goog.array');
const {toRadians} = goog.require('goog.math');

const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * Default alpha for tile/feature layers.
 * @type {number}
 */
export const DEFAULT_ALPHA = 1.0;

/**
 * Default alpha for polygon fills.
 * @type {number}
 */
export const DEFAULT_FILL_ALPHA = 0.0;

/**
 * Default color for tile/feature layers.
 * @type {string}
 */
export const DEFAULT_LAYER_COLOR = 'rgba(255,255,255,1)';

/**
 * Default color for tile/feature layers.
 * @type {string}
 */
export const DEFAULT_INVERSE_COLOR = 'rgba(255,0,0,1)';

/**
 * Default fill color for tile/feature layers.
 * @type {string}
 */
export const DEFAULT_FILL_COLOR = 'rgba(255,255,255,0)';

/**
 * Default size for geometries. Radius for points.
 * @type {number}
 */
export const DEFAULT_FEATURE_SIZE = 3;

/**
 * Default size for geometries. Width for lines/polygons.
 * @type {number}
 */
export const DEFAULT_STROKE_WIDTH = 3;

/**
 * The default style fields to check for line dashes.
 * @type {!Array<string>}
 */
export const DEFAULT_LINE_DASH_STYLE_FIELDS = [
  StyleField.STROKE
];

/**
 * @typedef {{
 *   id: number,
 *   name: string,
 *   pattern: !Array<number>
 * }}
 */
export let styleLineDashOption;

/**
 * Line dash configurations
 * Patterns based on 16 bit number to make it look consistent between map engines
 * @type {!Array<!styleLineDashOption>}
 */
export const LINE_STYLE_OPTIONS = [
  {
    id: 0,
    name: '\u2501\u2501\u2501\u2501\u2501\u2501\u2578',
    pattern: []
  }, {
    id: 1,
    name: '\u2501\u2009\u2501\u2009\u2501\u2009\u2501\u2009\u2501',
    pattern: [12, 4]
  }, {
    id: 2,
    name: '\u2501\u2002\u2501\u2002\u2501\u2002\u2501',
    pattern: [8, 8]
  }, {
    id: 3,
    name: '\u254D\u254D\u254D\u254D\u254D\u254D\u2578',
    pattern: [4, 4, 4, 4]
  }, {
    id: 4,
    name: '\u2501\u2003\u2501\u2003\u2501',
    pattern: [4, 12]
  }, {
    id: 5,
    name: '\u2578\u2578\u2578\u2578\u2578\u2578\u2578',
    pattern: [2, 6, 2, 6]
  }, {
    id: 6,
    name: '\u2501\u257A\u2008\u2501\u257A\u2008\u2501\u257A',
    pattern: [5, 5, 1, 5]
  }, {
    id: 7,
    name: '\u2501\u2505\u2501\u2505\u2501\u2505\u2578',
    pattern: [7, 4, 1, 4]
  }
];

/**
 * @type {number}
 */
export const DEFAULT_ARROW_SIZE = 100;

/**
 * @type {number}
 */
export const DEFAULT_LOB_LENGTH = 1000;

/**
 * @type {string}
 */
export const DEFAULT_UNITS = Units.METERS;

/**
 * @type {string}
 */
export const DEFAULT_LOB_LENGTH_TYPE = 'manual';

/**
 * @type {number}
 */
export const DEFAULT_LOB_LENGTH_ERROR = 1;

/**
 * @type {number}
 */
export const DEFAULT_LOB_BEARING_ERROR = 1;

/**
 * @type {number}
 */
export const DEFAULT_LOB_MULTIPLIER = 1;

/**
 * Arrow Picture
 * @type {string}
 */
export const ARROW_ICON = ROOT + 'images/arrow.png';

/**
 * @typedef {function(Feature):Object|Object}
 */
export let StyleConfigLike;

/**
 * @type {Object<string, *>}
 */
export const POINT_CONFIG = {
  'image': {
    'type': 'circle'
  }
};

/**
 * Shape types available in the application. These should map to the keys below.
 * @enum {string}
 */
export const ShapeType = {
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
 */
export const DEFAULT_SHAPE = ShapeType.DEFAULT;

/**
 * @type {string}
 */
export const DEFAULT_CENTER_SHAPE = ShapeType.POINT;

/**
 * Shape configurations available in the application. These should only contain values that will override the defaults.
 * @type {!Object<string, (Object|undefined)>}
 */
export const SHAPES = {
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
      'geometries': [RecordField.ELLIPSE]
    }
  },
  'Ellipse with Center': {
    'config': {
      'geometries': [RecordField.GEOM, RecordField.ELLIPSE]
    }
  },
  'Selected Ellipse': {
    'selectedConfig': {
      'geometries': [RecordField.ELLIPSE]
    }
  },
  'Selected Ellipse with Center': {
    'selectedConfig': {
      'geometries': [RecordField.GEOM, RecordField.ELLIPSE]
    }
  },
  'Line of Bearing': {
    'config': {
      'geometries': [RecordField.LINE_OF_BEARING, RecordField.LINE_OF_BEARING_ERROR_HIGH,
        RecordField.LINE_OF_BEARING_ERROR_LOW, RecordField.ELLIPSE]
    }
  },
  'Line of Bearing with Center': {
    'config': {
      'geometries': [RecordField.LINE_OF_BEARING, RecordField.LINE_OF_BEARING_ERROR_HIGH,
        RecordField.LINE_OF_BEARING_ERROR_LOW, RecordField.ELLIPSE, RecordField.GEOM]
    }
  }
};

/**
 * @type {RegExp}
 */
export const ICON_REGEXP = /icon/i;

/**
 * @type {RegExp}
 */
export const LOB_REGEXP = /line of bearing/i;

/**
 * @type {RegExp}
 */
export const ELLIPSE_REGEXP = /ellipse/i;

/**
 * @type {RegExp}
 */
export const CENTER_REGEXP = /center/i;

/**
 * @type {RegExp}
 */
export const SELECTED_REGEXP = /selected/i;

/**
 * @type {RegExp}
 */
export const DEFAULT_REGEXP = /default/i;

/**
 * @type {Object.<string, boolean>}
 */
export const CENTER_LOOKUP = (function() {
  var lookup = {};
  for (var key in SHAPES) {
    lookup[key] = CENTER_REGEXP.test(key);
  }
  return lookup;
})();

/**
 * Default style config for vector layers
 * @type {!Object}
 */
export const DEFAULT_VECTOR_CONFIG = {
  // this will only be applied to point types
  'image': {
    'type': 'circle',
    'radius': DEFAULT_FEATURE_SIZE,
    'fill': {
      'color': DEFAULT_LAYER_COLOR
    }
  },
  // this will only be applied to line and polygon types
  'fill': {
    'color': DEFAULT_FILL_COLOR
  },
  'stroke': {
    'width': DEFAULT_STROKE_WIDTH,
    'color': DEFAULT_LAYER_COLOR
  }
};

/**
 * Z-index for selected features.
 * @type {number}
 */
export const SELECTED_Z = 100;

/**
 * Z-index for selected features.
 * @type {number}
 */
export const HIGHLIGHT_Z = 102;

/**
 * Overrides to the default style for selected features
 * @type {!Object}
 */
export const DEFAULT_SELECT_CONFIG = {
  'image': {
    'color': 'rgba(255,0,0,1)',
    'fill': {
      'color': 'rgba(255,0,0,1)'
    }
  },
  'stroke': {
    'color': 'rgba(255,0,0,1)'
  },
  'zIndex': SELECTED_Z
};

/**
 * Overrides to the default style for highlighted features
 * @type {!Object}
 */
export const INVERSE_SELECT_CONFIG = {
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
  'zIndex': SELECTED_Z + 1
};

/**
 * Overrides to the default style for highlighted features
 * @type {!Object}
 */
export const DEFAULT_HIGHLIGHT_CONFIG = {
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
  'zIndex': HIGHLIGHT_Z
};

/**
 * Style config for feature previews.
 * @type {!Object}
 */
export const PREVIEW_CONFIG = {
  'fill': {
    'color': 'rgba(0,255,255,0.15)'
  },
  'stroke': {
    'width': DEFAULT_STROKE_WIDTH,
    'color': 'rgba(0,255,255,1)'
  }
};

/**
 * The default style fields to check for a color.
 * @type {!Array<string>}
 */
export const DEFAULT_COLOR_STYLE_FIELDS = [
  StyleField.IMAGE,
  StyleField.FILL,
  StyleField.STROKE
];

/**
 * Creates an override config for stroke/fill color.
 *
 * @param {string} color The color
 * @return {Object<string, *>} The style config
 */
export const createColorOverride = function(color) {
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
export const toAbgrString = function(color) {
  var rgba = asArray(color);
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
export const toRgbaString = function(color) {
  return asString(typeof color === 'string' ? toRgbArray(color) : color);
};

/**
 * Ordered fields to use in determining the color for a style.
 * @type {!Array<string>}
 */
const STYLE_COLOR_FIELDS_ = ['image', 'fill', 'stroke'];

/**
 * Gets the first color value defined on the config
 *
 * @param {Object} config The configuration to search for a color
 * @param {boolean=} opt_array If the color should be returned as an rgb array
 * @param {StyleField=} opt_colorField The style field to use in locating the color.
 * @return {Array<number>|string|undefined} The color, or null if not found. Returns `undefined` if a style field was
 *                                          provided and the field was not present.
 */
export const getConfigColor = function(config, opt_array, opt_colorField) {
  if (config) {
    //
    // if a specific color field was provided, return:
    //  - null (no color) if the field is null
    //  - config.<field>.color if defined
    //  - undefined (no color found)
    //
    // otherwise:
    //  - return config.color if defined
    //  - search all color fields for the color
    //
    if (opt_colorField) {
      if (config[opt_colorField] === null) {
        return null;
      } else if (config[opt_colorField] && config[opt_colorField][StyleField.COLOR] != null) {
        return opt_array ? toRgbArray(config[opt_colorField][StyleField.COLOR]) :
          config[opt_colorField][StyleField.COLOR];
      }
      return undefined;
    } else if (config[StyleField.COLOR] != null) {
      return opt_array ? toRgbArray(config[StyleField.COLOR]) :
          config[StyleField.COLOR];
    } else {
      for (var i = 0; i < STYLE_COLOR_FIELDS_.length; i++) {
        var key = STYLE_COLOR_FIELDS_[i];
        if (!isPrimitive(config[key])) {
          var result = getConfigColor(config[key], opt_array);

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
 *
 * @param {Object} config
 * @param {Array<number>|string} color
 * @param {Array<string>=} opt_includeStyleFields optional array of style fields to color,
 *                                                e.g. StyleField.IMAGE.
 */
export const setConfigColor = function(config, color, opt_includeStyleFields) {
  if (config) {
    var styleFields = opt_includeStyleFields || DEFAULT_COLOR_STYLE_FIELDS;
    for (var key in config) {
      if (config[key]) {
        // color can exist in the image, fill, or stroke styles. in the case of icons, there may not be a color property
        // but we still need to ensure the color is set correctly. set the color if a key that may contain a color is
        // encountered.
        if (styleFields.indexOf(key) !== -1) {
          config[key][StyleField.COLOR] = color;
        }

        if (!isPrimitive(config[key])) {
          // images should set all of the style fields on their nested object
          setConfigColor(config[key], color,
              key == 'image' ? DEFAULT_COLOR_STYLE_FIELDS : opt_includeStyleFields);
        }
      }
    }
  }
};

/**
 * Sets the fill color, creating the fill object within the config if necessary.
 * Colors are always set as an rgba string to minimize conversion both in opensphere style functions and OL3 rendering functions.
 *
 * @param {Object} config
 * @param {Array<number>|string|null|undefined} color
 */
export const setFillColor = function(config, color) {
  if (config) {
    if (!color) {
      // no fill
      config['fill'] = color;
    } else if (!config['fill']) {
      // adding fill
      config['fill'] = {
        'color': color
      };
    } else {
      // changing fill color
      config['fill']['color'] = color;
    }
  }
};

/**
 * Gets the icon used in a config.
 *
 * @param {Object|undefined} config The style config.
 * @return {?osx.icon.Icon} The icon or null if none was found.
 */
export const getConfigIcon = function(config) {
  var icon = null;
  if (config) {
    var imageConfig = config[StyleField.IMAGE];
    if (imageConfig && imageConfig['src']) {
      icon = /** @type {!osx.icon.Icon} */ ({
        path: imageConfig['src'],
        options: imageConfig['options']
      });
    }
  }

  return icon;
};

/**
 * Sets all color values on the config. Colors are always set as an rgba string to minimize conversion both in
 * Open Sphere style functions and OL3 rendering functions.
 *
 * @param {Object} config
 * @param {?osx.icon.Icon} icon
 */
export const setConfigIcon = function(config, icon) {
  if (icon && config) {
    var imageConfig = config[StyleField.IMAGE];
    if (imageConfig) {
      imageConfig['src'] = icon['path'];
      imageConfig['options'] = icon['options'];
    }
  }
};

/**
 * Sets the rotation of an icon
 * Open Sphere style functions and OL3 rendering functions.
 *
 * @param {Object} config
 * @param {boolean} showRotation
 * @param {number} rotateAmount
 */
export const setConfigIconRotation = function(config, showRotation, rotateAmount) {
  var rotation = {
    'image': {
      'rotation': showRotation ? toRadians(rotateAmount) : 0
    }
  };
  mergeConfig(rotation, config);
};

/**
 * Sets the rotation of an icon from a config object
 * Open Sphere style functions and OL3 rendering functions.
 *
 * @param {Object} config
 * @param {Object} origin
 * @param {!Feature} feature The feature
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const setConfigIconRotationFromObject = function(config, origin, feature) {
  var showRotation = origin[StyleField.SHOW_ROTATION] || false;
  var rotationColumn = origin[StyleField.ROTATION_COLUMN];
  rotationColumn = typeof rotationColumn === 'string' ? rotationColumn : '';
  var rotateAmount = Number(feature.values_[rotationColumn]);
  rotateAmount = typeof rotateAmount === 'number' && !isNaN(rotateAmount) ? rotateAmount : 0;
  setConfigIconRotation(config, showRotation, rotateAmount);
};

/**
 * Gets the icon rotation column used in a config.
 *
 * @param {Object|undefined} config The style config.
 * @return {number} The icon or null if none was found.
 */
export const getConfigIconRotation = function(config) {
  if (config) {
    var imageConfig = config[StyleField.IMAGE];
    if (imageConfig && imageConfig['rotation']) {
      return imageConfig['rotation'];
    }
  }

  return 0;
};

/**
 * Sets all color opacity values on the config. Colors are always set as an rgba string to minimize conversion both in
 * opensphere style functions and OL3 rendering functions.
 *
 * @param {Object} config The style config.
 * @param {number} opacity The opacity value, from 0 to 1.
 * @param {boolean=} opt_multiply If the opacity should be multiplied with the original.
 */
export const setConfigOpacityColor = function(config, opacity, opt_multiply) {
  if (config) {
    var styleFields = DEFAULT_COLOR_STYLE_FIELDS;
    var colorArr;
    for (var key in config) {
      if (config[key]) {
        // color can exist in the image, fill, or stroke styles. in the case of icons, there may not be a color property
        // but we still need to ensure the color is set correctly. set the color if a key that may contain a color is
        // encountered.
        if (styleFields.indexOf(key) !== -1) {
          colorArr = toRgbArray(config[key][StyleField.COLOR]);
          if (colorArr) {
            if (opt_multiply) {
              colorArr[3] *= opacity;
            } else {
              colorArr[3] = opacity;
            }

            config[key][StyleField.COLOR] = toRgbaString(colorArr);
          }
        }

        if (!isPrimitive(config[key])) {
          setConfigOpacityColor(config[key], opacity, opt_multiply);
        }
      }
    }
  }
};

/**
 * Gets first color opacity values on the config. Colors are always set as an rgba string to minimize conversion both in
 * opensphere style functions and OL3 rendering functions.
 *
 * @param {Object} config The style config.
 * @return {number} The opacity value, from 0 to 1.
 */
export const getConfigOpacityColor = function(config) {
  if (config) {
    var styleFields = DEFAULT_COLOR_STYLE_FIELDS;
    var colorArr;
    for (var key in config) {
      if (config[key]) {
        // color can exist in the image, fill, or stroke styles. in the case of icons, there may not be a color property
        // but we still need to ensure the color is set correctly. set the color if a key that may contain a color is
        // encountered.
        if (styleFields.indexOf(key) !== -1) {
          colorArr = toRgbArray(config[key][StyleField.COLOR]);
          if (colorArr) {
            return colorArr[3];
          }
        }

        if (!isPrimitive(config[key])) {
          return getConfigOpacityColor(config[key]);
        }
      }
    }
  }
  return 1;
};

/**
 * Gets the first size value defined on the config
 *
 * @param {Object} config
 * @return {number|undefined} The size
 */
export const getConfigSize = function(config) {
  if (config) {
    if (config['radius'] != undefined) {
      return /** @type {number} */ (config['radius']);
    } else if (config['width'] != undefined) {
      return /** @type {number} */ (config['width']);
    } else if (config['scale'] != undefined) {
      return scaleToSize(/** @type {number} */ (config['scale']));
    } else {
      for (var key in config) {
        if (!isPrimitive(config[key])) {
          var result = getConfigSize(config[key]);

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
export const setConfigSize = function(config, size) {
  if (config) {
    for (var key in config) {
      if (key == 'radius') {
        config[key] = size;
      } else if (key == 'scale') {
        config[key] = sizeToScale(Math.max(size, 0.01));
      } else if (key == 'width') {
        config[key] = Math.max(size, 1);
      } else if (!isPrimitive(config[key])) {
        if (key == 'stroke') {
          config[key]['width'] = Math.max(size, 1);
        } else if (key == 'image') {
          if (config[key]['type'] == 'icon') {
            config[key]['scale'] = sizeToScale(Math.max(size, 0.01));
            config[key]['radius'] = undefined;
          } else {
            config[key]['radius'] = size;
            config[key]['scale'] = undefined;
          }
        } else {
          setConfigSize(config[key], size);
        }
      }
    }
  }
};

/**
 * Merge sizes from two style configs into the target config.
 *
 * @param {Object} featureConfig The feature config
 * @param {Object} layerConfig The layer config
 * @param {number=} opt_default The default size
 * @return {number}
 */
export const getMergedSize = function(featureConfig, layerConfig, opt_default) {
  var defaultSize = opt_default || DEFAULT_FEATURE_SIZE;

  // combine the layer/feature scales to determine the final scale
  var layerSize = getConfigSize(layerConfig);
  var featureSize = getConfigSize(featureConfig);
  if (layerSize != null && featureSize != null) {
    // both available, so multiply the scale to determine final scale
    var layerScale = sizeToScale(layerSize);
    var featureScale = sizeToScale(featureSize);
    return scaleToSize(layerScale * featureScale);
  } else {
    // otherwise return the first defined value
    return layerSize || featureSize || defaultSize;
  }
};

/**
 * Looks up a line style from a dash pattern
 *
 * @param {Array<number>|undefined} pattern
 * @return {styleLineDashOption}
 */
export const dashPatternToOptions = function(pattern) {
  if (Array.isArray(pattern)) {
    for (var i = 0; i < LINE_STYLE_OPTIONS.length; i++) {
      var lineDashOption = /** @type {styleLineDashOption} */ (LINE_STYLE_OPTIONS[i]);
      if (equals(lineDashOption.pattern, pattern)) {
        return lineDashOption;
      }
    }
  }
  return /** @type {styleLineDashOption} */ (LINE_STYLE_OPTIONS[0]);
};

/**
 * @param {Object} config
 * @param {(StyleField|string)=} opt_lineDashFieldHint A hint to where to find the dash to use.
 * @return {Array<number>|undefined} The line dash or null if none was found
 */
export const getConfigLineDash = function(config, opt_lineDashFieldHint) {
  if (config) {
    if (opt_lineDashFieldHint &&
        config[opt_lineDashFieldHint] &&
        config[opt_lineDashFieldHint][StyleField.LINE_DASH] != null) {
      return config[opt_lineDashFieldHint][StyleField.LINE_DASH];
    } else if (config[StyleField.LINE_DASH] != null) {
      return config[StyleField.LINE_DASH];
    } else {
      var key = StyleField.STROKE;
      if (!isPrimitive(config[key])) {
        var result = getConfigLineDash(config[key]);
        if (result) {
          return result;
        }
      }
    }
  }

  return undefined;
};

/**
 * Sets all line dash values on the config.
 *
 * @param {Object} config
 * @param {Array<number>} lineDash
 * @param {Array<string>=} opt_includeLineDashFields optional array of style fields to line dash,
 *                                                e.g. StyleField.IMAGE.
 */
export const setConfigLineDash = function(config, lineDash, opt_includeLineDashFields) {
  if (config) {
    var lineDashFields = opt_includeLineDashFields || DEFAULT_LINE_DASH_STYLE_FIELDS;
    for (var key in config) {
      if (lineDash && lineDashFields.indexOf(key) !== -1) {
        config[key][StyleField.LINE_DASH] = lineDash;
      }

      if (!isPrimitive(config[key])) {
        setConfigLineDash(config[key], lineDash, opt_includeLineDashFields);
      }
    }
  }
};

/**
 * Convert a vector size to an icon scale.
 *
 * @param {number} size The vector size value
 * @return {number} The icon scale value
 */
export const sizeToScale = function(size) {
  return Math.floor(size / DEFAULT_FEATURE_SIZE * 100) / 100;
};

/**
 * Convert an icon scale value to a vector size.
 *
 * @param {number} scale The icon scale value
 * @return {number} The vector size value
 */
export const scaleToSize = function(scale) {
  return Math.round(scale * DEFAULT_FEATURE_SIZE);
};

/**
 * Get the base style configuration for a feature.
 *
 * @param {!Feature} feature The feature to update.
 * @param {Object=} opt_layerConfig The layer config.
 * @return {!Object} The base style configuration.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getBaseFeatureConfig = function(feature, opt_layerConfig) {
  // priority: feature > layer > default
  return (
    /** @type {Object|undefined} */ (feature.values_[StyleType.FEATURE]) || opt_layerConfig ||
        DEFAULT_VECTOR_CONFIG
  );
};

/**
 * Update the style on a feature.
 *
 * @param {!Feature} feature The feature to update
 * @param {VectorSource=} opt_source The source containing the feature
 * @param {(Array<Style>|Style)=} opt_style The style to use
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
let setFeatureStyleFn = function(feature, opt_source, opt_style) {
  var style = opt_style;
  if (!style) {
    var layerConfig = getLayerConfig(feature, opt_source);
    var baseConfig = getBaseFeatureConfig(feature, layerConfig);
    style = createFeatureStyle(feature, baseConfig, layerConfig);
  }

  feature.setStyle(style);

  opt_source = /** @type {VectorSource} */ (opt_source || osFeature.getSource(feature));

  if (opt_source && opt_source.idIndex_[feature.id_.toString()]) {
    opt_source.updateIndex(feature);
  }
};

/**
 * Update the style on a feature.
 *
 * @param {!Feature} feature The feature to update
 * @param {VectorSource=} opt_source The source containing the feature
 * @param {(Array<Style>|Style)=} opt_style The style to use
 */
export const setFeatureStyle = function(feature, opt_source, opt_style) {
  setFeatureStyleFn(feature, opt_source, opt_style);
};

/**
 * @typedef {!function(!Feature, VectorSource=, (Array<Style>|Style)=)}
 */
export let SetFeatureStyleFn;

/**
 * Set the setFeatureStyle function.
 * @param {!SetFeatureStyleFn} fn The function.
 */
export const setSetFeatureStyleFn = (fn) => {
  setFeatureStyleFn = fn;
};

/**
 * Update the style on an array of features.
 *
 * @param {Array<!Feature>} features The features to update
 * @param {VectorSource=} opt_source The source containing the features
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const setFeaturesStyle = function(features, opt_source) {
  if (features.length > 0) {
    var layerConfig = getLayerConfig(features[0], opt_source);

    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];

      var baseConfig = getBaseFeatureConfig(feature, layerConfig);
      var style = createFeatureStyle(feature, baseConfig, layerConfig);
      setFeatureStyle(feature, opt_source, style);
    }
  }
};

/**
 * Gets the layer config for a feature.
 *
 * @param {!Feature} feature The feature
 * @param {VectorSource=} opt_source The source containing the feature
 * @return {Object|undefined}
 */
export const getLayerConfig = function(feature, opt_source) {
  var config;
  var id = /** @type {string} */ (feature.get(RecordField.SOURCE_ID));
  var skipLayerStyle = /** @type {boolean} */ (feature.get(StyleField.SKIP_LAYER_STYLE));
  if (id && !skipLayerStyle) {
    config = {};
    // initialize config with the layer configuration or the default vector config
    var defaultConfig = StyleManager.getInstance().getLayerConfig(id) || DEFAULT_VECTOR_CONFIG;
    mergeConfig(defaultConfig, config);

    // add shape config from the source if set
    var source = opt_source || osFeature.getSource(feature);
    if (source && instanceOf(source, SourceClass.VECTOR)) {
      var sourceShape = source.getGeometryShape();
      var shape = sourceShape ? SHAPES[sourceShape] : undefined;
      if (shape) {
        if (shape['config']) {
          var shapeConfig = shape['config'];
          mergeConfig(shapeConfig, config);
        }

        if (shape['selectedConfig']) {
          config['selectedConfig'] = shape['selectedConfig'];
        }

        // if the source shape is an icon, set the scale field from the radius (size)
        if (sourceShape == ShapeType.ICON) {
          var imageConfig = config[StyleField.IMAGE];
          if (imageConfig && imageConfig['radius']) {
            imageConfig['scale'] = sizeToScale(imageConfig['radius']);
          }
        } else if (CENTER_LOOKUP[sourceShape]) {
          var centerSourceShape = source.getCenterGeometryShape();
          var centerShape = centerSourceShape ? SHAPES[centerSourceShape] : undefined;
          if (centerShape) {
            if (centerShape['config']) {
              var centerShapeConfig = centerShape['config'];
              mergeConfig(centerShapeConfig, config);
            }

            if (centerSourceShape == ShapeType.ICON) {
              var centerImageConfig = config[StyleField.IMAGE];
              if (centerImageConfig && centerImageConfig['radius']) {
                centerImageConfig['scale'] = sizeToScale(centerImageConfig['radius']);
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
 *
 * @param {Object} config The config object
 * @return {boolean}
 */
export const isIconConfig = function(config) {
  return config[StyleField.IMAGE] != null && config[StyleField.IMAGE]['type'] == 'icon';
};

/**
 * Combines all applicable style configs for a feature.
 *
 * @param {!Feature} feature The feature
 * @param {Object} baseConfig Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {!Object}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createFeatureConfig = function(feature, baseConfig, opt_layerConfig) {
  // color override ALWAYS wins, so apply it whether replacing feature styles or not
  var colorOverride = /** @type {string|undefined} */ (feature.values_[RecordField.COLOR]);

  if (opt_layerConfig && !!opt_layerConfig[StyleField.REPLACE_STYLE]) {
    if (colorOverride) {
      setConfigColor(opt_layerConfig, colorOverride);
    }

    return opt_layerConfig;
  }

  // create a clone so we can mess with the config :(
  var featureConfig = {};
  mergeConfig(baseConfig, featureConfig);

  if (!opt_layerConfig && feature) {
    opt_layerConfig = getLayerConfig(feature);
  }

  // if the feature has its own style config, we need to resolve a few things against the layer config
  var styleOverride = /** @type {Object|undefined} */ (feature.values_[StyleType.FEATURE]);
  if (styleOverride && opt_layerConfig) {
    if (styleOverride.length != undefined) {
      styleOverride = styleOverride[0];
    }

    var imageConfig = featureConfig[StyleField.IMAGE];
    if (imageConfig) {
      // merge the layer size into the feature size
      var mergedSize = getMergedSize(styleOverride[StyleField.IMAGE],
          opt_layerConfig[StyleField.IMAGE], DEFAULT_FEATURE_SIZE);
      imageConfig['radius'] = mergedSize;
      imageConfig['scale'] = Math.max(sizeToScale(mergedSize), 0.01);
    } else if (imageConfig !== null && opt_layerConfig[StyleField.IMAGE]) {
      // ensure the feature has an image config
      featureConfig[StyleField.IMAGE] = {};
      mergeConfig(opt_layerConfig[StyleField.IMAGE],
          featureConfig[StyleField.IMAGE]);
    }

    var strokeConfig = featureConfig[StyleField.STROKE];
    if (strokeConfig) {
      // merge the layer size into the feature size
      var mergedWidth = getMergedSize(styleOverride[StyleField.STROKE],
          opt_layerConfig[StyleField.STROKE], DEFAULT_STROKE_WIDTH);
      strokeConfig['width'] = Math.max(mergedWidth, 1);
    } else if (strokeConfig !== null && opt_layerConfig[StyleField.STROKE]) {
      // ensure the feature has a stroke config
      featureConfig[StyleField.STROKE] = {};
      mergeConfig(opt_layerConfig[StyleField.STROKE],
          featureConfig[StyleField.STROKE]);
    }
  }

  // rotate icon as specified
  if (featureConfig[StyleField.SHOW_ROTATION] !== undefined &&
      featureConfig[StyleField.ROTATION_COLUMN] !== undefined) {
    setConfigIconRotationFromObject(featureConfig, featureConfig, feature);
  } else if (feature.values_[StyleField.SHOW_ROTATION] !== undefined &&
      feature.values_[StyleField.ROTATION_COLUMN] !== undefined) {
    setConfigIconRotationFromObject(featureConfig, feature.values_, feature);
  } else if (opt_layerConfig && opt_layerConfig[StyleField.SHOW_ROTATION] !== undefined &&
      opt_layerConfig[StyleField.ROTATION_COLUMN] !== undefined) {
    setConfigIconRotationFromObject(featureConfig, opt_layerConfig, feature);
  }

  if (colorOverride) {
    // only apply the color override to the image and stroke
    setConfigColor(featureConfig, colorOverride, [StyleField.IMAGE, StyleField.STROKE]);
  }

  // if the feature has a custom opacity set, override the config opacity
  var opacity = /** @type {string|number|undefined} */ (feature.get(StyleField.OPACITY));
  if (opacity != null && !isNaN(opacity)) {
    setConfigOpacityColor(featureConfig, Number(opacity), true);
  }

  var ringOptions = feature.get(RecordField.RING_OPTIONS);
  if (ringOptions) {
    var geometries = featureConfig['geometries'];
    if (geometries) {
      if (geometries.indexOf(RecordField.RING) == -1) {
        // add the ring
        geometries.push(RecordField.RING);
      }
    } else {
      // create the geometries field
      featureConfig['geometries'] = [RecordField.GEOM, RecordField.RING];
    }
  }

  return featureConfig;
};

/**
 * Verify appropriate geometries in a config object exist on a feature.
 *
 * @param {!Feature} feature The feature.
 * @param {!Object} config The config object.
 * @param {Object=} opt_layerConfig The layerConfig object.
 */
export const verifyGeometries = function(feature, config, opt_layerConfig) {
  if (config['geometry'] == RecordField.LINE_OF_BEARING ||
      config['geometries'] && config['geometries'].indexOf(RecordField.LINE_OF_BEARING) != -1) {
    // verify a line of bearing has been created
    if (opt_layerConfig) {
      var lobOptions = /** type {osFeature.LOBOptions} */ {
        arrowLength: opt_layerConfig[StyleField.ARROW_SIZE],
        arrowUnits: opt_layerConfig[StyleField.ARROW_UNITS],
        bearingColumn: opt_layerConfig[StyleField.LOB_BEARING_COLUMN],
        bearingError: opt_layerConfig[StyleField.LOB_BEARING_ERROR],
        bearingErrorColumn: opt_layerConfig[StyleField.LOB_BEARING_ERROR_COLUMN],
        columnLength: opt_layerConfig[StyleField.LOB_COLUMN_LENGTH],
        length: opt_layerConfig[StyleField.LOB_LENGTH],
        lengthType: opt_layerConfig[StyleField.LOB_LENGTH_TYPE],
        lengthColumn: opt_layerConfig[StyleField.LOB_LENGTH_COLUMN],
        lengthUnits: opt_layerConfig[StyleField.LOB_LENGTH_UNITS],
        lengthError: opt_layerConfig[StyleField.LOB_LENGTH_ERROR],
        lengthErrorColumn: opt_layerConfig[StyleField.LOB_LENGTH_ERROR_COLUMN],
        lengthErrorUnits: opt_layerConfig[StyleField.LOB_LENGTH_ERROR_UNITS],
        showArrow: opt_layerConfig[StyleField.SHOW_ARROW],
        showEllipse: opt_layerConfig[StyleField.SHOW_ELLIPSE],
        showError: opt_layerConfig[StyleField.SHOW_ERROR]
      };
      osFeature.createLineOfBearing(feature, true, lobOptions);
    } else {
      osFeature.createLineOfBearing(feature);
    }
  } else if (config['geometry'] == RecordField.ELLIPSE ||
      config['geometries'] && config['geometries'].indexOf(RecordField.ELLIPSE) != -1) {
    // verify an ellipse has been created
    osFeature.createEllipse(feature);
  }

  if (config['geometries'] && config['geometries'].indexOf(RecordField.RING) != -1) {
    osFeature.createRings(feature);
  }
};

/**
 * Creates a style from the provided feature.
 *
 * @param {Feature} feature The feature
 * @param {Object} baseConfig Base configuration for the feature
 * @param {Object=} opt_layerConfig Layer configuration for the feature
 * @return {Array<Style>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createFeatureStyle = function(feature, baseConfig, opt_layerConfig) {
  var styles = [];
  if (!feature) {
    return styles;
  }

  if (typeof baseConfig.length === 'number') {
    for (var i = 0, n = baseConfig.length; i < n; i++) {
      styles.push(createFeatureStyle(feature, baseConfig[i], opt_layerConfig));
    }

    return styles.flat();
  } else {
    var featureConfig = createFeatureConfig(feature, baseConfig, opt_layerConfig);

    // check if the feature has a custom opacity defined
    var opacity = /** @type {string|number|undefined} */ (feature.values_[StyleField.OPACITY]);
    if (opacity != null && !isNaN(opacity)) {
      opacity = Number(opacity);
    } else {
      opacity = undefined;
    }

    // check if the layer is configured to override the feature style
    var replaceStyle = opt_layerConfig != null && !!opt_layerConfig[StyleField.REPLACE_STYLE];

    // set the shape if present - check for kml icons
    var shapeName = osFeature.getShapeName(feature, undefined, replaceStyle);
    var shape = shapeName ? SHAPES[shapeName] : undefined;
    if (shape) {
      if (shape['config']) {
        var shapeConfig = shape['config'];
        verifyGeometries(feature, shapeConfig, opt_layerConfig);

        var isFeatureIcon = isIconConfig(featureConfig);
        var isShapeIcon = isIconConfig(shapeConfig);

        if (shapeName && CENTER_LOOKUP[shapeName]) { // what about the center?
          var centerShapeName = osFeature.getCenterShapeName(feature, undefined, replaceStyle);
          var centerShape = centerShapeName ? SHAPES[centerShapeName] : undefined;
          if (centerShape && centerShape['config']) {
            mergeConfig(centerShape['config'], shapeConfig);
            isShapeIcon = isIconConfig(centerShape['config']);
          }
        }

        if (isFeatureIcon && !isShapeIcon) {
          // changing an icon config to a non-icon config. we need to dump all of the anchor config so it doesn't
          // affect the positioning of the shape
          var iconConfig = featureConfig[StyleField.IMAGE];

          var color = toRgbaString(getConfigColor(featureConfig) || DEFAULT_LAYER_COLOR);
          var size = iconConfig['scale'] != null ? scaleToSize(iconConfig['scale']) :
            DEFAULT_FEATURE_SIZE;

          var newImageConfig = {
            'radius': size,
            'fill': {
              'color': color
            }
          };

          featureConfig[StyleField.IMAGE] = newImageConfig;
          featureConfig[StyleField.STROKE] = featureConfig[StyleField.STROKE] || {};
          featureConfig[StyleField.STROKE]['color'] = color;
        } else if (replaceStyle && isFeatureIcon && isShapeIcon) {
          // replace the icon
          setConfigIcon(featureConfig, getConfigIcon(opt_layerConfig));
          setConfigIconRotationFromObject(featureConfig, featureConfig, feature);
        }

        mergeConfig(shapeConfig, featureConfig);
      }

      if (shape['selectedConfig']) {
        featureConfig['selectedConfig'] = shape['selectedConfig'];
      }
    }

    // merge in the select config
    var selectConfig = /** @type {Object|undefined} */ (feature.values_[StyleType.SELECT]);
    if (selectConfig) {
      if (opacity != null && selectConfig[StyleField.IMAGE]) {
        var selectColor = selectConfig[StyleField.IMAGE]['fill']['color'];
        var color = /** @type {Array<number>} */ (asArray(selectColor));
        color[3] = opacity;
        setConfigColor(selectConfig, color);
      }

      mergeConfig(selectConfig, featureConfig);

      // add selection-specific shape config if it exists
      if (featureConfig['selectedConfig']) {
        selectConfig = featureConfig['selectedConfig'];
        featureConfig['selectedConfig'] = undefined;

        verifyGeometries(feature, selectConfig, opt_layerConfig);

        // only add the config if there isn't a geometry field defined or the feature has that field
        if (!selectConfig['geometry'] || feature.values_[selectConfig['geometry']]) {
          mergeConfig(selectConfig, featureConfig);
        }
      }
    }

    // merge in the highlight config
    var highlightConfig = /** @type {Object|undefined} */ (feature.values_[StyleType.HIGHLIGHT]);
    if (highlightConfig) {
      mergeConfig(highlightConfig, featureConfig);
    }

    verifyGeometries(feature, featureConfig);

    if (featureConfig['geometries']) {
      // if multiple geometries are defined, create a style for each
      for (var i = 0, n = featureConfig['geometries'].length; i < n; i++) {
        var geometryName = featureConfig['geometries'][i];
        if (feature.values_[geometryName]) {
          featureConfig['geometry'] = geometryName;
          styles.push(StyleManager.getInstance().getOrCreateStyle(featureConfig));
        }
      }
    } else {
      // otherwise create a single feature style
      styles.push(StyleManager.getInstance().getOrCreateStyle(featureConfig));
    }

    // merge or create label style if no label geometry is defined, or the current config matches the geometry name
    var labelGeometry = feature.values_[StyleField.LABEL_GEOMETRY];
    if (!labelGeometry || labelGeometry == featureConfig['geometry']) {
      var labelStyle = osLabel.createOrUpdate(feature, featureConfig, opt_layerConfig);
      if (labelStyle) {
        // update label opacity if set on the feature
        if (opacity != null) {
          // make sure the stroke opacity changes in addition to the fill
          var textStrokeColor = /** @type {Array<number>|string} */ (labelStyle.text_.stroke_.color_);
          var strokeColor = asArray(textStrokeColor);
          strokeColor[3] *= opacity;
          labelStyle.text_.stroke_.color_ = toString(strokeColor);

          // use the highlight/select config color if present, otherwise update the opacity
          if (!highlightConfig && !selectConfig) {
            var color = [];
            if (opt_layerConfig && opt_layerConfig[StyleField.LABEL_COLOR]) {
              // use label override color
              color = asArray(opt_layerConfig[StyleField.LABEL_COLOR]);
            } else {
              color = asArray(getConfigColor(featureConfig) || DEFAULT_LAYER_COLOR);
            }
            color[3] *= opacity;
            labelStyle.text_.fill_.color_ = toString(color);
          }
        }

        styles.push(labelStyle);
      }
    }

    var additionalStyles = osLabel.createAdditionalLabels(feature, featureConfig, opt_layerConfig);
    if (additionalStyles) {
      styles = styles.concat(additionalStyles);
    }

    return styles;
  }
};

/**
 * Creates a deep clone of a config, cloning objects but reusing array references. This makes a few assumptions to
 * speed up the process over {@link merge}:
 * - Arrays will be replaced and never modified, so the original array reference can be used
 * - Objects will not have a length property, so we can detect arrays using that instead of the expensive goog.typeOf
 * - Always overwrite existing properties
 *
 * @param {Object} from The object to merge
 * @param {Object} to The object to which to merge
 */
export const mergeConfig = function(from, to) {
  for (var key in from) {
    var fval = from[key];
    if (fval === IGNORE_VAL) {
      continue;
    }

    if (fval && typeof fval == 'object' && !(typeof fval.length == 'number')) {
      // clone objects into the target
      if (!(key in to) || to[key] == null) {
        to[key] = {};
      }

      mergeConfig(fval, to[key]);
    } else {
      to[key] = fval;
    }
  }
};

/**
 * Notify that the layer style changed and should be updated.
 *
 * @param {Layer} layer The layer
 * @param {Array<Feature>=} opt_features The features that changed
 * @param {string=} opt_type The Layer style event type
 * @param {Array<string>=} opt_source The Source style event type(s)
 * @param {boolean=} opt_colormodel True if the color model should be bumped to trigger listeners
 */
let notifyStyleChangeFn = function(layer, opt_features, opt_type, opt_source, opt_colormodel) {
  // olcs will synchronize all features on this event
  var eventType = opt_type || LayerPropertyChange.STYLE;
  layer.dispatchEvent(new PropertyChangeEvent(eventType, opt_features));

  // ol map will refresh off this one. firing the event off the source causes the animation overlay to update as well.
  var source = /** @type {VectorSource} */ (layer.getSource());
  if (source) {
    if (opt_colormodel) {
      var colormodel = source.getColorModel();
      if (colormodel) {
        var cfg = colormodel.persist();
        var cm = source.createColorModel();
        cm.restore(cfg);
        source.setColorModel(cm); // trigger the listeners waiting for a new color model
        cm.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE));
      }
    }

    if (opt_source) {
      opt_source.forEach((type) => {
        // send the event on the source
        source.dispatchEvent(new PropertyChangeEvent(type, opt_features));
      });
    }
    source.changed();
  }
};

/**
 * @typedef {!function(Layer, Array<Feature>=, string=, Array<string>=, boolean=)}
 */
export let NotifyStyleChangeFn;

/**
 * Set the notifyStyleChange function.
 * @param {!NotifyStyleChangeFn} fn The function.
 */
export const setNotifyStyleChangeFn = (fn) => {
  notifyStyleChangeFn = fn;
};

/**
 * Notify that the layer style changed and should be updated.
 *
 * @param {Layer} layer The layer
 * @param {Array<Feature>=} opt_features The features that changed
 * @param {string=} opt_type The Layer style event type
 * @param {Array<string>=} opt_source The Source style event type(s)
 * @param {boolean=} opt_colormodel True if the color model should be bumped to trigger listeners
 */
export const notifyStyleChange = function(layer, opt_features, opt_type, opt_source, opt_colormodel) {
  notifyStyleChangeFn(layer, opt_features, opt_type, opt_source, opt_colormodel);
};

/**
 * Check whether this style config object has the labels config in it.
 *
 * @param {Object} configEntry Style config object to query
 * @return {boolean} True if the config object contains the labels
 */
export const isLabelConfig = function(configEntry) {
  return !!configEntry[StyleField.LABELS];
};

/**
 * @param {Style} style
 * @return {boolean}
 */
export const hasNonZeroFillOpacity = function(style) {
  if (style) {
    const fill = style.getFill();
    if (fill) {
      const color = asArray(/** @type {Array<number>|string|null} */ (fill.getColor()));
      return color[3] !== 0;
    }
  }

  return false;
};

/**
 * @param {Style} style
 * @return {boolean}
 */
export const hasNonZeroStrokeOpacity = function(style) {
  if (style) {
    const stroke = style.getStroke();
    if (stroke) {
      const color = asArray(/** @type {Array<number>|string|null} */ (stroke.getColor()));
      return color[3] !== 0;
    }
  }

  return false;
};

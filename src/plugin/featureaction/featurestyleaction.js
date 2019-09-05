goog.provide('plugin.im.action.feature.StyleAction');

goog.require('goog.math');
goog.require('os.color');
goog.require('os.feature');
goog.require('os.im.action.AbstractImportAction');
goog.require('os.implements');
goog.require('os.legend');
goog.require('os.legend.ILegendRenderer');
goog.require('os.object');
goog.require('os.style');
goog.require('os.xml');


/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
plugin.im.action.feature.StyleActionTagName = {
  CENTER_SHAPE: 'centerShape',
  COLOR: 'color',
  ICON_SRC: 'iconSrc',
  ICON_OPTIONS: 'iconOptions',
  FILL_COLOR: 'fillColor',
  FILL_OPACITY: 'fillOpacity',
  LINE_DASH: 'lineDash',
  OPACITY: 'opacity',
  ROTATION_COLUMN: 'rotationColumn',
  SHOW_ROTATION: 'showRotation',
  SHAPE: 'shape',
  SIZE: 'size'
};



/**
 * Import action that sets the style for a {@link ol.Feature}.
 *
 * @extends {os.im.action.AbstractImportAction<ol.Feature>}
 * @implements {os.legend.ILegendRenderer}
 * @constructor
 */
plugin.im.action.feature.StyleAction = function() {
  plugin.im.action.feature.StyleAction.base(this, 'constructor');

  this.id = plugin.im.action.feature.StyleAction.ID;
  this.label = plugin.im.action.feature.StyleAction.LABEL;
  this.configUI = plugin.im.action.feature.StyleAction.CONFIG_UI;
  this.xmlType = plugin.im.action.feature.StyleAction.ID;

  /**
   * The feature style config.
   * @type {!Object}
   */
  this.styleConfig = /** @type {!Object} */ (os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG));
};
goog.inherits(plugin.im.action.feature.StyleAction, os.im.action.AbstractImportAction);
os.implements(plugin.im.action.feature.StyleAction, os.legend.ILegendRenderer.ID);


/**
 * Action identifier.
 * @type {string}
 * @const
 */
plugin.im.action.feature.StyleAction.ID = 'featureStyleAction';


/**
 * Property set on features to indicate they're using a feature style action.
 * @type {string}
 * @const
 */
plugin.im.action.feature.StyleAction.FEATURE_ID = '_featureStyleAction';


/**
 * Action label.
 * @type {string}
 * @const
 */
plugin.im.action.feature.StyleAction.LABEL = 'Set Style';


/**
 * Action edit UI.
 * @type {string}
 * @const
 */
plugin.im.action.feature.StyleAction.CONFIG_UI = 'featureactionstyleconfig';


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.reset = function(items) {
  var resetItems = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item && this.isFeatureStyled(item)) {
      item.set(plugin.im.action.feature.StyleAction.FEATURE_ID, undefined);
      item.set(os.style.StyleField.SHAPE, undefined, true);
      item.set(os.style.StyleField.CENTER_SHAPE, undefined, true);

      // reset the original feature config
      var originalConfig = /** @type {Array|Object|undefined} */
          (item.get(plugin.im.action.feature.StyleType.ORIGINAL));
      item.set(os.style.StyleType.FEATURE, originalConfig, true);
      resetItems.push(item);
    }
  }

  os.style.setFeaturesStyle(resetItems);

  // notify that the layer needs to be updated
  var layer = os.feature.getLayer(items[0]);
  if (layer) {
    os.style.notifyStyleChange(layer, resetItems);
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.execute = function(items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item) {
      // get the existing feature config or create a new one
      var originalConfig = /** @type {Array|Object|undefined} */ (item.get(os.style.StyleType.FEATURE));
      var featureConfig = os.object.unsafeClone(originalConfig) || {};

      // flag this as a temporary style config
      featureConfig['temporary'] = true;

      // merge style changes into the feature config and set it on the feature
      if (goog.isArray(featureConfig)) {
        for (var j = 0; j < featureConfig.length; j++) {
          featureConfig[j]['zIndex'] = 10;
          os.style.mergeConfig(this.styleConfig, featureConfig[j]);
        }
      } else {
        featureConfig['zIndex'] = 10;
        os.style.mergeConfig(this.styleConfig, featureConfig);
      }

      item.set(os.style.StyleType.FEATURE, featureConfig, true);
      item.set(plugin.im.action.feature.StyleAction.FEATURE_ID, this.uid, true);

      if (originalConfig != null && !originalConfig['temporary'] &&
          item.get(plugin.im.action.feature.StyleType.ORIGINAL) == null) {
        // if the original config isn't already set, add a reference back to it
        item.set(plugin.im.action.feature.StyleType.ORIGINAL, originalConfig, true);
      }

      // set the feature shape
      var configShape = this.styleConfig[os.style.StyleField.SHAPE];
      if (configShape && configShape != os.style.DEFAULT_SHAPE) {
        item.set(os.style.StyleField.SHAPE, configShape, true);
      }

      // set the feature center shape
      var configCenterShape = this.styleConfig[os.style.StyleField.CENTER_SHAPE];
      if (configCenterShape && configCenterShape != os.style.DEFAULT_CENTER_SHAPE) {
        item.set(os.style.StyleField.CENTER_SHAPE, configCenterShape, true);
      } else {
        item.set(os.style.StyleField.CENTER_SHAPE, undefined, true);
      }
    }
  }

  // update the style on all features
  os.style.setFeaturesStyle(items);

  // notify that the layer needs to be updated
  var layer = os.feature.getLayer(items[0]);
  if (layer) {
    os.style.notifyStyleChange(layer, items);
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.persist = function(opt_to) {
  opt_to = plugin.im.action.feature.StyleAction.base(this, 'persist', opt_to);
  opt_to['styleConfig'] = this.styleConfig;

  return opt_to;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.restore = function(config) {
  var styleConfig = /** @type {Object|undefined} */ (config['styleConfig']);
  if (styleConfig) {
    //  if the style config is lacking a fill, it's an old config prior to fill support. use the base color with the
    //  default fill opacity.
    if (styleConfig['fill'] === undefined) {
      var color = os.style.getConfigColor(styleConfig);
      if (color) {
        color = os.color.toRgbArray(color);
        color[3] = os.style.DEFAULT_FILL_ALPHA;
        os.style.setFillColor(styleConfig, os.style.toRgbaString(color));
      }
    }

    // create a new object in the same window context as this object
    this.styleConfig = {};
    os.object.merge(styleConfig, this.styleConfig);
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.toXml = function() {
  var element = plugin.im.action.feature.StyleAction.base(this, 'toXml');

  var color = /** @type {Array<number>} */ (os.style.getConfigColor(this.styleConfig, true));
  if (color) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.COLOR, element, os.color.toHexString(color));
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.OPACITY, element,
        String(color.length > 3 ? color[3] : os.style.DEFAULT_ALPHA));
  }

  var fillColor = /** @type {Array<number>} */
      (os.style.getConfigColor(this.styleConfig, true, os.style.StyleField.FILL));
  if (fillColor) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.FILL_COLOR, element,
        os.color.toHexString(fillColor));
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.FILL_OPACITY, element,
        String(fillColor.length > 3 ? fillColor[3] : os.style.DEFAULT_FILL_ALPHA));
  }

  var size = os.style.getConfigSize(this.styleConfig);
  if (size != null) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.SIZE, element, String(size));
  }

  var lineDash = os.style.getConfigLineDash(this.styleConfig);
  if (lineDash != null) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.LINE_DASH, element, JSON.stringify(lineDash));
  }

  var shape = this.styleConfig[os.style.StyleField.SHAPE] || os.style.DEFAULT_SHAPE;
  os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.SHAPE, element, String(shape));

  if (shape == os.style.ShapeType.ICON) {
    var icon = os.style.getConfigIcon(this.styleConfig) || os.ui.file.kml.getDefaultIcon();
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.ICON_SRC, element, icon.path);
  }

  var centerShape = this.styleConfig[os.style.StyleField.CENTER_SHAPE] || os.style.DEFAULT_CENTER_SHAPE;
  os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.CENTER_SHAPE, element, String(centerShape));

  if (centerShape == os.style.ShapeType.ICON) {
    var icon = os.style.getConfigIcon(this.styleConfig) || os.ui.file.kml.getDefaultIcon();
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.ICON_SRC, element, icon.path);
  }

  var showRotation = this.styleConfig[os.style.StyleField.SHOW_ROTATION];
  if (showRotation != null) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.SHOW_ROTATION, element, String(showRotation));
  }

  var rotationColumn = this.styleConfig[os.style.StyleField.ROTATION_COLUMN];
  if (rotationColumn != null) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.ROTATION_COLUMN, element, String(rotationColumn));
  }

  if (shape == os.style.ShapeType.ICON || centerShape == os.style.ShapeType.ICON) {
    var icon = os.style.getConfigIcon(this.styleConfig) || os.ui.file.kml.getDefaultIcon();
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.ICON_OPTIONS, element,
        JSON.stringify(icon.options));
  }

  return element;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.fromXml = function(xml) {
  var styleConfig = /** @type {!Object} */ (os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG));

  if (xml) {
    var colorArr;
    var color = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.COLOR);
    if (os.color.isColorString(color)) {
      colorArr = os.color.toRgbArray(color);
      if (colorArr) {
        var opacityVal = parseFloat(
            os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.OPACITY));
        var opacity = !isNaN(opacityVal) ? goog.math.clamp(opacityVal, 0, 1) : os.style.DEFAULT_ALPHA;
        colorArr[3] = opacity;
        color = os.style.toRgbaString(colorArr);
      }

      os.style.setConfigColor(styleConfig, color);
    }

    var fillColor = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.FILL_COLOR);
    if (os.color.isColorString(fillColor)) {
      var fillColorArr = os.color.toRgbArray(fillColor);
      if (fillColorArr) {
        var fillOpacityVal = parseFloat(
            os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.FILL_OPACITY));
        var fillOpacity = !isNaN(fillOpacityVal) ? goog.math.clamp(fillOpacityVal, 0, 1) : os.style.DEFAULT_FILL_ALPHA;
        fillColorArr[3] = fillOpacity;
        fillColor = os.style.toRgbaString(fillColorArr);
      }
    } else if (colorArr) {
      // No fill color in the XML, so use the base color with 0 opacity
      var fillColorArr = colorArr.slice();
      fillColorArr[3] = 0;
      fillColor = os.style.toRgbaString(fillColorArr);
    }

    if (os.color.isColorString(fillColor)) {
      // Only change the fill color without changing the image fill color too
      os.style.setFillColor(styleConfig, fillColor);
    }

    var size = parseFloat(os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.SIZE));
    if (!isNaN(size)) {
      os.style.setConfigSize(styleConfig, size);
    }

    var lineData = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.LINE_DASH);
    if (lineData) {
      var lineDash = JSON.parse(lineData);
      if (lineDash && goog.isArray(lineDash)) {
        os.style.setConfigLineDash(styleConfig, /** @type {Array<number>} */ (lineDash));
      }
    }

    var shape = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.SHAPE);
    if (shape) {
      styleConfig[os.style.StyleField.SHAPE] = shape;

      var centerShape = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.CENTER_SHAPE);
      if (centerShape) {
        styleConfig[os.style.StyleField.CENTER_SHAPE] = centerShape;
      }
      if (shape == os.style.ShapeType.ICON ||
          (os.style.CENTER_LOOKUP[shape] && centerShape === os.style.ShapeType.ICON)) {
        var iconSrc = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.ICON_SRC);
        var iconOptions = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.ICON_OPTIONS) || '{}';
        iconOptions = typeof JSON.parse(iconOptions) === 'object' ? JSON.parse(iconOptions) : {};
        os.style.setConfigIcon(styleConfig, /** @type {!osx.icon.Icon} */ ({
          path: iconSrc,
          options: iconOptions
        }));
      }
    }

    var showRotation = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.SHOW_ROTATION);
    if (showRotation != null) {
      styleConfig[os.style.StyleField.SHOW_ROTATION] = Boolean(showRotation);
    }

    var rotationColumn = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.ROTATION_COLUMN);
    if (rotationColumn != null) {
      styleConfig[os.style.StyleField.ROTATION_COLUMN] = rotationColumn;
    }
  }

  this.styleConfig = styleConfig;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.renderLegend = function(options, var_args) {
  var features = /** @type {Array<!ol.Feature>} */ (arguments[1]);
  if (features && features.length > 0 && features.some(this.isFeatureStyled, this)) {
    var entry = arguments[2];
    if (entry instanceof os.im.action.FilterActionEntry) {
      // clone so we can modify it freely
      var config = /** @type {!Object} */ (os.object.unsafeClone(this.styleConfig));

      var geomShape = /** @type {string|undefined} */ (config['shape']) || os.style.DEFAULT_SHAPE;
      var shape = os.style.SHAPES[geomShape];
      if (shape && shape['config'] && shape['config']['image']) {
        os.style.mergeConfig(shape['config'], config);

        // scale with font size
        if (geomShape == os.style.ShapeType.ICON) {
          // icons are normalized to 32px, so scale based on that
          os.object.set(config, ['image', 'scale'], options.fontSize / 32);
        } else {
          os.object.set(config, ['image', 'radius'], Math.round(options.fontSize / 3));
        }
      }

      var offsetX = options.showVector ? 10 : 0;
      os.legend.queueVectorConfig(config, options, entry.getTitle(), offsetX);
    }
  }
};


/**
 * If a feature is styled by the action.
 *
 * @param {!ol.Feature} feature The feature.
 * @return {boolean} If the feature is using this style action.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
plugin.im.action.feature.StyleAction.prototype.isFeatureStyled = function(feature) {
  return feature.values_[plugin.im.action.feature.StyleAction.FEATURE_ID] === this.uid;
};

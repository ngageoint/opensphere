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
  OPACITY: 'opacity',
  ROTATION_COLUMN: 'rotationColumn',
  SHOW_ROTATION: 'showRotation',
  SHAPE: 'shape',
  SIZE: 'size'
};



/**
 * Import action that sets the style for a {@link ol.Feature}.
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
   * Unique identifier for this action.
   * @type {number}
   * @protected
   */
  this.uid = goog.getUid(this);

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
plugin.im.action.feature.StyleAction.prototype.execute = function(items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item) {
      // get the existing feature config or create a new one
      var featureConfig = /** @type {Array|Object|undefined} */ (os.object.unsafeClone(
          item.get(os.style.StyleType.FEATURE))) || {};

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

      // set the feature shape
      var configShape = this.styleConfig[os.style.StyleField.SHAPE];
      if (configShape && configShape != os.style.DEFAULT_SHAPE) {
        item.set(os.style.StyleField.SHAPE, configShape, true);
      } else {
        item.set(os.style.StyleField.SHAPE, undefined, true);
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
        String(color.length > 3 ? color[3] : 1.0));
  }

  var size = os.style.getConfigSize(this.styleConfig);
  if (size != null) {
    os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.SIZE, element, String(size));
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

  var showRotation = this.styleConfig[os.style.StyleField.SHOW_ROTATION] || false;
  os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.SHOW_ROTATION, element, String(showRotation));

  var rotationColumn = this.styleConfig[os.style.StyleField.ROTATION_COLUMN] || false;
  os.xml.appendElement(plugin.im.action.feature.StyleActionTagName.ROTATION_COLUMN, element, String(rotationColumn));

  return element;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.fromXml = function(xml) {
  var styleConfig = /** @type {!Object} */ (os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG));

  if (xml) {
    var color = os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.COLOR);
    if (os.color.isColorString(color)) {
      var colorArr = os.color.toRgbArray(color);
      if (colorArr) {
        var opacityVal = parseFloat(
            os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.OPACITY));
        var opacity = !isNaN(opacityVal) ? goog.math.clamp(opacityVal, 0, 1) : 1.0;
        colorArr[3] = opacity;
        color = os.style.toRgbaString(colorArr);
      }

      os.style.setConfigColor(styleConfig, color);
    }

    var size = parseFloat(os.xml.getChildValue(xml, plugin.im.action.feature.StyleActionTagName.SIZE));
    if (!isNaN(size)) {
      os.style.setConfigSize(styleConfig, size);
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
        os.style.setConfigIcon(styleConfig, /** @type {!osx.icon.Icon} */ ({
          path: iconSrc
        }));
      }
    }

    styleConfig[os.style.StyleField.SHOW_ROTATION] = Boolean(os.xml.getChildValue(xml,
        plugin.im.action.feature.StyleActionTagName.SHOW_ROTATION));
    styleConfig[os.style.StyleField.ROTATION_COLUMN] = os.xml.getChildValue(xml,
        plugin.im.action.feature.StyleActionTagName.ROTATION_COLUMN);
  }

  this.styleConfig = styleConfig;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.StyleAction.prototype.renderLegend = function(options, var_args) {
  var features = /** @type {Array<!ol.Feature>} */ (arguments[1]);
  if (features && features.length > 0 && features.some(plugin.im.action.feature.StyleAction.isFeatureStyled, this)) {
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
 * @param {!ol.Feature} feature The feature.
 * @return {boolean} If the feature is using this style action.
 * @this plugin.im.action.feature.StyleAction
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
plugin.im.action.feature.StyleAction.isFeatureStyled = function(feature) {
  return feature.values_[plugin.im.action.feature.StyleAction.FEATURE_ID] === this.uid;
};

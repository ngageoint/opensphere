goog.declareModuleId('plugin.im.action.feature.StyleAction');

import * as osColor from '../../os/color.js';
import {getLayer} from '../../os/feature/feature.js';
import AbstractImportAction from '../../os/im/action/abstractimportaction.js';
import FilterActionEntry from '../../os/im/action/filteractionentry.js';
import osImplements from '../../os/implements.js';
import ILegendRenderer from '../../os/legend/ilegendrenderer.js';
import * as legend from '../../os/legend/legend.js';
import * as osObject from '../../os/object/object.js';
import * as osStyle from '../../os/style/style.js';
import StyleField from '../../os/style/stylefield.js';
import StyleType from '../../os/style/styletype.js';
import * as kml from '../../os/ui/file/kml/kml.js';
import * as osXml from '../../os/xml.js';
import {StyleType as FAStyleType} from './featureaction.js';
import {directiveTag as configUi} from './ui/featurestyleactionconfig.js';

const math = goog.require('goog.math');


/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
const StyleActionTagName = {
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
 * @extends {AbstractImportAction<ol.Feature>}
 * @implements {ILegendRenderer}
 */
export default class StyleAction extends AbstractImportAction {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.id = StyleAction.ID;
    this.label = StyleAction.LABEL;
    this.configUI = configUi;
    this.xmlType = StyleAction.ID;

    /**
     * The feature style config.
     * @type {!Object}
     */
    this.styleConfig = /** @type {!Object} */ (osObject.unsafeClone(osStyle.DEFAULT_VECTOR_CONFIG));
  }

  /**
   * @inheritDoc
   */
  reset(items) {
    var resetItems = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item && this.isFeatureStyled(item)) {
        item.set(StyleAction.FEATURE_ID, undefined);
        item.set(StyleField.SHAPE, undefined, true);
        item.set(StyleField.CENTER_SHAPE, undefined, true);

        // reset the original feature config
        var originalConfig = /** @type {Array|Object|undefined} */ (item.get(FAStyleType.ORIGINAL));
        item.set(StyleType.FEATURE, originalConfig, true);
        resetItems.push(item);
      }
    }

    return (this.configureNotify_(resetItems, true));
  }

  /**
   * @inheritDoc
   */
  execute(items) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item) {
        // get the existing feature config or create a new one
        var originalConfig = /** @type {Array|Object|undefined} */ (item.get(StyleType.FEATURE));
        var featureConfig = osObject.unsafeClone(originalConfig) || {};

        // flag this as a temporary style config
        featureConfig['temporary'] = true;

        // merge style changes into the feature config and set it on the feature
        if (Array.isArray(featureConfig)) {
          for (var j = 0; j < featureConfig.length; j++) {
            featureConfig[j]['zIndex'] = 10;
            osStyle.mergeConfig(this.styleConfig, featureConfig[j]);
          }
        } else {
          featureConfig['zIndex'] = 10;
          osStyle.mergeConfig(this.styleConfig, featureConfig);
        }

        item.set(StyleType.FEATURE, featureConfig, true);
        item.set(StyleAction.FEATURE_ID, this.uid, true);

        if (originalConfig != null && !originalConfig['temporary'] &&
              item.get(FAStyleType.ORIGINAL) == null) {
          // if the original config isn't already set, add a reference back to it
          item.set(FAStyleType.ORIGINAL, originalConfig, true);
        }

        // set the feature shape
        var configShape = this.styleConfig[StyleField.SHAPE];
        if (configShape && configShape != osStyle.DEFAULT_SHAPE) {
          item.set(StyleField.SHAPE, configShape, true);
        }

        // set the feature center shape
        var configCenterShape = this.styleConfig[StyleField.CENTER_SHAPE];
        if (configCenterShape && configCenterShape != osStyle.DEFAULT_CENTER_SHAPE) {
          item.set(StyleField.CENTER_SHAPE, configCenterShape, true);
        } else {
          item.set(StyleField.CENTER_SHAPE, undefined, true);
        }
      }
    }

    return (this.configureNotify_(items));
  }

  /**
   * Send out notification(s) to the Layer, Source, and/or ColorModel
   *
   * @param {!Array<!ol.Feature>} items the list of features
   * @param {boolean=} opt_resetcolor true if the color should be reset
   * @return {ImportActionCallbackConfig}
   * @private
   */
  configureNotify_(items, opt_resetcolor) {
    var config = /** @type {ImportActionCallbackConfig} */ ({
      labelUpdateShown: false,
      notifyStyleChange: false,
      setColor: false,
      setFeaturesStyle: true
    });

    var layer = getLayer(items[0]);
    if (layer) {
      var source = /** @type {VectorSource} */ (layer.getSource());
      var color = (this.styleConfig['stroke']) ? this.styleConfig['stroke']['color'] : null;

      if (source && color) {
        config.setColor = true;

        if (!opt_resetcolor) {
          config.color = [[items, color]];
        }
      }

      config.notifyStyleChange = true;
    }
    return config;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['styleConfig'] = this.styleConfig;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    var styleConfig = /** @type {Object|undefined} */ (config['styleConfig']);
    if (styleConfig) {
      // clone the config before doing this to avoid changing the config by reference
      styleConfig = osObject.unsafeClone(styleConfig);

      //  if the style config is lacking a fill, it's an old config prior to fill support. use the base color with the
      //  default fill opacity.
      if (styleConfig['fill'] === undefined) {
        var color = osStyle.getConfigColor(styleConfig);
        if (color) {
          color = osColor.toRgbArray(color);
          color[3] = osStyle.DEFAULT_FILL_ALPHA;
          osStyle.setFillColor(styleConfig, osStyle.toRgbaString(color));
        }
      }

      // create a new object in the same window context as this object
      this.styleConfig = {};
      osObject.merge(styleConfig, this.styleConfig);
    }
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var element = super.toXml();

    var color = /** @type {Array<number>} */ (osStyle.getConfigColor(this.styleConfig, true));
    if (color) {
      osXml.appendElement(StyleActionTagName.COLOR, element, osColor.toHexString(color));
      osXml.appendElement(StyleActionTagName.OPACITY, element,
          String(color.length > 3 ? color[3] : osStyle.DEFAULT_ALPHA));
    }

    var fillColor = /** @type {Array<number>} */
        (osStyle.getConfigColor(this.styleConfig, true, StyleField.FILL));
    if (fillColor) {
      osXml.appendElement(StyleActionTagName.FILL_COLOR, element,
          osColor.toHexString(fillColor));
      osXml.appendElement(StyleActionTagName.FILL_OPACITY, element,
          String(fillColor.length > 3 ? fillColor[3] : osStyle.DEFAULT_FILL_ALPHA));
    }

    var size = osStyle.getConfigSize(this.styleConfig);
    if (size != null) {
      osXml.appendElement(StyleActionTagName.SIZE, element, String(size));
    }

    var lineDash = osStyle.getConfigLineDash(this.styleConfig);
    if (lineDash != null) {
      osXml.appendElement(StyleActionTagName.LINE_DASH, element, JSON.stringify(lineDash));
    }

    var shape = this.styleConfig[StyleField.SHAPE] || osStyle.DEFAULT_SHAPE;
    osXml.appendElement(StyleActionTagName.SHAPE, element, String(shape));

    if (shape == osStyle.ShapeType.ICON) {
      var icon = osStyle.getConfigIcon(this.styleConfig) || kml.getDefaultIcon();
      osXml.appendElement(StyleActionTagName.ICON_SRC, element, icon.path);
    }

    var centerShape = this.styleConfig[StyleField.CENTER_SHAPE] || osStyle.DEFAULT_CENTER_SHAPE;
    osXml.appendElement(StyleActionTagName.CENTER_SHAPE, element, String(centerShape));

    if (centerShape == osStyle.ShapeType.ICON) {
      var icon = osStyle.getConfigIcon(this.styleConfig) || kml.getDefaultIcon();
      osXml.appendElement(StyleActionTagName.ICON_SRC, element, icon.path);
    }

    var showRotation = this.styleConfig[StyleField.SHOW_ROTATION];
    if (showRotation != null) {
      osXml.appendElement(StyleActionTagName.SHOW_ROTATION, element, String(showRotation));
    }

    var rotationColumn = this.styleConfig[StyleField.ROTATION_COLUMN];
    if (rotationColumn != null) {
      osXml.appendElement(StyleActionTagName.ROTATION_COLUMN, element, String(rotationColumn));
    }

    if (shape == osStyle.ShapeType.ICON || centerShape == osStyle.ShapeType.ICON) {
      var icon = osStyle.getConfigIcon(this.styleConfig) || kml.getDefaultIcon();
      osXml.appendElement(StyleActionTagName.ICON_OPTIONS, element,
          JSON.stringify(icon.options));
    }

    return element;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    var styleConfig = /** @type {!Object} */ (osObject.unsafeClone(osStyle.DEFAULT_VECTOR_CONFIG));

    if (xml) {
      var colorArr;
      var color = osXml.getChildValue(xml, StyleActionTagName.COLOR);
      if (osColor.isColorString(color)) {
        colorArr = osColor.toRgbArray(color);
        if (colorArr) {
          var opacityVal = parseFloat(
              osXml.getChildValue(xml, StyleActionTagName.OPACITY));
          var opacity = !isNaN(opacityVal) ? math.clamp(opacityVal, 0, 1) : osStyle.DEFAULT_ALPHA;
          colorArr[3] = opacity;
          color = osStyle.toRgbaString(colorArr);
        }

        osStyle.setConfigColor(styleConfig, color);
      }

      var fillColor = osXml.getChildValue(xml, StyleActionTagName.FILL_COLOR);
      if (osColor.isColorString(fillColor)) {
        var fillColorArr = osColor.toRgbArray(fillColor);
        if (fillColorArr) {
          var fillOpacityVal = parseFloat(
              osXml.getChildValue(xml, StyleActionTagName.FILL_OPACITY));
          var fillOpacity = !isNaN(fillOpacityVal) ? math.clamp(fillOpacityVal, 0, 1) : osStyle.DEFAULT_FILL_ALPHA;
          fillColorArr[3] = fillOpacity;
          fillColor = osStyle.toRgbaString(fillColorArr);
        }
      } else if (colorArr) {
        // No fill color in the XML, so use the base color with 0 opacity
        var fillColorArr = colorArr.slice();
        fillColorArr[3] = 0;
        fillColor = osStyle.toRgbaString(fillColorArr);
      }

      if (osColor.isColorString(fillColor)) {
        // Only change the fill color without changing the image fill color too
        osStyle.setFillColor(styleConfig, fillColor);
      }

      var size = parseFloat(osXml.getChildValue(xml, StyleActionTagName.SIZE));
      if (!isNaN(size)) {
        osStyle.setConfigSize(styleConfig, size);
      }

      var lineData = osXml.getChildValue(xml, StyleActionTagName.LINE_DASH);
      if (lineData) {
        var lineDash = JSON.parse(lineData);
        if (lineDash && Array.isArray(lineDash)) {
          osStyle.setConfigLineDash(styleConfig, /** @type {Array<number>} */ (lineDash));
        }
      }

      var shape = osXml.getChildValue(xml, StyleActionTagName.SHAPE);
      if (shape) {
        styleConfig[StyleField.SHAPE] = shape;

        var centerShape = osXml.getChildValue(xml, StyleActionTagName.CENTER_SHAPE);
        if (centerShape) {
          styleConfig[StyleField.CENTER_SHAPE] = centerShape;
        }
        if (shape == osStyle.ShapeType.ICON ||
            (osStyle.CENTER_LOOKUP[shape] && centerShape === osStyle.ShapeType.ICON)) {
          var iconSrc = osXml.getChildValue(xml, StyleActionTagName.ICON_SRC);
          var iconOptions = osXml.getChildValue(xml, StyleActionTagName.ICON_OPTIONS) || '{}';
          iconOptions = typeof JSON.parse(iconOptions) === 'object' ? JSON.parse(iconOptions) : {};
          osStyle.setConfigIcon(styleConfig, /** @type {!osx.icon.Icon} */ ({
            path: iconSrc,
            options: iconOptions
          }));
        }
      }

      var showRotation = osXml.getChildValue(xml, StyleActionTagName.SHOW_ROTATION);
      if (showRotation != null) {
        styleConfig[StyleField.SHOW_ROTATION] = Boolean(showRotation);
      }

      var rotationColumn = osXml.getChildValue(xml, StyleActionTagName.ROTATION_COLUMN);
      if (rotationColumn != null) {
        styleConfig[StyleField.ROTATION_COLUMN] = rotationColumn;
      }
    }

    this.styleConfig = styleConfig;
  }

  /**
   * @inheritDoc
   */
  renderLegend(options, var_args) {
    var features = /** @type {Array<!ol.Feature>} */ (arguments[1]);
    if (features && features.length > 0 && features.some(this.isFeatureStyled, this)) {
      var entry = arguments[2];
      if (entry instanceof FilterActionEntry) {
        // clone so we can modify it freely
        var config = /** @type {!Object} */ (osObject.unsafeClone(this.styleConfig));

        var geomShape = /** @type {string|undefined} */ (config['shape']) || osStyle.DEFAULT_SHAPE;
        var shape = osStyle.SHAPES[geomShape];
        if (shape && shape['config'] && shape['config']['image']) {
          osStyle.mergeConfig(shape['config'], config);

          // scale with font size
          if (geomShape == osStyle.ShapeType.ICON) {
            // icons are normalized to 32px, so scale based on that
            osObject.setValue(config, ['image', 'scale'], options.fontSize / 32);
          } else {
            osObject.setValue(config, ['image', 'radius'], Math.round(options.fontSize / 3));
          }
        }

        var offsetX = options.showVector ? 10 : 0;
        legend.queueVectorConfig(config, options, entry.getTitle(), offsetX);
      }
    }
  }

  /**
   * If a feature is styled by the action.
   *
   * @param {!ol.Feature} feature The feature.
   * @return {boolean} If the feature is using this style action.
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  isFeatureStyled(feature) {
    return feature.values_[StyleAction.FEATURE_ID] === this.uid;
  }
}

osImplements(StyleAction, ILegendRenderer.ID);


/**
 * Action identifier.
 * @type {string}
 * @const
 */
StyleAction.ID = 'featureStyleAction';


/**
 * Property set on features to indicate they're using a feature style action.
 * @type {string}
 * @const
 */
StyleAction.FEATURE_ID = '_featureStyleAction';


/**
 * Action label.
 * @type {string}
 * @const
 */
StyleAction.LABEL = 'Set Style';

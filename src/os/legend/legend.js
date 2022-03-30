goog.declareModuleId('os.legend');

import {getCenter} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import Point from 'ol/src/geom/Point.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import ImageState from 'ol/src/ImageState.js';
import {toContext} from 'ol/src/render.js';
import Fill from 'ol/src/style/Fill.js';
import Icon from 'ol/src/style/Icon.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';
import Text from 'ol/src/style/Text.js';

import Settings from '../config/settings.js';
import * as dispatcher from '../dispatcher.js';
import {noop} from '../fn/fn.js';
import osImplements from '../implements.js';
import {getMapContainer} from '../map/mapinstance.js';
import {setValue, unsafeClone} from '../object/object.js';
import {createEllipseGeometry} from '../ol/canvas.js';
import VectorSource from '../source/vectorsource.js';
import * as osStyle from '../style/style.js';
import StyleManager from '../style/stylemanager_shim.js';
import {measureText} from '../ui/ui.js';
import ILegendRenderer from './ilegendrenderer.js';

const {defaultCompare} = goog.require('goog.array');
const {clamp} = goog.require('goog.math');

const {default: TileLayer} = goog.requireType('os.layer.Tile');
const {default: VectorLayer} = goog.requireType('os.layer.Vector');


/**
 * @type {string}
 */
export const ID = 'legend';

/**
 * @type {string}
 */
export const ICON = 'fa-map-signs';

/**
 * The base key used by all legend settings.
 * @type {string}
 */
export const BASE_KEY = 'os.legend';

/**
 * The key used for legend draw options.
 * @type {string}
 */
export const DRAW_OPTIONS_KEY = BASE_KEY + '.options';

/**
 * The key used for legend draw options.
 * @type {string}
 */
export const POSITION_KEY = BASE_KEY + '.position';

/**
 * @type {number}
 */
export const SETTINGS_VERSION = 0;

/**
 * @type {!osx.legend.LegendOptions}
 */
export const DEFAULT_OPTIONS = {
  bgColor: '#333333',
  bold: true,
  fontSize: 16,
  showVector: true,
  showVectorType: true,
  showCount: false,
  showTile: true,
  showBackground: true,
  opacity: 1,
  version: SETTINGS_VERSION
};

/**
 * Legend border width.
 * @type {number}
 */
export const BORDER_WIDTH = 3;

/**
 * The legend border style. The lineJoin: 'bevel' creates a border with rounded edges (rounder than 'round').
 * @type {!Style}
 */
export const BORDER_STYLE = new Style({
  stroke: new Stroke({
    color: '#111',
    lineJoin: 'bevel',
    width: BORDER_WIDTH
  })
});

/**
 * The legend dash style.
 * @type {!Style}
 */
export const DASH_STYLE = new Style({
  fill: new Fill({
    color: '#fff'
  }),
  stroke: new Stroke({
    color: '#000',
    width: 1
  })
});

/**
 * Legend label fill style.
 * @type {!Fill}
 */
export const LABEL_FILL_STYLE = new Fill({
  color: '#fff'
});

/**
 * Legend label stroke style.
 * @type {!Stroke}
 */
export const LABEL_STROKE_STYLE = new Stroke({
  color: '#000',
  width: 2
});

/**
 * @enum {string}
 */
export const Label = {
  EMPTY: 'Nothing to Display',
  HEADER: 'Legend',
  LIMIT: '- Too many legend items -'
};

/**
 * Regular expression to split numbers from a numeric bin method.
 * @type {RegExp}
 */
export const NUMERIC_REGEX = /^([\d.+-]+) to [\d.+-]+$/;

/**
 * Legend event types.
 * @enum {string}
 */
export const EventType = {
  UPDATE: 'legend:update'
};

/**
 * Callbacks to add layer specific items to the legend.
 * @type {!Array<!osx.legend.PluginOptions>}
 */
export const layerPlugins = [];

/**
 * Register a function that adds layer-relevant items to the legend.
 *
 * @param {!osx.legend.PluginOptions} options The plugin options.
 */
export const registerLayerPlugin = function(options) {
  // default priority to 0
  options.priority = options.priority || 0;

  // add the plugin and sort by priority
  layerPlugins.push(options);
  layerPlugins.sort(sortPluginByPriority);

  if (options.defaultSettings) {
    // merge plugin defaults into legend options
    var legendOptions = getOptionsFromSettings();
    for (var key in options.defaultSettings) {
      if (legendOptions[key] == null) {
        legendOptions[key] = options.defaultSettings[key];
      }
    }

    // save changes
    Settings.getInstance().set(DRAW_OPTIONS_KEY, legendOptions);
  }
};

/**
 * Sort legend plugins by descending priority.
 *
 * @param {!osx.legend.PluginOptions} a First legend plugin.
 * @param {!osx.legend.PluginOptions} b Second legend plugin.
 * @return {number} The sort order.
 */
export const sortPluginByPriority = function(a, b) {
  // sort in descending order
  return -defaultCompare(a.priority || 0, b.priority || 0);
};

/**
 * Get legend options from settings.
 *
 * @return {!osx.legend.LegendOptions}
 */
export const getOptionsFromSettings = function() {
  var options = Settings.getInstance().get(DRAW_OPTIONS_KEY);
  if (!options || options.version != SETTINGS_VERSION) {
    // options are probably not compatible, so just start over
    options = DEFAULT_OPTIONS;
    Settings.getInstance().set(DRAW_OPTIONS_KEY, options);
  }

  return /** @type {!osx.legend.LegendOptions} */ (unsafeClone(options));
};

/**
 * Filter layers that should be drawn in the legend.
 *
 * @param {!Layer} layer The layer
 * @param {number} idx Index in the layers array
 * @param {!Array<!Layer>} layers The layers array
 * @return {boolean}
 */
export const layerFilter = function(layer, idx, layers) {
  return osImplements(layer, ILegendRenderer.ID) && /** @type {!ILegendRenderer} */ (layer).renderLegend !== noop;
};

/**
 * Initialize legend draw options.
 *
 * @param {!osx.legend.LegendOptions} options
 */
const initializeOptions_ = function(options) {
  var fontSize = options.fontSize + 'px';
  options.font = (options.bold ? 'bold ' : '') + fontSize + '/' + fontSize + ' sans-serif';
  options.drawQueue = [];
  options.maxRowWidth = 0;
  options.offsetX = 0;
  options.offsetY = 0;
};

/**
 * Draw the legend to a canvas.
 *
 * @param {HTMLCanvasElement} canvas The canvas
 * @param {number=} opt_maxHeight The maximum height for the canvas
 * @param {number=} opt_maxWidth The maximum height for the canvas
 */
export const drawToCanvas = function(canvas, opt_maxHeight, opt_maxWidth) {
  var options = getOptionsFromSettings();
  options.maxHeight = opt_maxHeight || Infinity;
  options.maxWidth = opt_maxWidth || Infinity;
  var showCountDefined = options.showCount != null;
  options.showCount = !showCountDefined ? DEFAULT_OPTIONS.showCount : options.showCount;
  var showColumnDefined = options.showColumn != null;
  options.showColumn = !showColumnDefined ? DEFAULT_OPTIONS.showColumn : options.showColumn;
  var showVectorTypeDefined = options.showVectorType != null;
  options.showVectorType = !showVectorTypeDefined ? DEFAULT_OPTIONS.showVectorType : options.showVectorType;

  if (canvas) {
    var context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    if (context) {
      initializeOptions_(options);
      addHeader_(options);
      var headerSize = options.maxRowWidth;

      // grab all layers and filter down to the ones we want
      var layers = getMapContainer().getLayers();
      layers = /** @type {!Array<!ILegendRenderer>} */ (layers.filter(layerFilter));

      // queue up layers to be added
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        layer.renderLegend(options);

        layerPlugins.forEach(function(p) {
          if (p.render != null) {
            p.render(/** @type {!Layer} */ (layer), options);
          }
        });
      }

      // if nothing was added, add text to indicate this
      if (options.drawQueue.length == 1) {
        addNoItemsText_(options);
      }

      // check if we ran out of space to render everything
      if (options.stopDrawing) {
        addLimitText_(options);
      }

      // resize the canvas so everything fits
      if (options.maxRowWidth > 0) {
        canvas.width = Math.min(options.maxWidth, options.maxRowWidth + 25);
        canvas.height = options.offsetY - Math.round(options.fontSize / 2);
      }

      // set the opacity
      context.globalAlpha = options.opacity || DEFAULT_OPTIONS.opacity;

      // create the OL3 canvas renderer
      // TODO: test pixelRatio on other systems
      var render = toContext(context, {
        // fix legend scaling on all displays - fixes Retina cropping issue
        pixelRatio: 1
      });

      // draw the background/border if configured
      var drawBg = options.showBackground != null ? options.showBackground : DEFAULT_OPTIONS.showBackground;
      if (drawBg) {
        var bgOffset = BORDER_WIDTH - 1;
        context.fillStyle = options.bgColor || DEFAULT_OPTIONS.bgColor;
        context.fillRect(bgOffset, bgOffset, canvas.width - bgOffset * 2, canvas.height - bgOffset * 2);

        // draw the border, inset slightly since OL3 will draw the middle of the line along the coordinates
        var borderOffset = BORDER_WIDTH - 1;
        var border = new Feature(fromExtent([
          borderOffset,
          borderOffset,
          canvas.width - borderOffset,
          canvas.height - borderOffset
        ]));
        render.drawFeature(border, BORDER_STYLE);
      }

      // center the legend title
      var header = options.drawQueue[0];
      header.labelStyle.text_.setOffsetX(canvas.width / 2 - headerSize / 2);

      // draw everything in the queue
      for (var i = 0; i < options.drawQueue.length; i++) {
        var item = options.drawQueue[i];

        if (item.feature && item.style) {
          var imageStyle = item.style.getImage();
          if (imageStyle instanceof Icon) {
            var imageState = imageStyle.getImageState();
            if (imageState < ImageState.LOADED) {
              // icon isn't loaded yet, so load it now
              if (imageState == ImageState.IDLE) {
                imageStyle.load();
              }

              // listen for the image to change state
              imageStyle.listenImageChange(onIconChange_, imageStyle);

              // image isn't loaded, so don't try to render it yet
              continue;
            }
          }

          render.drawFeature(item.feature, item.style);
        }

        if ((item.labelFeature || item.feature) && item.labelStyle) {
          render.drawFeature(item.labelFeature || item.feature, item.labelStyle);
        }
      }
    }
  }
};

/**
 * Handle icon image loading.
 *
 * @this ol.style.Icon
 */
const onIconChange_ = function() {
  this.unlistenImageChange(onIconChange_, this);

  if (this.getImageState() < ImageState.ERROR) {
    // if the image loaded, trigger a legend refresh
    dispatcher.getInstance().dispatchEvent(EventType.UPDATE);
  }
};

/**
 * Draw the header text.
 *
 * @param {!osx.legend.LegendOptions} options
 */
const addHeader_ = function(options) {
  // very complex computations determined to orient the Legend header appropriately across font sizes
  options.offsetX = 2 + Math.floor(options.fontSize / 10);
  options.offsetY = 5 + (options.fontSize / 2);

  var labelFeature = new Feature(new Point([options.offsetX, options.offsetY]));
  var labelStyle = getLabelStyle_(Label.HEADER, options);
  queueItem(options, undefined, undefined, labelFeature, labelStyle);

  // offset labels by the approximate icon width
  var buffer = Math.round(options.fontSize / 4);
  options.offsetX = 10 + buffer;
};

/**
 * Draw the header text.
 *
 * @param {!osx.legend.LegendOptions} options
 */
const addLimitText_ = function(options) {
  // very complex computations determined to orient the Legend header appropriately across font sizes
  options.offsetX = 2 + Math.floor(options.fontSize / 10);

  var labelFeature = new Feature(new Point([options.offsetX, options.offsetY]));
  var labelStyle = getLabelStyle_(Label.LIMIT, options);
  queueItem(options, undefined, undefined, labelFeature, labelStyle);
};

/**
 * Draw the header text.
 *
 * @param {!osx.legend.LegendOptions} options
 */
const addNoItemsText_ = function(options) {
  var labelFeature = new Feature(new Point([options.offsetX, options.offsetY]));
  var labelStyle = getLabelStyle_(Label.EMPTY, options, undefined, 0);
  queueItem(options, undefined, undefined, labelFeature, labelStyle);
};

/**
 * Check if we can add more items to the legend.
 *
 * @param {!osx.legend.LegendOptions} options The legend options.
 * @return {boolean} If another row can be added to the legend.
 */
export const canDraw = function(options) {
  return !options.stopDrawing && !(options.stopDrawing = options.maxHeight < options.offsetY + options.fontSize + 5);
};

/**
 * Add a tile layer to the legend canvas.
 *
 * @param {!TileLayer} layer The tile layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
export const drawTileLayer = function(layer, options) {
  if (options.showTile && canDraw(options) && layer.getLayerVisible()) {
    var labelStyle = getLabelStyle_(layer.getTitle(), options);
    var labelFeature = new Feature(new Point([options.offsetX, options.offsetY]));
    var style = new Style({
      fill: new Fill({
        color: osStyle.toRgbaString(layer.getColor() || '#fff')
      }),
      stroke: new Stroke({
        color: '#000',
        width: 1
      })
    });

    var feature = new Feature(createTileGeometry(options));
    queueItem(options, feature, style, labelFeature, labelStyle);
  }
};

/**
 * Queue an item to be rendered in the legend.
 *
 * @param {!osx.legend.LegendOptions} options
 * @param {Feature=} opt_feature [description]
 * @param {Style=} opt_style [description]
 * @param {ol.Feature=} opt_labelFeature [description]
 * @param {ol.style.Style=} opt_labelStyle [description]
 */
export const queueItem = function(options, opt_feature, opt_style, opt_labelFeature, opt_labelStyle) {
  var rowWidth = 0;

  // determine the x offset of the row based on the feature used to position the feature/label. prefer the label feature
  // because it will be the furthest right.
  var feature = opt_labelFeature || opt_feature;
  if (feature) {
    var featureCenter = getCenter(feature.getGeometry().getExtent());

    // add the font size to account for the feature size and padding between the feature/label
    rowWidth += featureCenter[0] + options.fontSize;
  }

  // determine the label width
  if (opt_labelStyle) {
    var textStyle = opt_labelStyle.getText();
    if (textStyle) {
      var font = textStyle.getFont();
      var text = textStyle.getText();
      if (font && text) {
        var labelSize = measureText(text, 'feature-label', font);
        rowWidth += labelSize.width;
      }
    }
  }

  options.maxRowWidth = Math.max(rowWidth, options.maxRowWidth);

  options.drawQueue.push({
    feature: opt_feature,
    style: opt_style,
    labelFeature: opt_labelFeature,
    labelStyle: opt_labelStyle
  });

  // add the row height + padding to the y offset for the next item
  options.offsetY += options.fontSize + 5;
};

/**
 * Add a vector layer to the legend canvas.
 *
 * @param {!VectorLayer} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
export const drawVectorLayer = function(layer, options) {
  if (options.showVector && canDraw(options)) {
    var source = /** @type {VectorSource} */ (layer.getSource());
    if (source && shouldDrawSource(source)) {
      var config = getSourceConfig(source, options);
      var label = source.getTitle(!options.showVectorType);
      if (options.showCount) {
        label += ' (' + source.getFeatureCount() + ')';
      }

      queueVectorConfig(config, options, label, 0);
    }
  }
};

/**
 * If a vector source should be included in the legend.
 *
 * @param {!ol.source.Vector} source The vector source.
 * @return {boolean} If the source should be included.
 */
export const shouldDrawSource = function(source) {
  return source instanceof VectorSource && source.isEnabled() && source.getVisible() &&
      source.getFeatureCount() > 0;
};

/**
 * Compares two numeric bin labels to sort in numeric order.
 *
 * @param {string} labelA The first numeric bin label to be compared.
 * @param {string} labelB The second numeric bin label to be compared.
 * @return {number}
 */
export const numericCompare = function(labelA, labelB) {
  var aMatch = labelA.match(NUMERIC_REGEX);
  var bMatch = labelB.match(NUMERIC_REGEX);

  if (!aMatch && !bMatch) {
    return 0;
  } else if (!aMatch) {
    return 1;
  } else if (!bMatch) {
    return -1;
  }

  var a = Number(aMatch[1]);
  var b = Number(bMatch[1]);
  return a > b ? 1 : a < b ? -1 : 0;
};

/**
 * Queue an item styled by a vector config.
 *
 * @param {!Object} config
 * @param {!osx.legend.LegendOptions} options
 * @param {string} label The item label
 * @param {number} offsetX Additional x offset
 * @param {boolean=} opt_useDash If a dash icon should be used
 * @return {boolean} If the item was queued.
 */
export const queueVectorConfig = function(config, options, label, offsetX, opt_useDash) {
  if (!canDraw(options)) {
    return false;
  }

  var style;
  var labelStyle = getLabelStyle_(label, options);

  var center = [options.offsetX + offsetX, options.offsetY];
  var geometry;
  if (opt_useDash) {
    geometry = createDashGeometry(center, options.fontSize);
    style = DASH_STYLE;
  } else if (osStyle.ELLIPSE_REGEXP.test(config['shape'])) {
    var includeCenter = osStyle.CENTER_LOOKUP[config['shape']];
    geometry = createEllipseGeometry(center, options.fontSize, includeCenter);

    // scale the stroke width and center point size for ellipses, clamped within a reasonable range
    if (includeCenter) {
      config['image']['type'] = 'circle';
    }
    config['image']['radius'] = clamp(options.fontSize / 12, 1.5, 4);
    config['stroke']['width'] = clamp(options.fontSize / 8, 1.5, 4);
  } else {
    geometry = new Point(center);

    // scale and center icons
    if (osStyle.isIconConfig(config)) {
      config['image']['scale'] = options.fontSize / 24;
      config['image']['anchor'] = [0.5, 0.5];
    }
  }

  if (!style) {
    style = StyleManager.getInstance().getOrCreateStyle(config);
  }

  var feature = new Feature(geometry);
  queueItem(options, feature, style, undefined, labelStyle);

  return true;
};

/**
 * Create a dash geometry to render in the legend.
 *
 * @param {!ol.Coordinate} center The center of the dash.
 * @param {number} size The size of the dash.
 * @return {Polygon}
 */
export const createDashGeometry = function(center, size) {
  // scale the dash appropriately with the font size
  var xRadius = size / 3;
  var yRadius = xRadius / 3;
  var extent = [center[0] - xRadius, center[1] - yRadius, center[0] + xRadius, center[1] + yRadius];
  return fromExtent(extent);
};

/**
 * Create a tile icon geometry to display in the legend.
 *
 * @param {!osx.legend.LegendOptions} options
 * @return {!GeometryCollection}
 */
export const createTileGeometry = function(options) {
  // what magic numbers? these were carefully calculated using math (certainly not trial and error) to draw a really
  // awesome scalable tile icon. vector graphics, yo.
  var dim = Math.ceil(options.fontSize * 0.8);
  var inset = Math.round(dim / 2.85);
  var offsetX = 10 - Math.floor(options.fontSize / 8);
  var offsetY = options.offsetY;

  // draw a tile icon as a collection of overlapping polygons
  var polygons = [];
  for (var i = 0; i < 3; i++) {
    polygons.push(new Polygon([[
      [offsetX + inset, offsetY],
      [(offsetX + dim), offsetY],
      [offsetX + dim - inset, offsetY + inset],
      [offsetX, offsetY + inset],
      [offsetX + inset, offsetY]
    ]]));

    offsetY -= Math.ceil(inset / 2);
  }

  return new GeometryCollection(polygons);
};

/**
 * Creates a style config tailored for rendering to the legend.
 *
 * @param {!VectorSource} source
 * @param {!osx.legend.LegendOptions} options
 * @return {!Object}
 */
export const getSourceConfig = function(source, options) {
  var config = StyleManager.getInstance().getLayerConfig(source.getId()) ||
      osStyle.DEFAULT_VECTOR_CONFIG;

  // clone so we can modify it freely
  config = /** @type {!Object} */ (unsafeClone(config));

  // scale the radius with font size
  setValue(config, ['image', 'radius'], Math.round(options.fontSize / 3));

  var geomShape = source.getGeometryShape();
  config['shape'] = geomShape;

  var shape = osStyle.SHAPES[geomShape];
  if (shape && shape['config'] && shape['config']['image']) {
    osStyle.mergeConfig(shape['config'], config);
  }

  if (osStyle.CENTER_LOOKUP[geomShape]) {
    var geomCenterShape = source.getCenterGeometryShape();
    var centerShape = osStyle.SHAPES[geomCenterShape];
    if (centerShape && centerShape['config'] && centerShape['config']['image']) {
      osStyle.mergeConfig(centerShape['config'], config);
    }
  }

  return config;
};

/**
 * Add a label to the legend canvas.
 *
 * @param {string} text The text to render
 * @param {!osx.legend.LegendOptions} options Draw options
 * @param {string=} opt_font The font to use
 * @param {number=} opt_offsetX Horizontal offset for the label
 * @return {!Style}
 */
const getLabelStyle_ = function(text, options, opt_font, opt_offsetX) {
  var font = opt_font != null ? opt_font : options.font;
  var offsetX = opt_offsetX != null ? opt_offsetX : options.offsetX;

  return new Style({
    text: new Text({
      text: text,
      font: font,
      textAlign: 'left',
      textBaseline: 'middle',
      fill: LABEL_FILL_STYLE,
      offsetX: offsetX,
      stroke: LABEL_STROKE_STYLE
    })
  });
};

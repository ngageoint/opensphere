goog.provide('os.legend');

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('os.histo.NumericBinMethod');
goog.require('os.implements');
goog.require('os.legend.ILegendRenderer');
goog.require('os.ol.canvas');
goog.require('os.style');


/**
 * @type {string}
 * @const
 */
os.legend.ID = 'legend';


/**
 * @type {string}
 * @const
 */
os.legend.ICON = 'fa-map-signs';


/**
 * The base key used by all legend settings.
 * @type {string}
 * @const
 */
os.legend.BASE_KEY = 'os.legend';


/**
 * The key used for legend draw options.
 * @type {string}
 * @const
 */
os.legend.DRAW_OPTIONS_KEY = os.legend.BASE_KEY + '.options';


/**
 * The key used for legend draw options.
 * @type {string}
 * @const
 */
os.legend.POSITION_KEY = os.legend.BASE_KEY + '.position';


/**
 * @type {number}
 * @const
 */
os.legend.SETTINGS_VERSION = 0;


/**
 * @type {!osx.legend.LegendOptions}
 * @const
 */
os.legend.DEFAULT_OPTIONS = /** @type {!osx.legend.LegendOptions} */ ({
  bgColor: '#333333',
  bold: true,
  fontSize: 16,
  showVector: true,
  showVectorType: true,
  showCount: false,
  showTile: true,
  showBackground: true,
  opacity: 1,
  version: os.legend.SETTINGS_VERSION
});


/**
 * Legend border width.
 * @type {number}
 * @const
 */
os.legend.BORDER_WIDTH = 3;


/**
 * The legend border style. The lineJoin: 'bevel' creates a border with rounded edges (rounder than 'round').
 * @type {!ol.style.Style}
 * @const
 */
os.legend.BORDER_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#111',
    lineJoin: 'bevel',
    width: os.legend.BORDER_WIDTH
  })
});


/**
 * The legend dash style.
 * @type {!ol.style.Style}
 * @const
 */
os.legend.DASH_STYLE = new ol.style.Style({
  fill: new ol.style.Fill({
    color: '#fff'
  }),
  stroke: new ol.style.Stroke({
    color: '#000',
    width: 1
  })
});


/**
 * Legend label fill style.
 * @type {!ol.style.Fill}
 * @const
 */
os.legend.LABEL_FILL_STYLE = new ol.style.Fill({
  color: '#fff'
});


/**
 * Legend label stroke style.
 * @type {!ol.style.Stroke}
 * @const
 */
os.legend.LABEL_STROKE_STYLE = new ol.style.Stroke({
  color: '#000',
  width: 2
});


/**
 * @enum {string}
 */
os.legend.Label = {
  EMPTY: 'Nothing to Display',
  HEADER: 'Legend',
  LIMIT: '- Too many legend items -'
};


/**
 * Regular expression to split numbers from a numeric bin method.
 * @type {RegExp}
 * @const
 */
os.legend.NUMERIC_REGEX = /^([\d.+-]+) to [\d.+-]+$/;


/**
 * Legend event types.
 * @enum {string}
 */
os.legend.EventType = {
  UPDATE: 'legend:update'
};


/**
 * Callbacks to add layer specific items to the legend.
 * @type {!Array<!osx.legend.PluginOptions>}
 */
os.legend.layerPlugins = [];


/**
 * Register a function that adds layer-relevant items to the legend.
 * @param {!osx.legend.PluginOptions} options The plugin options.
 */
os.legend.registerLayerPlugin = function(options) {
  // default priority to 0
  options.priority = options.priority || 0;

  // add the plugin and sort by priority
  os.legend.layerPlugins.push(options);
  os.legend.layerPlugins.sort(os.legend.sortPluginByPriority);

  if (options.defaultSettings) {
    // merge plugin defaults into legend options
    var legendOptions = os.legend.getOptionsFromSettings();
    for (var key in options.defaultSettings) {
      if (legendOptions[key] == null) {
        legendOptions[key] = options.defaultSettings[key];
      }
    }

    // save changes
    os.settings.set(os.legend.DRAW_OPTIONS_KEY, legendOptions);
  }
};


/**
 * Sort legend plugins by descending priority.
 * @param {!osx.legend.PluginOptions} a First legend plugin.
 * @param {!osx.legend.PluginOptions} b Second legend plugin.
 * @return {number} The sort order.
 */
os.legend.sortPluginByPriority = function(a, b) {
  // sort in descending order
  return -goog.array.defaultCompare(a.priority || 0, b.priority || 0);
};


/**
 * Get legend options from settings.
 * @return {!osx.legend.LegendOptions}
 */
os.legend.getOptionsFromSettings = function() {
  var options = os.settings.get(os.legend.DRAW_OPTIONS_KEY);
  if (!options || options.version != os.legend.SETTINGS_VERSION) {
    // options are probably not compatible, so just start over
    options = os.legend.DEFAULT_OPTIONS;
    os.settings.set(os.legend.DRAW_OPTIONS_KEY, options);
  }

  return /** @type {!osx.legend.LegendOptions} */ (os.object.unsafeClone(options));
};


/**
 * Filter layers that should be drawn in the legend.
 * @param {!ol.layer.Layer} layer The layer
 * @param {number} idx Index in the layers array
 * @param {!Array<!ol.layer.Layer>} layers The layers array
 * @return {boolean}
 */
os.legend.layerFilter = function(layer, idx, layers) {
  return os.implements(layer, os.legend.ILegendRenderer.ID) &&
      /** @type {!os.legend.ILegendRenderer} */ (layer).renderLegend !== goog.nullFunction;
};


/**
 * Initialize legend draw options.
 * @param {!osx.legend.LegendOptions} options
 * @private
 */
os.legend.initializeOptions_ = function(options) {
  var fontSize = options.fontSize + 'px';
  options.font = (options.bold ? 'bold ' : '') + fontSize + '/' + fontSize + ' sans-serif';
  options.drawQueue = [];
  options.maxRowWidth = 0;
  options.offsetX = 0;
  options.offsetY = 0;
};


/**
 * Draw the legend to a canvas.
 * @param {HTMLCanvasElement} canvas The canvas
 * @param {number=} opt_maxHeight The maximum height for the canvas
 * @param {number=} opt_maxWidth The maximum height for the canvas
 */
os.legend.drawToCanvas = function(canvas, opt_maxHeight, opt_maxWidth) {
  var options = os.legend.getOptionsFromSettings();
  options.maxHeight = opt_maxHeight || Infinity;
  options.maxWidth = opt_maxWidth || Infinity;
  var showCountDefined = goog.isDefAndNotNull(options.showCount);
  options.showCount = !showCountDefined ? os.legend.DEFAULT_OPTIONS.showCount : options.showCount;
  var showColumnDefined = goog.isDefAndNotNull(options.showColumn);
  options.showColumn = !showColumnDefined ? os.legend.DEFAULT_OPTIONS.showColumn : options.showColumn;
  var showVectorTypeDefined = goog.isDefAndNotNull(options.showVectorType);
  options.showVectorType = !showVectorTypeDefined ? os.legend.DEFAULT_OPTIONS.showVectorType : options.showVectorType;

  if (canvas) {
    var context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    if (context) {
      os.legend.initializeOptions_(options);
      os.legend.addHeader_(options);
      var headerSize = options.maxRowWidth;

      // grab all layers and filter down to the ones we want
      var layers = os.MapContainer.getInstance().getLayers();
      layers = /** @type {!Array<!os.legend.ILegendRenderer>} */ (layers.filter(os.legend.layerFilter));

      // queue up layers to be added
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        layer.renderLegend(options);

        os.legend.layerPlugins.forEach(function(p) {
          if (p.render != null) {
            p.render(/** @type {!ol.layer.Layer} */ (layer), options);
          }
        });
      }

      // if nothing was added, add text to indicate this
      if (options.drawQueue.length == 1) {
        os.legend.addNoItemsText_(options);
      }

      // check if we ran out of space to render everything
      if (options.stopDrawing) {
        os.legend.addLimitText_(options);
      }

      // resize the canvas so everything fits
      if (options.maxRowWidth > 0) {
        canvas.width = Math.min(options.maxWidth, options.maxRowWidth + 25);
        canvas.height = options.offsetY - Math.round(options.fontSize / 2);
      }

      // set the opacity
      context.globalAlpha = options.opacity || os.legend.DEFAULT_OPTIONS.opacity;

      // create the OL3 canvas renderer
      // TODO: test pixelRatio on other systems
      var render = ol.render.toContext(context, {
        // fix legend scaling on all displays - fixes Retina cropping issue
        pixelRatio: 1
      });

      // draw the background/border if configured
      var drawBg = options.showBackground != null ? options.showBackground : os.legend.DEFAULT_OPTIONS.showBackground;
      if (drawBg) {
        var bgOffset = os.legend.BORDER_WIDTH - 1;
        context.fillStyle = options.bgColor || os.legend.DEFAULT_OPTIONS.bgColor;
        context.fillRect(bgOffset, bgOffset, canvas.width - bgOffset * 2, canvas.height - bgOffset * 2);

        // draw the border, inset slightly since OL3 will draw the middle of the line along the coordinates
        var borderOffset = os.legend.BORDER_WIDTH - 1;
        var border = new ol.Feature(ol.geom.Polygon.fromExtent([
          borderOffset,
          borderOffset,
          canvas.width - borderOffset,
          canvas.height - borderOffset
        ]));
        render.drawFeature(border, os.legend.BORDER_STYLE);
      }

      // center the legend title
      var header = options.drawQueue[0];
      header.labelStyle.text_.setOffsetX(canvas.width / 2 - headerSize / 2);

      // draw everything in the queue
      for (var i = 0; i < options.drawQueue.length; i++) {
        var item = options.drawQueue[i];

        if (item.feature && item.style) {
          var imageStyle = item.style.getImage();
          if (imageStyle instanceof ol.style.Icon) {
            var imageState = imageStyle.getImageState();
            if (imageState < ol.ImageState.LOADED) {
              // icon isn't loaded yet, so load it now
              if (imageState == ol.ImageState.IDLE) {
                imageStyle.load();
              }

              // listen for the image to change state
              imageStyle.listenImageChange(os.legend.onIconChange_, imageStyle);

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
 * @this ol.style.Icon
 * @private
 */
os.legend.onIconChange_ = function() {
  this.unlistenImageChange(os.legend.onIconChange_, this);

  if (this.getImageState() < ol.ImageState.ERROR) {
    // if the image loaded, trigger a legend refresh
    os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
  }
};


/**
 * Draw the header text.
 * @param {!osx.legend.LegendOptions} options
 * @private
 */
os.legend.addHeader_ = function(options) {
  // very complex computations determined to orient the Legend header appropriately across font sizes
  options.offsetX = 2 + Math.floor(options.fontSize / 10);
  options.offsetY = 5 + (options.fontSize / 2);

  var labelFeature = new ol.Feature(new ol.geom.Point([options.offsetX, options.offsetY]));
  var labelStyle = os.legend.getLabelStyle_(os.legend.Label.HEADER, options);
  os.legend.queueItem(options, undefined, undefined, labelFeature, labelStyle);

  // offset labels by the approximate icon width
  var buffer = Math.round(options.fontSize / 4);
  options.offsetX = 10 + buffer;
};


/**
 * Draw the header text.
 * @param {!osx.legend.LegendOptions} options
 * @private
 */
os.legend.addLimitText_ = function(options) {
  // very complex computations determined to orient the Legend header appropriately across font sizes
  options.offsetX = 2 + Math.floor(options.fontSize / 10);

  var labelFeature = new ol.Feature(new ol.geom.Point([options.offsetX, options.offsetY]));
  var labelStyle = os.legend.getLabelStyle_(os.legend.Label.LIMIT, options);
  os.legend.queueItem(options, undefined, undefined, labelFeature, labelStyle);
};


/**
 * Draw the header text.
 * @param {!osx.legend.LegendOptions} options
 * @private
 */
os.legend.addNoItemsText_ = function(options) {
  var labelFeature = new ol.Feature(new ol.geom.Point([options.offsetX, options.offsetY]));
  var labelStyle = os.legend.getLabelStyle_(os.legend.Label.EMPTY, options, undefined, 0);
  os.legend.queueItem(options, undefined, undefined, labelFeature, labelStyle);
};


/**
 * Check if we can add more items to the legend.
 * @param {!osx.legend.LegendOptions} options The legend options.
 * @return {boolean} If another row can be added to the legend.
 */
os.legend.canDraw = function(options) {
  return !options.stopDrawing && !(options.stopDrawing = options.maxHeight < options.offsetY + options.fontSize + 5);
};


/**
 * Add a tile layer to the legend canvas.
 * @param {!os.layer.Tile} layer The tile layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
os.legend.drawTileLayer = function(layer, options) {
  if (options.showTile && os.legend.canDraw(options) && layer.getLayerVisible()) {
    var labelStyle = os.legend.getLabelStyle_(layer.getTitle(), options);
    var labelFeature = new ol.Feature(new ol.geom.Point([options.offsetX, options.offsetY]));
    var style = new ol.style.Style({
      fill: new ol.style.Fill({
        color: os.style.toRgbaString(layer.getColor() || '#fff')
      }),
      stroke: new ol.style.Stroke({
        color: '#000',
        width: 1
      })
    });

    var feature = new ol.Feature(os.legend.createTileGeometry(options));
    os.legend.queueItem(options, feature, style, labelFeature, labelStyle);
  }
};


/**
 * Queue an item to be rendered in the legend.
 * @param {!osx.legend.LegendOptions} options
 * @param {ol.Feature=} opt_feature [description]
 * @param {ol.style.Style=} opt_style [description]
 * @param {ol.Feature=} opt_labelFeature [description]
 * @param {ol.style.Style=} opt_labelStyle [description]
 */
os.legend.queueItem = function(options, opt_feature, opt_style, opt_labelFeature, opt_labelStyle) {
  var rowWidth = 0;

  // determine the x offset of the row based on the feature used to position the feature/label. prefer the label feature
  // because it will be the furthest right.
  var feature = opt_labelFeature || opt_feature;
  if (feature) {
    var featureCenter = ol.extent.getCenter(feature.getGeometry().getExtent());

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
        var labelSize = os.ui.measureText(text, 'feature-label', font);
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
 * @param {!os.layer.Vector} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
os.legend.drawVectorLayer = function(layer, options) {
  if (options.showVector && os.legend.canDraw(options)) {
    var source = /** @type {os.source.Vector} */ (layer.getSource());
    if (source && os.legend.shouldDrawSource(source)) {
      var config = os.legend.getSourceConfig(source, options);
      var label = source.getTitle(!options.showVectorType);
      if (options.showCount) {
        label += ' (' + source.getFeatureCount() + ')';
      }

      os.legend.queueVectorConfig(config, options, label, 0);
    }
  }
};


/**
 * If a vector source should be included in the legend.
 * @param {!ol.source.Vector} source The vector source.
 * @return {boolean} If the source should be included.
 */
os.legend.shouldDrawSource = function(source) {
  return source instanceof os.source.Vector && source.getVisible() && source.getFeatureCount() > 0;
};


/**
 * Compares two numeric bin labels to sort in numeric order.
 * @param {string} labelA The first numeric bin label to be compared.
 * @param {string} labelB The second numeric bin label to be compared.
 * @return {number}
 */
os.legend.numericCompare = function(labelA, labelB) {
  var aMatch = labelA.match(os.legend.NUMERIC_REGEX);
  var bMatch = labelB.match(os.legend.NUMERIC_REGEX);

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
 * @param {!Object} config
 * @param {!osx.legend.LegendOptions} options
 * @param {string} label The item label
 * @param {number} offsetX Additional x offset
 * @param {boolean=} opt_useDash If a dash icon should be used
 * @return {boolean} If the item was queued.
 */
os.legend.queueVectorConfig = function(config, options, label, offsetX, opt_useDash) {
  if (!os.legend.canDraw(options)) {
    return false;
  }

  var style;
  var labelStyle = os.legend.getLabelStyle_(label, options);

  var center = [options.offsetX + offsetX, options.offsetY];
  var geometry;
  if (opt_useDash) {
    geometry = os.legend.createDashGeometry(center, options.fontSize);
    style = os.legend.DASH_STYLE;
  } else if (os.style.ELLIPSE_REGEXP.test(config['shape'])) {
    var includeCenter = os.style.CENTER_LOOKUP[config['shape']];
    geometry = os.ol.canvas.createEllipseGeometry(center, options.fontSize, includeCenter);

    // scale the stroke width and center point size for ellipses, clamped within a reasonable range
    if (includeCenter) {
      config['image']['type'] = 'circle';
    }
    config['image']['radius'] = goog.math.clamp(options.fontSize / 12, 1.5, 4);
    config['stroke']['width'] = goog.math.clamp(options.fontSize / 8, 1.5, 4);
  } else {
    geometry = new ol.geom.Point(center);

    // scale and center icons
    if (os.style.isIconConfig(config)) {
      config['image']['scale'] = options.fontSize / 24;
      config['image']['anchor'] = [0.5, 0.5];
    }
  }

  if (!style) {
    style = os.style.StyleManager.getInstance().getOrCreateStyle(config);
  }

  var feature = new ol.Feature(geometry);
  os.legend.queueItem(options, feature, style, undefined, labelStyle);

  return true;
};


/**
 * Create a dash geometry to render in the legend.
 * @param {!ol.Coordinate} center The center of the dash.
 * @param {number} size The size of the dash.
 * @return {ol.geom.Polygon}
 */
os.legend.createDashGeometry = function(center, size) {
  // scale the dash appropriately with the font size
  var xRadius = size / 3;
  var yRadius = xRadius / 3;
  var extent = [center[0] - xRadius, center[1] - yRadius, center[0] + xRadius, center[1] + yRadius];
  return ol.geom.Polygon.fromExtent(extent);
};


/**
 * Create a tile icon geometry to display in the legend.
 * @param {!osx.legend.LegendOptions} options
 * @return {!ol.geom.GeometryCollection}
 */
os.legend.createTileGeometry = function(options) {
  // what magic numbers? these were carefully calculated using math (certainly not trial and error) to draw a really
  // awesome scalable tile icon. vector graphics, yo.
  var dim = Math.ceil(options.fontSize * 0.8);
  var inset = Math.round(dim / 2.85);
  var offsetX = 10 - Math.floor(options.fontSize / 8);
  var offsetY = options.offsetY;

  // draw a tile icon as a collection of overlapping polygons
  var polygons = [];
  for (var i = 0; i < 3; i++) {
    polygons.push(new ol.geom.Polygon([[
      [offsetX + inset, offsetY],
      [(offsetX + dim), offsetY],
      [offsetX + dim - inset, offsetY + inset],
      [offsetX, offsetY + inset],
      [offsetX + inset, offsetY]
    ]]));

    offsetY -= Math.ceil(inset / 2);
  }

  return new ol.geom.GeometryCollection(polygons);
};


/**
 * Creates a style config tailored for rendering to the legend.
 * @param {!os.source.Vector} source
 * @param {!osx.legend.LegendOptions} options
 * @return {!Object}
 */
os.legend.getSourceConfig = function(source, options) {
  var config = os.style.StyleManager.getInstance().getLayerConfig(source.getId()) ||
      os.style.DEFAULT_VECTOR_CONFIG;

  // clone so we can modify it freely
  config = /** @type {!Object} */ (os.object.unsafeClone(config));

  // scale the radius with font size
  os.object.set(config, ['image', 'radius'], Math.round(options.fontSize / 3));

  var geomShape = source.getGeometryShape();
  config['shape'] = geomShape;

  var shape = os.style.SHAPES[geomShape];
  if (shape && shape['config'] && shape['config']['image']) {
    os.style.mergeConfig(shape['config'], config);
  }

  if (os.style.CENTER_LOOKUP[geomShape]) {
    var geomCenterShape = source.getCenterGeometryShape();
    var centerShape = os.style.SHAPES[geomCenterShape];
    if (centerShape && centerShape['config'] && centerShape['config']['image']) {
      os.style.mergeConfig(centerShape['config'], config);
    }
  }

  return config;
};


/**
 * Add a label to the legend canvas.
 * @param {string} text The text to render
 * @param {!osx.legend.LegendOptions} options Draw options
 * @param {string=} opt_font The font to use
 * @param {number=} opt_offsetX Horizontal offset for the label
 * @return {!ol.style.Style}
 * @private
 */
os.legend.getLabelStyle_ = function(text, options, opt_font, opt_offsetX) {
  var font = opt_font != null ? opt_font : options.font;
  var offsetX = opt_offsetX != null ? opt_offsetX : options.offsetX;

  return new ol.style.Style({
    text: new ol.style.Text({
      text: text,
      font: font,
      textAlign: 'left',
      textBaseline: 'middle',
      fill: os.legend.LABEL_FILL_STYLE,
      offsetX: offsetX,
      stroke: os.legend.LABEL_STROKE_STYLE
    })
  });
};

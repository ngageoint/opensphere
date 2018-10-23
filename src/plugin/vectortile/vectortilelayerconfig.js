goog.provide('plugin.vectortile.VectorTileLayerConfig');

goog.require('goog.log');
goog.require('ol.VectorTile');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTileRenderType');
goog.require('ol.obj');
goog.require('ol.source.VectorTile');
goog.require('os.layer.VectorTile');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.mixin.vectortilesource');
goog.require('os.net');
goog.require('os.net.Request');


/**
 * @constructor
 * @extends {os.layer.config.AbstractLayerConfig}
 */
plugin.vectortile.VectorTileLayerConfig = function() {
  plugin.vectortile.VectorTileLayerConfig.base(this, 'constructor');

  /**
   * @type {?os.net.CrossOrigin}
   * @protected
   */
  this.crossOrigin = null;

  /**
   * @type {ol.proj.Projection}
   * @protected
   */
  this.projection = null;

  /**
   * List of URLs for load balancing.
   * @type {Array<string>}
   * @protected
   */
  this.urls = [];
};
goog.inherits(plugin.vectortile.VectorTileLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.vectortile.VectorTileLayerConfig.LOGGER_ = goog.log.getLogger('plugin.vectortile.VectorTileLayerConfig');


/**
 * @suppress {visibility}
 */
plugin.vectortile.VectorTileLayerConfig.prototype.expandUrls =
    os.layer.config.AbstractTileLayerConfig.prototype.expandUrls;


/**
 * @inheritDoc
 */
plugin.vectortile.VectorTileLayerConfig.prototype.initializeConfig = function(options) {
  plugin.vectortile.VectorTileLayerConfig.base(this, 'initializeConfig', options);

  if (options['urls'] != null) {
    this.urls = /** @type {!Array<string>} */ (options['urls']);
  } else if (this.url) {
    // make sure the "urls" property is set in the options for multiple URL support
    options['urls'] = this.urls = [this.url];

    // remove the "url" property to avoid confusion
    options['url'] = undefined;
  }

  this.expandUrls();
  options['urls'] = this.urls;

  var projection = os.proj.getBestSupportedProjection(options);
  if (!projection) {
    throw new Error('No projections supported by the layer are defined!');
  }

  this.projection = projection;

  // cross origin
  if (!os.net.isValidCrossOrigin(options['crossOrigin'])) {
    this.crossOrigin = /** @type {os.net.CrossOrigin} */ (os.net.getCrossOrigin(this.urls[0]));
  } else {
    this.crossOrigin = /** @type {os.net.CrossOrigin} */ (options['crossOrigin']);

    for (var i = 0; i < this.urls.length; i++) {
      var url = this.urls[i];

      // register the cross origin value by URL pattern so that our Cesium.loadImage mixin can find it
      os.net.registerCrossOrigin(os.layer.config.AbstractTileLayerConfig.getUrlPattern(url), this.crossOrigin);
    }
  }

  // the correct none equivalent for crossOrigin in OL is null
  if (this.crossOrigin === os.net.CrossOrigin.NONE) {
    this.crossOrigin = null;
    options['crossOrigin'] = null;
  }
};


/**
 * @param {Object<string, *>} options The options
 * @return {ol.source.VectorTile}
 */
plugin.vectortile.VectorTileLayerConfig.prototype.getSource = function(options) {
  options['format'] = options['format'] !== undefined ? options['format'] : new ol.format.MVT();
  return new ol.source.VectorTile(options);
};

/**
 * @param {ol.source.VectorTile} source The source
 * @param {Object<string, *>} options The options
 * @return {os.layer.VectorTile}
 */
plugin.vectortile.VectorTileLayerConfig.prototype.getLayer = function(source, options) {
  options['renderMode'] = options['renderMode'] || ol.layer.VectorTileRenderType.IMAGE;
  var vectorTileOptions = /** @type {olx.source.VectorTileOptions} */ (ol.obj.assign({}, options, {
    'source': source
  }));

  var layerClass = /** @type {!Function} */ (options['layerClass'] || os.layer.VectorTile);
  return new layerClass(vectorTileOptions);
};


/**
 * @inheritDoc
 */
plugin.vectortile.VectorTileLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);

  // The extent is set on the source and not the layer in order to properly support wrap-x.
  // See urltilemixin.js for more details.
  if (options['extent']) {
    var extentProjection = /** @type {!string} */ (options['extentProjection']) || os.proj.EPSG4326;
    var extent = /** @type {ol.Extent} */ (options['extent']);
    source.setExtent(ol.proj.transformExtent(extent, extentProjection, this.projection));
  }

  if (options['attributions']) {
    source.setAttributions(/** @type {Array<string>} */ (options['attributions']));
  }

  if (this.crossOrigin && this.crossOrigin !== os.net.CrossOrigin.NONE) {
    if (options['proxy']) {
      goog.log.fine(plugin.vectortile.VectorTileLayerConfig.LOGGER_,
          'layer ' + this.id + ' proxy=true');
      os.ol.source.tileimage.addProxyWrapper(source);
    } else if (options['proxy'] === undefined) {
      goog.log.fine(plugin.vectortile.VectorTileLayerConfig.LOGGER_,
          'layer ' + this.id + ' proxy=auto');
      os.ol.source.tileimage.autoProxyCheck(source, this.projection);
    }
  }

  goog.log.fine(plugin.vectortile.VectorTileLayerConfig.LOGGER_,
      'layer ' + this.id + ' crossOrigin=' + this.crossOrigin);

  var layer = this.getLayer(source, options);
  options['skipStyle'] = true;
  layer.restore(options);

  if (options['styleUrl'] && options['sources']) {
    new os.net.Request(/** @type {string} */ (options['styleUrl'])).getPromise()
        .then(function(resp) {
          return JSON.parse(resp);
        }).then(function(glStyle) {
          var glStyleFunction = parseMapboxStyle(glStyle, /** @type {string|Array<string>} */ (options['sources']));

          /**
           * @param {ol.Feature|ol.render.Feature} feature
           * @param {number} resolution
           * @return {ol.style.Style|Array<ol.style.Style>}
           */
          var styleFunction = function(feature, resolution) {
            var styleConfig = glStyleFunction(feature.getProperties(), feature.getGeometry().getType(),
                resolution);

            if (Array.isArray(styleConfig)) {
              if (styleConfig.length === 1) {
                styleConfig = styleConfig[0];
              } else {
                styleConfig = ol.obj.assign.apply(null, styleConfig);
              }
            }

            return os.style.StyleManager.getInstance().getOrCreateStyle(styleConfig);
          };

          layer.setStyle(styleFunction);
        }).thenCatch(function(e) {
          goog.log.error(plugin.vectortile.VectorTileLayerConfig.LOGGER_,
              'layer ' + layer.getId() + ' could not load style from ' + options['styleUrl']);
        });
  }

  return layer;
};

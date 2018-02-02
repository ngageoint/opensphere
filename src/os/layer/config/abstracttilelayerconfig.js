goog.provide('os.layer.config.AbstractTileLayerConfig');

goog.require('goog.log');
goog.require('os.layer.Tile');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.map');
goog.require('os.mixin.TileImage');
goog.require('os.mixin.UrlTileSource');
goog.require('os.net');
goog.require('os.ol.source.tileimage');
goog.require('os.tile.ColorableTile');



/**
 * @extends {os.layer.config.AbstractLayerConfig}
 * @constructor
 */
os.layer.config.AbstractTileLayerConfig = function() {
  os.layer.config.AbstractTileLayerConfig.base(this, 'constructor');

  /**
   * @type {?ol.proj.Projection}
   * @protected
   */
  this.projection = null;

  /**
   * @type {?ol.tilegrid.TileGrid}
   * @protected
   */
  this.tileGrid = null;

  /**
   * @type {?os.net.CrossOrigin}
   * @protected
   */
  this.crossOrigin = null;

  /**
   * @type {?Function}
   * @protected
   */
  this.tileClass = null;

  /**
   * List of URLs for load balancing.
   * @type {Array<string>}
   * @protected
   */
  this.urls = [];
};
goog.inherits(os.layer.config.AbstractTileLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.config.AbstractTileLayerConfig.LOGGER_ = goog.log.getLogger('os.layer.config.AbstractTileLayerConfig');


/**
 * Regular expression matcher for rotating tile server names in alpha range.
 * @type {RegExp}
 * @private
 * @const
 */
os.layer.config.AbstractTileLayerConfig.RotatingAlphaRegexp = new RegExp(/{[a-zA-Z]-[a-zA-Z]}/g);


/**
 * Regular expression matcher for rotating tile server names in numerical range.
 * @type {RegExp}
 * @private
 * @const
 */
os.layer.config.AbstractTileLayerConfig.RotatingNumericRegexp = new RegExp(/{\d-\d}/g);


/**
 * @inheritDoc
 */
os.layer.config.AbstractTileLayerConfig.prototype.initializeConfig = function(options) {
  os.layer.config.AbstractTileLayerConfig.base(this, 'initializeConfig', options);

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

  var width = this.getTileWidth(options);
  var height = this.getTileHeight(options);

  // detect best projection
  var appProj = os.map.PROJECTION;
  var desiredProjection = ol.proj.get(/** @type {ol.ProjectionLike} */ (options['projection']));
  var supportedProjections = /** @type {Array<!string>} */ (options['projections'] || []);
  var preferredProjections = [os.proj.EPSG4326, os.proj.CRS84, os.proj.EPSG3857, os.proj.GOOGLE];

  if (desiredProjection) {
    var code = desiredProjection.getCode();
    preferredProjections.unshift(code);
    supportedProjections.unshift(code);
  }

  preferredProjections.unshift(appProj.getCode());

  // defaults
  this.projection = appProj;

  for (var i = 0, n = preferredProjections.length; i < n; i++) {
    var p = ol.proj.get(preferredProjections[i]);

    if (p && supportedProjections.indexOf(p.getCode()) > -1) {
      this.projection = !ol.proj.equivalent(p, appProj) ? p : this.projection;
      break;
    }
  }

  this.tileGrid = ol.tilegrid.createForProjection(this.projection, ol.DEFAULT_MAX_ZOOM, [width, height]);

  // cross origin
  if (!os.net.isValidCrossOrigin(options['crossOrigin'])) {
    this.crossOrigin = /** @type {os.net.CrossOrigin} */ (os.net.getCrossOrigin(this.urls[0]));
  } else {
    this.crossOrigin = /** @type {os.net.CrossOrigin} */ (options['crossOrigin']);

    for (var i = 0; i < this.urls.length; i++) {
      var url = this.urls[i];

      // register the cross origin value by URL pattern so that our Cesium.loadImage mixin can find it
      os.net.registerCrossOrigin(this.getUrlPattern(url), this.crossOrigin);
    }
  }

  // the correct none equivalent for crossOrigin in OL3 is null
  if (this.crossOrigin === os.net.CrossOrigin.NONE) {
    this.crossOrigin = null;
    options['crossOrigin'] = null;
  }
  // tile class
  this.tileClass = /** @type {Function} */ (options['tileClass']) || os.layer.Tile;
};


/**
 * @inheritDoc
 */
os.layer.config.AbstractTileLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);

  if (os.implements(source, os.source.IFilterableTileSource.ID)) {
    // make it use the colorable
    source.setTileClass(os.tile.ColorableTile);
  }

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
      goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_,
          'layer ' + this.id + ' proxy=true');
      os.ol.source.tileimage.addProxyWrapper(source);
    } else if (options['proxy'] === undefined) {
      goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_,
          'layer ' + this.id + ' proxy=auto');
      os.ol.source.tileimage.autoProxyCheck(source, this.projection);
    }
  }

  goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_,
      'layer ' + this.id + ' crossOrigin=' + this.crossOrigin);

  if (!source.tileLoadSet) {
    source.setTileLoadFunction(source.getTileLoadFunction());
  }

  var tileImageOptions = /** @type {olx.source.TileImageOptions} */ ({
    source: source
  });

  var tileLayer = new this.tileClass(tileImageOptions);
  this.configureLayer(tileLayer, options);
  tileLayer.restore(options);
  return tileLayer;
};


/**
 * @param {os.layer.Tile} layer
 * @param {Object<string, *>} options
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.prototype.configureLayer = function(layer, options) {
  if (options['explicitType'] != null) {
    layer.setExplicitType(/** @type {string} */ (options['explicitType']));
  }
};


/**
 * @param {Object<string, *>} options
 * @return {ol.source.TileImage}
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.prototype.getSource = goog.abstractMethod;


/**
 * @param {Object<string, *>} options
 * @return {number}
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.prototype.getTileWidth = function(options) {
  return /** @type {number} */ (options['tileWidth'] || options['tileSize'] || 512);
};


/**
 * @param {Object<string, *>} options
 * @return {number}
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.prototype.getTileHeight = function(options) {
  return /** @type {number} */ (options['tileHeight'] || options['tileSize'] || 512);
};


/**
 * @param {string} url The url
 * @return {RegExp} The url pattern
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.prototype.getUrlPattern = function(url) {
  // replace {z}, {x}, {y}, and {-y} with number regexps
  url = url.replace(/{-?[zxy]}/g, '\\d+');

  // replace {0-9} ranges for rotating tile servers
  url = url.replace(os.layer.config.AbstractTileLayerConfig.RotatingNumericRegexp, '\\d');

  // replace {a-z} ranges for rotating tile servers
  url = url.replace(os.layer.config.AbstractTileLayerConfig.RotatingAlphaRegexp, '[a-zA-Z]');

  return new RegExp('^' + url);
};


/**
 * Expand URLs that contain ranges for rotating tile servers.
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.prototype.expandUrls = function() {
  var expandedUrls = [];
  for (var i = 0; i < this.urls.length; i++) {
    var url = this.urls[i];
    if (goog.isString(url)) {
      var expanded = /** @type {Array<string>} */ (os.layer.config.AbstractTileLayerConfig.expandUrl(url));
      for (var j = 0; j < expanded.length; j++) {
        var expandedUrl = /** @type {string} */ (expanded[j]);
        expandedUrls.push(expandedUrl);
      }
    } else {
      // pass through.
      expandedUrls.push(url);
    }
  }
  goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_,
      'Potentially expanded URL set: ' + expandedUrls.join());
  this.urls = expandedUrls;
};

/**
 * Expand a URL that contains a range for rotating tile servers.
 *
 * URLs that do not contain a range are returned as a single element array.
 *
 * @param {string} url the url to expand
 * @return {Array<string>} the full list of urls corresponding to the url range.
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.expandUrl = function(url) {
  var urls = [];
  if (os.layer.config.AbstractTileLayerConfig.RotatingAlphaRegexp.test(url)) {
    goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_, 'Expanding URL with alpha range: ' + url);
    var match = url.match(os.layer.config.AbstractTileLayerConfig.RotatingAlphaRegexp)[0];
    urls = urls.concat(os.layer.config.AbstractTileLayerConfig.expandUrlMatch(url, match));
  } else if (os.layer.config.AbstractTileLayerConfig.RotatingNumericRegexp.test(url)) {
    goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_, 'Expanding URL with numeric range: ' + url);
    var match = url.match(os.layer.config.AbstractTileLayerConfig.RotatingNumericRegexp)[0];
    urls = urls.concat(os.layer.config.AbstractTileLayerConfig.expandUrlMatch(url, match));
  } else {
    goog.log.fine(os.layer.config.AbstractTileLayerConfig.LOGGER_, 'Not expanding URL: ' + url);
    urls.push(url);
  }
  return urls;
};

/**
 * Expand a URL match.
 *
 * URLs that do not contain a range are returned as a single element array.
 *
 * @param {string} url the url to expand
 * @param {string} match the matched values
 * @return {Array<string>} the full list of urls corresponding to the url.
 * @protected
 */
os.layer.config.AbstractTileLayerConfig.expandUrlMatch = function(url, match) {
  var urls = [];
  var range = match.slice(1, -1);
  var parts = range.split('-');
  var start = parts[0];
  var end = parts[1];
  for (var i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
    var replace = String.fromCharCode(i);
    var expandedUrl = url.replace(match, replace);
    urls.push(expandedUrl);
  }
  return urls;
};



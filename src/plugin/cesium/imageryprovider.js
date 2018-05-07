goog.provide('plugin.cesium.ImageryProvider');

goog.require('goog.disposable.IDisposable');
goog.require('ol.events');
goog.require('ol.layer.Property');
goog.require('ol.source.XYZ');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.source.IFilterableTileSource');
goog.require('os.tile');


/**
 * Extension to the Cesium WMS tile provider. Adds the ability to track tile loading/unloading and apply image
 * processing filters to loaded tiles. Also slightly alters the way tile URLs are generated and tiles are loaded.
 * @param {!ol.source.TileImage} source
 * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the projection of the source is not defined.
 * @extends {Cesium.ImageryProvider}
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
plugin.cesium.ImageryProvider = function(source, opt_fallbackProj) {
  /**
   * @type {boolean}
   * @private
   */
  this.disposed_ = false;

  /**
   * @type {Cesium.Event}
   * @private
   */
  this.errorEvent_ = new Cesium.Event();

  /**
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  /**
   * @type {ol.source.TileImage}
   * @protected
   */
  this.source = source;

  /**
   * @type {?ol.proj.Projection}
   * @protected
   */
  this.projection = null;

  /**
   * @type {?ol.proj.Projection}
   * @protected
   */
  this.fallbackProj = goog.isDef(opt_fallbackProj) ? opt_fallbackProj : null;

  /**
   * @type {HTMLCanvasElement}
   * @protected
   */
  this.emptyCanvas = /** @type {HTMLCanvasElement} */ (goog.dom.createElement(goog.dom.TagName.CANVAS));
  this.emptyCanvas.width = 1;
  this.emptyCanvas.height = 1;

  ol.events.listen(this.source, goog.events.EventType.CHANGE, this.onSourceChange_, this);
  this.onSourceChange_();
};


/**
 * @inheritDoc
 */
plugin.cesium.ImageryProvider.prototype.dispose = function() {
  this.disposed_ = true;

  if (this.source) {
    ol.events.unlisten(this.source, goog.events.EventType.CHANGE, this.onSourceChange_, this);

    try {
      /** @type {os.ol.source.ILoadingSource} */ (this.source).setLoading(false);
    } catch (e) {}

    this.source = null;
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.ImageryProvider.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @param {goog.events.Event=} opt_event
 * @private
 */
plugin.cesium.ImageryProvider.prototype.onSourceChange_ = function(opt_event) {
  if (!this.ready_ && this.source.getState() == 'ready') {
    var proj = this.source.getProjection();
    this.projection = goog.isDefAndNotNull(proj) ? proj : this.fallbackProj;
    if (this.projection == ol.proj.get(os.proj.EPSG4326)) {
      this.tilingScheme_ = new Cesium.GeographicTilingScheme();
    } else if (this.projection == ol.proj.get(os.proj.EPSG3857)) {
      this.tilingScheme_ = new Cesium.WebMercatorTilingScheme();
    } else {
      return;
    }
    this.rectangle_ = this.tilingScheme_.rectangle;
    this.credit_ = plugin.cesium.ImageryProvider.createCreditForSource(this.source) || undefined;
    this.ready_ = true;
  }
};


/**
 * TODO: attributions for individual tile ranges
 * @override
 */
plugin.cesium.ImageryProvider.prototype.getTileCredits = function(x, y, level) {
  return undefined;
};
goog.exportProperty(
    plugin.cesium.ImageryProvider.prototype,
    'getTileCredits',
    plugin.cesium.ImageryProvider.prototype.getTileCredits);


/**
 * Attempt incrementing the tile load count on the source.
 * @protected
 */
plugin.cesium.ImageryProvider.prototype.incrementLoading = function() {
  try {
    /** @type {os.ol.source.ILoadingSource} */ (this.source).incrementLoading();
  } catch (e) {}
};


/**
 * Attempt decrementing the tile load count on the source.
 * @param {Image} image
 * @protected
 * @suppress {accessControls}
 */
plugin.cesium.ImageryProvider.prototype.decrementLoading = function(image) {
  try {
    if (this.source instanceof ol.source.UrlTile) {
      this.source.loadCount_++;
    }

    /** @type {os.ol.source.ILoadingSource} */ (this.source).decrementLoading();
  } catch (e) {}
};


/**
 * Attempt decrementing the tile load count on the source in an error case
 * @param {Image} image
 * @protected
 * @suppress {accessControls}
 */
plugin.cesium.ImageryProvider.prototype.decrementLoadingError = function(image) {
  try {
    if (this.source instanceof ol.source.UrlTile) {
      this.source.errorCount_++;
    }

    /** @type {os.ol.source.ILoadingSource} */ (this.source).decrementLoading();
  } catch (e) {}
};


/**
 * @override
 */
plugin.cesium.ImageryProvider.prototype.requestImage = function(x, y, level) {
  var tileUrlFunction = this.source.getTileUrlFunction();
  if (!goog.isNull(tileUrlFunction) && !goog.isNull(this.projection)) {
    var z_ = (this.tilingScheme_ instanceof Cesium.GeographicTilingScheme) ? (level + 1) : level;

    var maxResolution = /** @type {number} */ (this.source.get(ol.layer.Property.MAX_RESOLUTION));
    var minResolution = /** @type {number} */ (this.source.get(ol.layer.Property.MIN_RESOLUTION));
    var minZoom = goog.isDef(maxResolution) ? os.map.resolutionToZoom(maxResolution, this.projection) : 0;
    var maxZoom = goog.isDef(minResolution) ? os.map.resolutionToZoom(minResolution, this.projection) : 42;

    // we'll give a bit of a buffer to minZoom so that we don't cause weirdness with less detailed tiles around the
    // edges of the globe
    minZoom -= 1;

    if (minZoom <= z_ && z_ <= maxZoom) {
      // perform mapping of Cesium tile coordinates to ol3 tile coordinates
      var y_ = -y - 1; // opposite indexing
      var url = tileUrlFunction([z_, x, y_], 1, this.projection);
      if (goog.isDef(url)) {
        var promise = Cesium.ImageryProvider.loadImage(this, url);
        if (goog.isDef(promise)) {
          this.incrementLoading();
          var decBinding = this.decrementLoading.bind(this);
          var decBindingError = this.decrementLoadingError.bind(this);
          Cesium.when(promise, decBinding, decBindingError);
          if (os.implements(this.source, os.source.IFilterableTileSource.ID)) {
            var filterFns = this.source.getTileFilters();
            // only go down this road if there are filter functions
            if (filterFns.length > 0) {
              var deferred = Cesium.when.defer();
              var newPromise = deferred.promise;
              var resolveBinding = plugin.cesium.ImageryProvider.resolver.bind(this, filterFns, deferred);
              Cesium.when(promise, resolveBinding, resolveBinding);
              return newPromise;
            }
          }
        }

        return promise;
      }
    }
  }

  // return empty canvas to stop Cesium from retrying later
  return this.emptyCanvas;
};
goog.exportProperty(
    plugin.cesium.ImageryProvider.prototype,
    'requestImage',
    plugin.cesium.ImageryProvider.prototype.requestImage);


/**
 * HACK ALERT: Firefox is a bad browser and can't do this without introducing a second level of
 * asynchronicity to the recoloring process. This should be achievable by simply changing image.src on the
 * image that resolves the original promise to the recolored data URL. Firefox, however, is asynchronous
 * in requesting/decoding a data URL image while other browsers are not. Instead, we must resolve the
 * promise with the raw filtered canvas rather than an image element.
 *
 * @param {Array<os.tile.TileFilterFn>} filterFns The filter functions to run on the image
 * @param {*} deferred The deferred to resolve
 * @param {Image} image The image to filter
 */
plugin.cesium.ImageryProvider.resolver = function(filterFns, deferred, image) {
  if (image) {
    var canvas = os.tile.filterImage(image, filterFns);
    deferred.resolve(canvas);
    return;
  }

  deferred.resolve(image);
};


/**
 * Tries to create proper Cesium.Credit for the given ol.source.Source as closely as possible.
 * @param {!ol.source.Source} source
 * @return {Cesium.Credit|undefined}
 */
plugin.cesium.ImageryProvider.createCreditForSource = function(source) {
  var html;
  var attributions = source.getAttributions();
  if (attributions) {
    html = attributions.map(function(el, i, arr) {
      // strip html tags (not supported in Cesium)
      return el.getHTML();
    }).join(' ');
  }

  if (!html) {
    // only use logo if no text is specified
    // otherwise the Cesium will automatically skip the text:
    // "The text to be displayed on the screen if no imageUrl is specified."
    var logo = source.getLogo();
    if (logo) {
      if (goog.isString(logo)) {
        html = '<img src="' + logo + '"/>';
      } else {
        html = '<a href="' + logo.href + '" target="_blank"><img src="' + logo.src + '" title="Cesium"/></a>';
      }
    }
  }

  return html ? new Cesium.Credit(html) : undefined;
};


// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(plugin.cesium.ImageryProvider.prototype, {
  ready: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {boolean}
         */
        function() {
          return this.ready_;
        }
  },

  rectangle: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {Cesium.Rectangle}
         */
        function() {
          return this.rectangle_;
        }
  },

  tileWidth: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         */
        function() {
          var tg = this.source.getTileGrid();
          if (tg) {
            var tileSize = tg.getTileSize(0);
            return goog.isNumber(tileSize) ? tileSize : tileSize[0];
          }
          return 512;
        }
  },

  tileHeight: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         */
        function() {
          return this.tileWidth;
        }
  },

  maximumLevel: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         */
        function() {
          var maxZoom = os.map.MAX_ZOOM;

          var minResolution = /** @type {number} */ (this.source.get(ol.layer.Property.MIN_RESOLUTION));
          if (minResolution != null) {
            maxZoom = Math.round(os.MapContainer.getInstance().resolutionToZoom(minResolution));
          } else {
            var tg = this.source.getTileGrid();
            if (tg) {
              maxZoom = tg.getMaxZoom();
            }
          }

          return maxZoom;
        }
  },

  minimumLevel: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         */
        function() {
          // WARNING: Do not use the minimum level (at least until the extent is
          // properly set). Cesium assumes the minimumLevel to contain only
          // a few tiles and tries to load them all at once -- this can
          // freeze and/or crash the browser !
          return 1;
          // var tg = this.source.getTileGrid();
          // return !goog.isNull(tg) ? tg.getMinZoom() : 0;
        }
  },

  tilingScheme: {
    get: /**
          * @this plugin.cesium.ImageryProvider
          */
        function() {
          return this.tilingScheme_;
        }
  },

  tileDiscardPolicy: {
    get:
        function() {
          return undefined;
        }
  },

  errorEvent: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {Cesium.Event}
         */
        function() {
          return this.errorEvent_;
        }
  },

  credit: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {Cesium.Credit}
         */
        function() {
          return this.credit_;
        }
  },

  proxy: {
    get:
        /**
         * @return {string|undefined}
         */
        function() {
          return undefined;
        }
  },

  hasAlphaChannel: {
    get:
        /**
         * @return {boolean}
         */
        function() {
          return true;
        }
  }
});

goog.provide('os.olcs.ImageryProvider');

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
os.olcs.ImageryProvider = function(source, opt_fallbackProj) {
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
goog.inherits(os.olcs.ImageryProvider, Cesium.ImageryProvider);


/**
 * @inheritDoc
 */
os.olcs.ImageryProvider.prototype.dispose = function() {
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
os.olcs.ImageryProvider.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @param {goog.events.Event=} opt_event
 * @private
 */
os.olcs.ImageryProvider.prototype.onSourceChange_ = function(opt_event) {
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

    var credit = os.olcs.ImageryProvider.createCreditForSource(this.source);
    this.credit_ = !goog.isNull(credit) ? credit : undefined;

    this.ready_ = true;
  }
};


/**
 * TODO: attributions for individual tile ranges
 * @override
 */
os.olcs.ImageryProvider.prototype.getTileCredits = function(x, y, level) {
  return undefined;
};
goog.exportProperty(
    os.olcs.ImageryProvider.prototype,
    'getTileCredits',
    os.olcs.ImageryProvider.prototype.getTileCredits);


/**
 * Attempt incrementing the tile load count on the source.
 * @protected
 */
os.olcs.ImageryProvider.prototype.incrementLoading = function() {
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
os.olcs.ImageryProvider.prototype.decrementLoading = function(image) {
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
os.olcs.ImageryProvider.prototype.decrementLoadingError = function(image) {
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
os.olcs.ImageryProvider.prototype.requestImage = function(x, y, level) {
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
              var resolveBinding = os.olcs.ImageryProvider.resolver.bind(this, filterFns, deferred);
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
    os.olcs.ImageryProvider.prototype,
    'requestImage',
    os.olcs.ImageryProvider.prototype.requestImage);


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
os.olcs.ImageryProvider.resolver = function(filterFns, deferred, image) {
  if (image) {
    var canvas = os.tile.filterImage(image, filterFns);
    deferred.resolve(canvas);
    return;
  }

  deferred.resolve(image);
};


/**
 * Tries to create proper Cesium.Credit for
 * the given ol.source.Source as closely as possible.
 * @param {!ol.source.Source} source
 * @return {?Cesium.Credit}
 */
os.olcs.ImageryProvider.createCreditForSource = function(source) {
  var creditOptions = /** @type {Cesium.CreditOptions} */ ({});
  creditOptions.text = '';
  var attributions = source.getAttributions();
  if (!goog.isNull(attributions)) {
    goog.array.forEach(attributions, function(el, i, arr) {
      // strip html tags (not supported in Cesium)
      creditOptions.text += el.getHTML().replace(/<\/?[^>]+(>|$)/g, '') + ' ';
    });
  }

  if (creditOptions.text.length == 0) {
    // only use logo if no text is specified
    // otherwise the Cesium will automatically skip the text:
    // "The text to be displayed on the screen if no imageUrl is specified."
    var logo = source.getLogo();
    if (goog.isDef(logo)) {
      if (goog.isString(logo)) {
        creditOptions.imageUrl = logo;
      } else {
        creditOptions.imageUrl = logo.src;
        creditOptions.link = logo.href;
      }
    }
  }

  return (goog.isDef(creditOptions.imageUrl) || creditOptions.text.length > 0) ?
         new Cesium.Credit(creditOptions) : null;
};


// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(os.olcs.ImageryProvider.prototype, {
  ready: {
    get:
        /**
         * @this os.olcs.ImageryProvider
         * @return {boolean}
         */
        function() {
          return this.ready_;
        }
  },

  rectangle: {
    get:
        /**
         * @this os.olcs.ImageryProvider
         * @return {Cesium.Rectangle}
         */
        function() {
          return this.rectangle_;
        }
  },

  tileWidth: {
    get:
        /**
         * @this os.olcs.ImageryProvider
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
         * @this os.olcs.ImageryProvider
         * @return {number}
         */
        function() {
          return this.tileWidth;
        }
  },

  maximumLevel: {
    get:
        /**
         * @this os.olcs.ImageryProvider
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
         * @this os.olcs.ImageryProvider
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
          * @this os.olcs.ImageryProvider
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
         * @this os.olcs.ImageryProvider
         * @return {Cesium.Event}
         */
        function() {
          return this.errorEvent_;
        }
  },

  credit: {
    get:
        /**
         * @this os.olcs.ImageryProvider
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

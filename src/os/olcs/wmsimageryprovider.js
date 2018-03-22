goog.provide('os.olcs.WMSImageryProvider');

goog.require('goog.disposable.IDisposable');
goog.require('os.olcs.ImageryProvider');
goog.require('os.tile');


/**
 * Extension to the Cesium WMS tile provider. Adds the ability to track tile loading/unloading and apply image
 * processing filters to loaded tiles. Also used for WMS parameters.
 * @param {Cesium.WebMapServiceImageryProviderOptions} options
 * @param {!ol.source.TileImage} source
 * @extends {Cesium.WebMapServiceImageryProvider}
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
os.olcs.WMSImageryProvider = function(options, source) {
  throw new Error('WMS imagery provider created before initialization!');
};


/**
 * Initialize the class. This must be done asynchronously after Cesium has been loaded.
 */
os.olcs.WMSImageryProvider.init = function() {
  /**
   * Extension to the Cesium WMS tile provider. Adds the ability to track tile loading/unloading and apply image
   * processing filters to loaded tiles. Also used for WMS parameters.
   * @param {Cesium.WebMapServiceImageryProviderOptions} options
   * @param {!ol.source.TileImage} source
   * @extends {Cesium.WebMapServiceImageryProvider}
   * @implements {goog.disposable.IDisposable}
   * @constructor
   */
  os.olcs.WMSImageryProvider = function(options, source) {
    // level 0 tiles look like garbage and will display at our default zoom (3), so start at level 1 instead
    options.minimumLevel = 1;

    os.olcs.WMSImageryProvider.base(this, 'constructor', options);

    /**
     * @type {boolean}
     * @private
     */
    this.disposed_ = false;

    /**
     * @type {number}
     * @private
     */
    this.loadCount_ = 0;

    /**
     * @type {ol.source.TileImage}
     * @protected
     */
    this.source = source;
  };
  goog.inherits(os.olcs.WMSImageryProvider, Cesium.WebMapServiceImageryProvider);

  // after recreating os.olcs.WMSImageryProvider, ensure this function can still be called without consequence.
  os.olcs.WMSImageryProvider.init = goog.nullFunction;

  /**
   * @inheritDoc
   */
  os.olcs.WMSImageryProvider.prototype.dispose = function() {
    this.disposed_ = true;

    if (this.source) {
      try {
        for (var i = this.loadCount_; i > 0; i--) {
          /** @type {os.ol.source.ILoadingSource} */ (this.source).decrementLoading();
        }
      } catch (e) {}

      this.source = null;
    }
  };

  /**
   * @inheritDoc
   */
  os.olcs.WMSImageryProvider.prototype.isDisposed = function() {
    return this.disposed_;
  };

  /**
   * Attempt incrementing the tile load count on the source.
   * @protected
   */
  os.olcs.WMSImageryProvider.prototype.incrementLoading = function() {
    try {
      /** @type {os.ol.source.ILoadingSource} */ (this.source).incrementLoading();
      this.loadCount_++;
    } catch (e) {}
  };

  /**
   * Attempt decrementing the tile load count on the source.
   * @protected
   */
  os.olcs.WMSImageryProvider.prototype.decrementLoading = function() {
    try {
      /** @type {os.ol.source.ILoadingSource} */ (this.source).decrementLoading();
      this.loadCount_--;
    } catch (e) {}
  };

  /**
   * @override
   */
  os.olcs.WMSImageryProvider.prototype.requestImage = function(x, y, level) {
    var promise = os.olcs.WMSImageryProvider.base(this, 'requestImage', x, y, level);
    if (goog.isDef(promise)) {
      this.incrementLoading();
      var decBinding = this.decrementLoading.bind(this);
      Cesium.when(promise, decBinding, decBinding);
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
  };
};

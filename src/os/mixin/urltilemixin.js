goog.provide('os.mixin.UrlTileSource');

goog.require('goog.Timer');
goog.require('goog.Uri');
goog.require('goog.async.Delay');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.source.UrlTile');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.ol.source.IUrlSource');


// add support for providing custom URL parameters
os.implements(ol.source.UrlTile, os.ol.source.IUrlSource.ID);


/*
 * We need tile layers to only load the tiles that intersect a given extent. OL3 provides an option for this
 * on the layer, but that clips the layer to the absolute extent and does not allow it to wrap. Instead, we
 * will provide an option to set the extent on the source and use a mixin to wrap the given TileURLFunction
 * and check the extent before continuing.
 *
 * This mixin also consolidates the logic necessary for the overall loading spinners for tile layers.
 */


/**
 * @type {boolean}
 */
ol.source.UrlTile.prototype.tileUrlSet = false;


/**
 * @type {boolean}
 */
ol.source.UrlTile.prototype.tileLoadSet = false;


/**
 * @type {?ol.Extent}
 */
ol.source.UrlTile.prototype.extent = null;


/**
 * How often the source will automatically refresh itself.
 * @type {number}
 * @protected
 */
ol.source.UrlTile.prototype.refreshInterval = 0;


/**
 * The delay used to auto refresh the source.
 * @type {goog.Timer}
 * @protected
 */
ol.source.UrlTile.prototype.refreshTimer = null;


/**
 * If the source can be refreshed.
 * @type {boolean}
 * @protected
 */
ol.source.UrlTile.prototype.refreshEnabled = false;


/**
 * @return {?ol.Extent} The extent
 */
ol.source.UrlTile.prototype.getExtent = function() {
  return this.extent;
};


/**
 * @param {?ol.Extent} extent The extent for the source. Must be in the same projection as the source.
 */
ol.source.UrlTile.prototype.setExtent = function(extent) {
  this.extent = extent;
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 */
ol.source.UrlTile.prototype.getParams = function() {
  // by default, params are not supported. openlayers implements these functions in higher level sources.
  return null;
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 */
ol.source.UrlTile.prototype.updateParams = function(params) {
  // by default, params are not supported. openlayers implements these functions in higher level sources.
};


/**
 * If the source can be refreshed.
 * @return {boolean}
 */
ol.source.UrlTile.prototype.isRefreshEnabled = function() {
  return this.refreshEnabled;
};


/**
 * Get the automatic refresh interval for the source.
 * @return {number}
 */
ol.source.UrlTile.prototype.getRefreshInterval = function() {
  return this.refreshInterval;
};


/**
 * Set the automatic refresh interval for the source.
 * @param {number} value The new refresh interval, in seconds.
 */
ol.source.UrlTile.prototype.setRefreshInterval = function(value) {
  if (this.refreshInterval != value) {
    this.refreshInterval = value;

    if (this.refreshTimer) {
      this.refreshTimer.unlisten(goog.Timer.TICK, this.onRefreshTimer, false, this);
      if (!this.refreshTimer.hasListener()) {
        // nobody's listening, so stop it
        this.refreshTimer.stop();
      }
    }

    this.refreshTimer = null;

    if (this.refreshInterval > 0) {
      this.refreshTimer = os.source.RefreshTimers[value];

      if (!this.refreshTimer) {
        // didn't find one for that time, so make a new one and save it off
        this.refreshTimer = new goog.Timer(1000 * value);
        os.source.RefreshTimers[value] = this.refreshTimer;
      }

      this.refreshTimer.listen(goog.Timer.TICK, this.onRefreshTimer, false, this);
      this.refreshTimer.start();
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.REFRESH_INTERVAL));
  }
};


/**
 * Refresh the source when the auto refresh delay fires.
 * @protected
 */
ol.source.UrlTile.prototype.onRefreshTimer = function() {
  if (this.isRefreshEnabled()) {
    this.refresh();
  }
};


/**
 * @inheritDoc
 */
ol.source.UrlTile.prototype.refresh = function() {
  this.tileCache.clear();
  this.changed();
};


/**
 * @param {ol.TileUrlFunctionType} tileUrlFunction
 * @private
 */
ol.source.UrlTile.prototype.setTileUrlFunctionInternal_ = ol.source.UrlTile.prototype.setTileUrlFunction;


/**
 * @param {ol.TileUrlFunctionType} tileUrlFunction
 * @suppress {duplicate}
 */
ol.source.UrlTile.prototype.setTileUrlFunction = function(tileUrlFunction) {
  this.tileUrlSet = true;
  var getExtent = this.getExtent.bind(this);
  var getTileGrid = this.getTileGrid.bind(this);

  this.setTileUrlFunctionInternal_(
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        var extent = getExtent();
        var intersects = true;

        if (extent) {
          var tileGrid = getTileGrid();

          if (!tileGrid) {
            return undefined;
          }

          if (tileGrid.getResolutions().length <= tileCoord[0]) {
            return undefined;
          }

          var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
          intersects = ol.extent.intersects(extent, tileExtent);
        }

        return intersects ? tileUrlFunction(tileCoord, pixelRatio, projection) : undefined;
      });
};


/**
 * @type {boolean}
 * @private
 */
ol.source.UrlTile.prototype.loading_ = false;


/**
 * @type {number}
 * @private
 */
ol.source.UrlTile.prototype.numLoadingTiles_ = 0;


/**
 * @type {number}
 * @private
 */
ol.source.UrlTile.prototype.loadCount_ = 0;


/**
 * @type {number}
 * @private
 */
ol.source.UrlTile.prototype.errorCount_ = 0;


/**
 * @type {boolean}
 * @private
 */
ol.source.UrlTile.prototype.error_ = false;


/**
 * @type {?Array.<goog.events.Key>}
 * @private
 */
ol.source.UrlTile.prototype.listenerKeys_ = null;


/**
 * Timer to prevent rapid firing loading events.
 * @type {?goog.async.Delay}
 * @private
 */
ol.source.UrlTile.prototype.loadingDelay_ = null;


/**
 * @inheritDoc
 */
ol.source.UrlTile.prototype.disposeInternal = function() {
  ol.source.Tile.prototype.disposeInternal.call(this);

  // remove any pending listeners
  if (this.listenerKeys_) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_.length = 0;
  }

  if (this.loadingDelay_) {
    this.loadingDelay_.dispose();
    this.loadingDelay_ = null;
  }

  if (this.tileCache) {
    // flush the image cache
    this.tileCache.clear();
  }
};


/**
 * @return {?goog.async.Delay}
 * @protected
 */
ol.source.UrlTile.prototype.getLoadingDelay = function() {
  if (!this.loadingDelay_ && !this.isDisposed()) {
    this.loadingDelay_ = new goog.async.Delay(this.fireLoadingEvent_, 500, this);
  }

  return this.loadingDelay_;
};


/**
 * @return {boolean}
 */
ol.source.UrlTile.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @param {boolean} value
 */
ol.source.UrlTile.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    this.loading_ = value;
    var delay = this.getLoadingDelay();

    if (delay) {
      if (this.loading_) {
        // always notify the UI when the layer starts loading
        delay.fire();
      } else {
        // add a delay when notifying the UI loading is complete in case it starts loading again soon. this prevents
        // flickering of the loading state, particularly when using Cesium.
        delay.start();
        this.numLoadingTiles_ = 0;
      }
    }
  }
};


/**
 * @return {boolean} True if this source has an error, false otherwise
 */
ol.source.UrlTile.prototype.hasError = function() {
  return this.error_;
};


/**
 * Fires an event to indicate a loading change.
 * @private
 */
ol.source.UrlTile.prototype.fireLoadingEvent_ = function() {
  if (!this.isDisposed()) {
    if (this.loadCount_ || this.errorCount_) {
      this.error_ = this.errorCount_ / (this.loadCount_ + this.errorCount_) > /** @type {number} */ (
        os.settings.get('tileErrorThreshold', 0.6));

      this.errorCount_ = 0;
      this.loadCount_ = 0;
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', this.loading_, !this.loading_));
  }
};


/**
 * Decrements loading
 */
ol.source.UrlTile.prototype.decrementLoading = function() {
  this.numLoadingTiles_--;

  if (this.numLoadingTiles_ === 0) {
    this.setLoading(false);
  }
};


/**
 * Increments loading
 */
ol.source.UrlTile.prototype.incrementLoading = function() {
  this.numLoadingTiles_++;

  if (this.numLoadingTiles_ === 1) {
    this.setLoading(true);
  }
};


/**
 * @param {Event} event
 * @private
 */
ol.source.UrlTile.prototype.onImageLoadOrError_ = function(event) {
  var key = goog.events.getListener(event.target, goog.events.EventType.LOAD, this.onImageLoadOrError_, false, this);
  if (key) {
    goog.array.remove(this.listenerKeys_, key);
    goog.events.unlistenByKey(key);
  }

  key = goog.events.getListener(event.target, goog.events.EventType.ERROR, this.onImageLoadOrError_, false, this);
  if (key) {
    goog.array.remove(this.listenerKeys_, key);
    goog.events.unlistenByKey(key);
  }

  if (event.type === goog.events.EventType.LOAD) {
    this.loadCount_++;
  } else {
    this.errorCount_++;
  }

  this.decrementLoading();
};


/**
 * @param {ol.TileLoadFunctionType} tileLoadFunction
 * @private
 */
ol.source.UrlTile.prototype.setTileLoadFunctionInternal_ = ol.source.UrlTile.prototype.setTileLoadFunction;


/**
 * @param {ol.TileLoadFunctionType} tileLoadFunction
 * @suppress {duplicate}
 */
ol.source.UrlTile.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileLoadSet = true;
  var scope = this;

  if (!this.loadingDelay_) {
    this.loadingDelay_ = new goog.async.Delay(this.fireLoadingEvent_, 500, this);
  }

  if (!this.listenerKeys_) {
    this.listenerKeys_ = [];
  }

  this.setTileLoadFunctionInternal_(
      /**
       * @param {ol.Tile} tile
       * @param {string} source
       */
      function(tile, source) {
        scope.incrementLoading();

        if (tile instanceof ol.ImageTile) {
          var img = tile.getImage();
          scope.listenerKeys_.push(goog.events.listen(img, goog.events.EventType.LOAD,
              scope.onImageLoadOrError_, false, scope));
          scope.listenerKeys_.push(goog.events.listen(img, goog.events.EventType.ERROR,
              scope.onImageLoadOrError_, false, scope));
        }

        if (scope.isRefreshEnabled() && scope.refreshInterval) {
          var uri = new goog.Uri(source);
          var qd = uri.getQueryData();
          qd.set('_cd', goog.now());
          source = uri.toString();
        }

        tileLoadFunction(tile, source);
      });
};

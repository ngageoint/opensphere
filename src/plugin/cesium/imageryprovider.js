goog.provide('plugin.cesium.ImageryProvider');

goog.require('goog.disposable.IDisposable');
goog.require('ol.events');
goog.require('olcs.core.OLImageryProvider');
goog.require('os.proj');
goog.require('plugin.cesium.TileGridTilingScheme');


/**
 * @param {!ol.source.TileImage} source
 * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the projection of the source is not defined.
 * @extends {olcs.core.OLImageryProvider}
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
plugin.cesium.ImageryProvider = function(source, opt_fallbackProj) {
  plugin.cesium.ImageryProvider.base(this, 'constructor', source, opt_fallbackProj);

  /**
   * @type {boolean}
   * @private
   */
  this.disposed_ = false;
};
goog.inherits(plugin.cesium.ImageryProvider, olcs.core.OLImageryProvider);


/**
 * @inheritDoc
 */
plugin.cesium.ImageryProvider.prototype.dispose = function() {
  this.disposed_ = true;
};


/**
 * @inheritDoc
 */
plugin.cesium.ImageryProvider.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.cesium.ImageryProvider.prototype.handleSourceChanged_ = function() {
  if (!this.ready_ && this.source_.getState() == 'ready') {
    this.projection_ = olcs.util.getSourceProjection(this.source_) || this.fallbackProj_;
    this.tilingScheme_ = new plugin.cesium.TileGridTilingScheme(this.source_);
    this.rectangle_ = this.tilingScheme_.rectangle;
    this.credit_ = olcs.core.OLImageryProvider.createCreditForSource(this.source_) || null;
    this.ready_ = true;
  }
};


/**
 * @override
 * @suppress {accessControls}
 * @export
 */
plugin.cesium.ImageryProvider.prototype.requestImage = function(x, y, level) {
  var z_ = level;
  var y_ = -y - 1;

  var deferred = Cesium.when.defer();
  var tilegrid = this.source_.getTileGridForProjection(this.projection_);

  if (z_ < tilegrid.getMinZoom() - 1 || z_ > tilegrid.getMaxZoom()) {
    deferred.resolve(this.emptyCanvas_); // no data
    return deferred.promise;
  }

  var tile = this.source_.getTile(z_, x, y_, 1, this.projection_);
  var state = tile.getState();

  if (state === ol.TileState.LOADED || state === ol.TileState.EMPTY) {
    deferred.resolve(tile.getImage());
  } else if (state === ol.TileState.ERROR) {
    deferred.resolve(this.emptyCanvas_);
  } else {
    tile.load();

    var unlisten = ol.events.listen(tile, ol.events.EventType.CHANGE, function() {
      var state = tile.getState();
      if (state === ol.TileState.LOADED || state === ol.TileState.EMPTY) {
        deferred.resolve(tile.getImage());
        ol.events.unlistenByKey(unlisten);
      } else if (state === ol.TileState.ERROR) {
        deferred.resolve(this.emptyCanvas_);
        ol.events.unlistenByKey(unlisten);
      }
    });
  }

  return deferred.promise;
};


// definitions of getters that are required to be present
// in the Cesium.ImageryProvider instance:
Object.defineProperties(plugin.cesium.ImageryProvider.prototype, {
  minimumLevel: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         */
        function() {
          // apparently level 0 tiles look like garbage and we're just gonna pass on those
          return 1;
        }
  },
  tileWidth: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         * @suppress {accessControls}
         */
        function() {
          var tg = this.source_.getTileGrid();
          if (tg) {
            var tileSize = tg.getTileSize(tg.getMinZoom());
            return Array.isArray(tileSize) ? tileSize[0] : tileSize;
          }
          return 256;
        }
  },
  tileHeight: {
    get:
        /**
         * @this plugin.cesium.ImageryProvider
         * @return {number}
         * @suppress {accessControls}
         */
        function() {
          var tg = this.source_.getTileGrid();
          if (tg) {
            var tileSize = tg.getTileSize(tg.getMinZoom());
            return Array.isArray(tileSize) ? tileSize[1] : tileSize;
          }
          return 256;
        }
  }
});

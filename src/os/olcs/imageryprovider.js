goog.provide('os.olcs.ImageryProvider');

goog.require('goog.disposable.IDisposable');
goog.require('ol.events');
goog.require('olcs.core.OLImageryProvider');
goog.require('os.proj');



/**
 * @param {!ol.source.TileImage} source
 * @param {ol.proj.Projection=} opt_fallbackProj Projection to assume if the projection of the source is not defined.
 * @extends {olcs.core.OLImageryProvider}
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
os.olcs.ImageryProvider = function(source, opt_fallbackProj) {
  os.olcs.ImageryProvider.base(this, 'constructor', source, opt_fallbackProj);

  /**
   * @private
   */
  this.disposed_ = false;
};
goog.inherits(os.olcs.ImageryProvider, olcs.core.OLImageryProvider);


/**
 * @inheritDoc
 */
os.olcs.ImageryProvider.prototype.dispose = function() {
  this.disposed_ = true;
};


/**
 * @inheritDoc
 */
os.olcs.ImageryProvider.prototype.isDisposed = function() {
  return this.disposed_;
};



/**
 * @override
 * @suppress {accessControls}
 * @export
 */
os.olcs.ImageryProvider.prototype.requestImage = function(x, y, level) {
  // Perform mapping of Cesium tile coordinates to ol3 tile coordinates:
  // 1) Cesium zoom level 0 is OpenLayers zoom level 1 for EPSG:4326
  var z_ = this.tilingScheme_ instanceof Cesium.GeographicTilingScheme ? level + 1 : level;
  // 2) OpenLayers tile coordinates increase from bottom to top
  var y_ = -y - 1;

  var deferred = Cesium.when.defer();
  var tilegrid = this.source_.getTileGridForProjection(this.projection_);
  if (z_ < tilegrid.getMinZoom() || z_ > tilegrid.getMaxZoom()) {
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
Object.defineProperties(os.olcs.ImageryProvider.prototype, {
  'minimumLevel': {
    'get': function() {
      // apparently level 0 tiles look like garbage and we're just gonna pass on those
      return 1;
    }
  },
  'tileWidth': {
    'get':
        /**
         * @this {olcs.core.OLImageryProvider}
         * @suppress {accessControls}
         */
        function() {
          var tg = this.source_.getTileGrid();
          return tg ? (Array.isArray(tg.getTileSize(0)) ? tg.getTileSize(0)[0] : tg.getTileSize(0)) : 256;
        }
  },
  'tileHeight': {
    'get':
        /**
         * @this {olcs.core.OLImageryProvider}
         * @suppress {accessControls}
         */
        function() {
          var tg = this.source_.getTileGrid();
          return tg ? (Array.isArray(tg.getTileSize(0)) ? tg.getTileSize(0)[1] : tg.getTileSize(0)) : 256;
        }
  }
});

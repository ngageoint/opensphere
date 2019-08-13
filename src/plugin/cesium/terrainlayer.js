goog.provide('plugin.cesium.TerrainLayer');

goog.require('goog.log');
goog.require('os.data.LayerNode');
goog.require('os.layer.LayerType');
goog.require('os.structs.ITreeNodeSupplier');
goog.require('os.ui.Icons');
goog.require('plugin.basemap.terrainNodeUIDirective');
goog.require('plugin.cesium.Layer');


/**
 * An OpenLayers layer that manages a Cesium terrain provider.
 *
 * @param {Cesium.TerrainProvider|undefined} provider The terrain provider.
 * @extends {plugin.cesium.Layer}
 * @implements {os.structs.ITreeNodeSupplier}
 * @constructor
 */
plugin.cesium.TerrainLayer = function(provider) {
  plugin.cesium.TerrainLayer.base(this, 'constructor');

  this.setOSType(plugin.cesium.CESIUM_ONLY_LAYER);
  this.setIcons(os.ui.Icons.TERRAIN);
  this.setExplicitType(os.layer.LayerType.TERRAIN);
  this.setNodeUI('<terrainnodeui></terrainnodeui>');
  this.log = plugin.cesium.TerrainLayer.LOGGER_;

  /**
   * Cesium terrain provider.
   * @type {Cesium.TerrainProvider|undefined}
   * @private
   */
  this.terrainProvider_ = undefined;

  /**
   * If the terrain provider encountered an error.
   * @type {boolean}
   * @private
   */
  this.terrainError_ = false;

  /**
   * The original `requestTileGeometry` function for the terrain provider.
   * @type {Cesium.RequestTileGeometryFn|undefined}
   */
  this.origRequestTileGeometry_ = undefined;

  this.setTerrainProvider(provider);
};
goog.inherits(plugin.cesium.TerrainLayer, plugin.cesium.Layer);


/**
 * The logger.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.cesium.TerrainLayer.LOGGER_ = goog.log.getLogger('plugin.cesium.TerrainLayer');


/**
 * @inheritDoc
 */
plugin.cesium.TerrainLayer.prototype.disposeInternal = function() {
  plugin.cesium.TerrainLayer.base(this, 'disposeInternal');

  this.setTerrainProvider(undefined);
};


/**
 * @inheritDoc
 */
plugin.cesium.TerrainLayer.prototype.getErrorMessage = function() {
  var error = plugin.cesium.TerrainLayer.base(this, 'getErrorMessage');
  if (!error) {
    if (this.terrainError_) {
      error = 'Terrain provider encountered an error, so terrain may not be displayed.';
    } else if (!this.terrainProvider_) {
      error = 'Terrain provider has not been configured.';
    }
  }

  return error;
};


/**
 * @inheritDoc
 */
plugin.cesium.TerrainLayer.prototype.getTreeNode = function() {
  var node = new os.data.LayerNode();
  node.setLayer(this);
  node.setCheckboxVisible(false);
  return node;
};


/**
 * Set the Cesium terrain provider managed by the layer.
 *
 * @param {Cesium.TerrainProvider|undefined} provider The terrain provider.
 */
plugin.cesium.TerrainLayer.prototype.setTerrainProvider = function(provider) {
  if (this.terrainProvider_) {
    this.terrainProvider_.errorEvent.removeEventListener(this.onTerrainError_, this);

    // restore the original requestTileGeometry function
    if (this.origRequestTileGeometry_) {
      this.terrainProvider_.requestTileGeometry = this.origRequestTileGeometry_;
      this.origRequestTileGeometry_ = undefined;
    }
  }

  this.terrainProvider_ = provider;

  if (this.terrainProvider_) {
    this.terrainProvider_.errorEvent.addEventListener(this.onTerrainError_, this);

    // wrap requestTileGeometry to update loading state
    this.origRequestTileGeometry_ = this.terrainProvider_.requestTileGeometry;
    this.terrainProvider_.requestTileGeometry = this.requestTileGeometry_.bind(this);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.TerrainLayer.prototype.synchronize = function() {
  plugin.cesium.TerrainLayer.base(this, 'synchronize');

  if (!this.hasError()) {
    var scene = this.getScene();
    if (scene && this.terrainProvider_ && scene.terrainProvider != this.terrainProvider_) {
      scene.terrainProvider = this.terrainProvider_;
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};


/**
 * Wrap the terrain provider's `requestTileGeometry` to display loading status.
 *
 * @param {number} x The tile x value.
 * @param {number} y The tile y value.
 * @param {number} level The tile level.
 * @param {Cesium.Request=} opt_request The Cesium request.
 * @return {Cesium.Promise<Cesium.TerrainData>|undefined}
 * @private
 */
plugin.cesium.TerrainLayer.prototype.requestTileGeometry_ = function(x, y, level, opt_request) {
  if (this.origRequestTileGeometry_ && this.terrainProvider_) {
    var promise = this.origRequestTileGeometry_.call(this.terrainProvider_, x, y, level, opt_request);
    if (promise) {
      this.incrementLoading();
      promise.then(this.onTileSuccess_.bind(this), this.onTileError_.bind(this));
    }

    return promise;
  }

  return undefined;
};


/**
 * Handle error raised from a Cesium terrain provider.
 *
 * @param {Cesium.TileProviderError} error The tile provider error.
 * @private
 */
plugin.cesium.TerrainLayer.prototype.onTerrainError_ = function(error) {
  this.terrainError_ = true;
  goog.log.error(this.log, 'Terrain provider error: ' + error.message);
  this.synchronize();
};


/**
 * Handle successful tile load.
 *
 * @private
 */
plugin.cesium.TerrainLayer.prototype.onTileSuccess_ = function() {
  this.terrainError_ = false;
  this.decrementLoading();
  this.synchronize();
};


/**
 * Handle failed tile load.
 *
 * @private
 */
plugin.cesium.TerrainLayer.prototype.onTileError_ = function() {
  this.terrainError_ = true;
  this.decrementLoading();
  this.synchronize();
};

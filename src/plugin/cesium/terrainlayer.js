goog.module('plugin.cesium.TerrainLayer');

const log = goog.require('goog.log');
const dispatcher = goog.require('os.Dispatcher');
const MapEvent = goog.require('os.MapEvent');
const LayerNode = goog.require('os.data.LayerNode');
const LayerType = goog.require('os.layer.LayerType');
const Icons = goog.require('os.ui.Icons');
const {directiveTag: terrainNodeUi} = goog.require('plugin.basemap.TerrainNodeUI');
const {CESIUM_ONLY_LAYER} = goog.require('plugin.cesium');
const Layer = goog.require('plugin.cesium.Layer');

const ITreeNodeSupplier = goog.requireType('os.structs.ITreeNodeSupplier');


/**
 * The logger.
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.cesium.TerrainLayer');


/**
 * An OpenLayers layer that manages a Cesium terrain provider.
 *
 * @implements {ITreeNodeSupplier}
 */
class TerrainLayer extends Layer {
  /**
   * Constructor.
   * @param {Cesium.TerrainProvider|undefined} provider The terrain provider.
   */
  constructor(provider) {
    super();

    this.setOSType(CESIUM_ONLY_LAYER);
    this.setIcons(Icons.TERRAIN);
    this.setExplicitType(LayerType.TERRAIN);
    this.setNodeUI(`<${terrainNodeUi}></${terrainNodeUi}>`);
    this.log = logger;

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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.setTerrainProvider(undefined);
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    var error = super.getErrorMessage();
    if (!error) {
      if (this.terrainError_) {
        error = 'Terrain provider encountered an error, so terrain may not be displayed.';
      } else if (!this.terrainProvider_) {
        error = 'Terrain provider has not been configured.';
      }
    }

    return error;
  }

  /**
   * @inheritDoc
   */
  getTreeNode() {
    var node = new LayerNode();
    node.setLayer(this);
    node.setCheckboxVisible(false);
    return node;
  }

  /**
   * Set the Cesium terrain provider managed by the layer.
   *
   * @param {Cesium.TerrainProvider|undefined} provider The terrain provider.
   */
  setTerrainProvider(provider) {
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
  }

  /**
   * @inheritDoc
   */
  synchronize() {
    super.synchronize();

    if (!this.hasError()) {
      var scene = this.getScene();
      if (scene && this.terrainProvider_ && scene.terrainProvider != this.terrainProvider_) {
        scene.terrainProvider = this.terrainProvider_;
        dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
      }
    }
  }

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
  requestTileGeometry_(x, y, level, opt_request) {
    if (this.origRequestTileGeometry_ && this.terrainProvider_) {
      var promise = this.origRequestTileGeometry_.call(this.terrainProvider_, x, y, level, opt_request);
      if (promise) {
        this.incrementLoading();
        promise.then(this.onTileSuccess_.bind(this), this.onTileError_.bind(this));
      }

      return promise;
    }

    return undefined;
  }

  /**
   * Handle error raised from a Cesium terrain provider.
   *
   * @param {Cesium.TileProviderError} error The tile provider error.
   * @private
   */
  onTerrainError_(error) {
    this.terrainError_ = true;
    log.error(this.log, 'Terrain provider error: ' + error.message);
    this.synchronize();
  }

  /**
   * Handle successful tile load.
   *
   * @private
   */
  onTileSuccess_() {
    this.terrainError_ = false;
    this.decrementLoading();
    this.synchronize();
  }

  /**
   * Handle failed tile load.
   *
   * @private
   */
  onTileError_() {
    this.terrainError_ = true;
    this.decrementLoading();
    this.synchronize();
  }
}

exports = TerrainLayer;

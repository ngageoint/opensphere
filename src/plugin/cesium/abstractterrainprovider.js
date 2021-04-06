goog.module('plugin.cesium.AbstractTerrainProvider');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');


/**
 * The default minimum zoom level to show elevation
 * @type {number}
 */
const DEFAULT_MIN_LEVEL = 8;


/**
 * The default size for elevation tiles. Much higher than 128 and Cesium will start to have issues.
 * @type {number}
 */
const DEFAULT_TILE_SIZE = 128;


/**
 * Base Cesium terrain provider.
 * @implements {Cesium.TerrainProvider}
 * @abstract
 */
class AbstractTerrainProvider {
  /**
   * Constructor.
   * @param {!osx.map.TerrainProviderOptions} options
   */
  constructor(options) {
    asserts.assert(options != null, 'options not defined');
    asserts.assert(options.url != null, 'url not defined');

    //
    // The following properties are all used by Cesium using the get/set functions defined below. They are already
    // public via those functions, but if you need a setter for an extending class add it to the Object.defineProperties
    // section. Renaming these to remove the undersos (to make them protected) will break the get/set functions unless
    // you change the property name!
    //

    /**
     * @type {Cesium.Credit}
     * @private
     */
    this.credit_ = typeof options.credit === 'string' ? new Cesium.Credit(options.credit) : null;

    /**
     * @type {Cesium.Event}
     * @private
     */
    this.errorEvent_ = new Cesium.Event();

    /**
     * @type {boolean}
     * @private
     */
    this.hasVertexNormals_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.hasWaterMask_ = false;

    /**
     * @type {string}
     * @private
     */
    this.name_ = 'Terrain';

    /**
     * @type {boolean}
     * @private
     */
    this.ready_ = false;

    /**
     * @type {Cesium.GeographicTilingScheme}
     * @private
     */
    this.tilingScheme_ = new Cesium.GeographicTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 1
    });

    //
    // The rest of the properties are use internally (not by Cesium) and are safe to do as you please.
    //

    /**
     * @type {number}
     * @protected
     */
    this.minLevel = options.minLevel || DEFAULT_MIN_LEVEL;

    /**
     * @type {number}
     * @protected
     */
    this.tileSize = options.tileSize || DEFAULT_TILE_SIZE;

    /**
     * @type {number}
     * @protected
     */
    this.levelZeroMaximumGeometricError = Cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
        this.tilingScheme_.ellipsoid,
        this.tileSize,
        this.tilingScheme_.getNumberOfXTilesAtLevel(0));

    /**
     * @type {Cesium.HeightMapStructure}
     * @protected
     */
    this.terrainDataStructure = {
      heightScale: 1.0,
      heightOffset: 0.0,
      elementsPerHeight: 1,
      stride: 1,
      elementMultiplier: 256.0,
      isBigEndian: false
    };

    /**
     * @type {string}
     * @protected
     */
    this.url = options.url;

    /**
     * @type {boolean}
     * @protected
     */
    this.useProxy = options.useProxy || false;
  }

  /**
   * Get the terrain name
   *
   * @return {string}
   * @protected
   */
  getName() {
    return this.name_;
  }

  /**
   * Set the terrain name
   *
   * @param {string} value
   * @protected
   */
  setName(value) {
    this.name_ = value;
  }

  /**
   * Get the terrain child mask
   *
   * @param {number} x
   * @param {number} y
   * @param {number} level
   * @return {number}
   * @protected
   */
  getTerrainChildMask(x, y, level) {
    var mask = 0;
    var childLevel = level + 1;
    mask |= this.getTileDataAvailable(2 * x, 2 * y, childLevel) ? 1 : 0;
    mask |= this.getTileDataAvailable(2 * x + 1, 2 * y, childLevel) ? 2 : 0;
    mask |= this.getTileDataAvailable(2 * x, 2 * y + 1, childLevel) ? 4 : 0;
    mask |= this.getTileDataAvailable(2 * x + 1, 2 * y + 1, childLevel) ? 8 : 0;
    return mask;
  }

  /**
   * @inheritDoc
   */
  getLevelMaximumGeometricError(level) {
    return this.levelZeroMaximumGeometricError / (1 << level);
  }

  /**
   * @inheritDoc
   */
  getTileDataAvailable(x, y, level) {
    return true;
  }

  /**
   * @inheritDoc
   */
  get credit() {
    return this.credit_;
  }

  /**
   * @inheritDoc
   */
  get errorEvent() {
    return this.errorEvent_;
  }

  /**
   * @inheritDoc
   */
  get ready() {
    return this.ready_;
  }

  /**
   * @inheritDoc
   */
  set ready(value) {
    this.ready_ = value;
  }

  /**
   * @inheritDoc
   */
  get tilingScheme() {
    return this.tilingScheme_;
  }

  /**
   * @inheritDoc
   */
  get hasVertexNormals() {
    return this.hasVertexNormals_;
  }

  /**
   * @inheritDoc
   */
  get hasWaterMask() {
    return this.hasWaterMask_;
  }
}

exports = AbstractTerrainProvider;

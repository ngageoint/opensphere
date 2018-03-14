goog.provide('plugin.cesium.AbstractTerrainProvider');

goog.require('goog.asserts');



/**
 * Base Cesium terrain provider.
 * @param {!osx.map.TerrainProviderOptions} options
 * @extends {Cesium.TerrainProvider}
 * @constructor
 */
plugin.cesium.AbstractTerrainProvider = function(options) {
  goog.asserts.assert(goog.isDefAndNotNull(options), 'options not defined');
  goog.asserts.assert(goog.isDefAndNotNull(options.url), 'url not defined');

  //
  // The following properties are all used by Cesium using the get/set functions defined below. They are already
  // public via those functions, but if you need a setter for an extending class add it to the Object.defineProperties
  // section. Renaming these to remove the undersos (to make them protected) will break the get/set functions unless
  // you change the property name!
  //

  var credit = options.credit;
  if (goog.isString(credit)) {
    var creditOptions = /** @type {Cesium.CreditOptions} */ ({});
    creditOptions.text = credit;
    credit = new Cesium.Credit(creditOptions);
  }

  /**
   * @type {Cesium.Credit|undefined}
   * @private
   */
  this.credit_ = credit;

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
  this.maxLevel = options.maxLevel || plugin.cesium.AbstractTerrainProvider.DEFAULT_MAX_LEVEL_;

  /**
   * @type {number}
   * @protected
   */
  this.minLevel = options.minLevel || plugin.cesium.AbstractTerrainProvider.DEFAULT_MIN_LEVEL_;

  /**
   * @type {number}
   * @protected
   */
  this.tileSize = options.tileSize || plugin.cesium.AbstractTerrainProvider.DEFAULT_TILE_SIZE_;

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
};


/**
 * The default maximum zoom level to show elevation
 * @type {number}
 * @private
 * @const
 */
plugin.cesium.AbstractTerrainProvider.DEFAULT_MAX_LEVEL_ = 11;


/**
 * The default minimum zoom level to show elevation
 * @type {number}
 * @private
 * @const
 */
plugin.cesium.AbstractTerrainProvider.DEFAULT_MIN_LEVEL_ = 8;


/**
 * The default size for elevation tiles. Much higher than 128 and Cesium will start to have issues.
 * @type {number}
 * @private
 * @const
 */
plugin.cesium.AbstractTerrainProvider.DEFAULT_TILE_SIZE_ = 128;


// define the properties required by the Cesium.TerrainProvider interface
Object.defineProperties(plugin.cesium.AbstractTerrainProvider.prototype, {
  credit: {
    get:
        /**
         * @return {Cesium.Credit|undefined}
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function() {
          return this.credit_;
        }
  },

  errorEvent: {
    get:
        /**
         * @return {Cesium.Event}
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function() {
          return this.errorEvent_;
        }
  },

  ready: {
    get:
        /**
         * @return {boolean}
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function() {
          return this.ready_;
        },
    set:
        /**
         * @param {boolean} value
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function(value) {
          this.ready_ = value;
        }
  },

  tilingScheme: {
    get:
        /**
         * @return {Cesium.GeographicTilingScheme}
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function() {
          return this.tilingScheme_;
        }
  },

  hasVertexNormals: {
    get:
        /**
         * @return {boolean}
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function() {
          return this.hasVertexNormals_;
        }
  },

  hasWaterMask: {
    get:
        /**
         * @return {boolean}
         * @this plugin.cesium.AbstractTerrainProvider
         */
        function() {
          return this.hasWaterMask_;
        }
  }
});


/**
 * Get the terrain name
 * @return {string}
 * @protected
 */
plugin.cesium.AbstractTerrainProvider.prototype.getName = function() {
  return this.name_;
};


/**
 * Set the terrain name
 * @param {string} value
 * @protected
 */
plugin.cesium.AbstractTerrainProvider.prototype.setName = function(value) {
  this.name_ = value;
};


/**
 * Get the terrain child mask
 * @param {number} x
 * @param {number} y
 * @param {number} level
 * @return {number}
 * @protected
 */
plugin.cesium.AbstractTerrainProvider.prototype.getTerrainChildMask = function(x, y, level) {
  var mask = 0;
  var childLevel = level + 1;
  mask |= this.getTileDataAvailable(2 * x, 2 * y, childLevel) ? 1 : 0;
  mask |= this.getTileDataAvailable(2 * x + 1, 2 * y, childLevel) ? 2 : 0;
  mask |= this.getTileDataAvailable(2 * x, 2 * y + 1, childLevel) ? 4 : 0;
  mask |= this.getTileDataAvailable(2 * x + 1, 2 * y + 1, childLevel) ? 8 : 0;
  return mask;
};


/**
 * @inheritDoc
 */
plugin.cesium.AbstractTerrainProvider.prototype.getLevelMaximumGeometricError = function(level) {
  return this.levelZeroMaximumGeometricError / (1 << level);
};


/**
 * @inheritDoc
 */
plugin.cesium.AbstractTerrainProvider.prototype.getTileDataAvailable = function(x, y, level) {
  return true;
};

goog.provide('plugin.cesium.WMSTerrainProvider');

goog.require('goog.asserts');
goog.require('ol.proj');
goog.require('os.net.ProxyHandler');
goog.require('os.olcs.AbstractTerrainProvider');



/**
 * WMS Cesium terrain provider.
 * @param {!osx.cesium.WMSTerrainProviderOptions} options
 * @extends {os.olcs.AbstractTerrainProvider}
 * @constructor
 */
plugin.cesium.WMSTerrainProvider = function(options) {
  plugin.cesium.WMSTerrainProvider.base(this, 'constructor', /** @type {!osx.map.TerrainProviderOptions} */ (options));

  goog.asserts.assert(goog.isDefAndNotNull(options.layers) && options.layers.length > 0, 'layers not defined');

  /**
   * Configured WMS layers to use for terrain.
   * @type {!Array<!osx.cesium.WMSTerrainLayerOptions>}
   * @private
   */
  this.layers_ = options.layers;
  this.layers_.sort(plugin.cesium.wmsTerrainLayerCompare);

  // for now, name the provider based on the first layer name so it can be of use in the layers window
  // we could change name based on zoom level but it's problematic because tiles are requested for multiple zoom levels
  if (this.layers_.length > 0) {
    this.setName(this.layers_[this.layers_.length - 1].layerName);
  }

  // set min/max level based on the configured layers
  this.maxLevel = this.layers_[0].maxLevel;
  this.minLevel = this.layers_[this.layers_.length - 1].minLevel;

  // mark as ready so Cesium will start requesting terrain
  this.ready = true;
};
goog.inherits(plugin.cesium.WMSTerrainProvider, os.olcs.AbstractTerrainProvider);


/**
 * @inheritDoc
 */
plugin.cesium.WMSTerrainProvider.prototype.getTileDataAvailable = function(x, y, level) {
  return plugin.cesium.WMSTerrainProvider.base(this, 'getTileDataAvailable', x, y, level) && level < this.maxLevel;
};


/**
 * @inheritDoc
 */
plugin.cesium.WMSTerrainProvider.prototype.requestTileGeometry = function(x, y, level, throttleRequests) {
  var layerName = this.getLayerForLevel_(level);
  if (!layerName) {
    // no terrain at this zoom level
    return new Cesium.HeightmapTerrainData({
      buffer: new Uint8Array(this.tileSize * this.tileSize),
      width: this.tileSize,
      height: this.tileSize
    });
  }

  var url = this.getRequestUrl_(x, y, level, layerName);
  if (this.useProxy) {
    url = os.net.ProxyHandler.getProxyUri(url);
  }

  var promise;
  throttleRequests = Cesium.defaultValue(throttleRequests, true);
  if (throttleRequests) {
    promise = Cesium.loadArrayBuffer(url, undefined, new Cesium.Request({
      throttle: true
    }));

    if (!promise) {
      return undefined;
    }
  } else {
    promise = Cesium.loadArrayBuffer(url);
  }

  var childMask = this.getTerrainChildMask(x, y, level);
  return Cesium.when(promise, this.arrayToHeightmap_.bind(this, childMask));
};


/**
 * @param {number} level
 * @return {string|undefined}
 * @private
 */
plugin.cesium.WMSTerrainProvider.prototype.getLayerForLevel_ = function(level) {
  var layerName = undefined;
  if (level < this.maxLevel && level >= this.minLevel) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      var layer = this.layers_[i];
      if (level < layer.maxLevel && level >= layer.minLevel) {
        layerName = layer.layerName;
        break;
      }
    }
  }

  return layerName;
};


/**
 * Get the URL for an elevation tile
 * @param {number} x
 * @param {number} y
 * @param {number} level
 * @param {string} layerName
 * @return {string}
 * @private
 */
plugin.cesium.WMSTerrainProvider.prototype.getRequestUrl_ = function(x, y, level, layerName) {
  var url = this.url + '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&CRS=EPSG%3A4326&STYLES=';

  // add the elevation layer
  url += '&LAYERS=' + layerName;

  // add the format
  url += '&FORMAT=image%2Fbil';

  // add the tile size
  url += '&WIDTH=' + this.tileSize + '&HEIGHT=' + this.tileSize;

  // add the bounding box
  var rect = this.tilingScheme.tileXYToNativeRectangle(x, y, level);
  var xSpacing = (rect.east - rect.west) / this.tileSize;
  var ySpacing = (rect.north - rect.south) / this.tileSize;
  rect.west -= xSpacing * 0.5;
  rect.east += xSpacing * 0.5;
  rect.south -= ySpacing * 0.5;
  rect.north += ySpacing * 0.5;
  url += '&BBOX=' + rect.south + ',' + rect.west + ',' + rect.north + ',' + rect.east;

  return url;
};


/**
 * @param {number} childTileMask
 * @param {ArrayBuffer} buffer
 * @return {Cesium.HeightmapTerrainData}
 * @private
 */
plugin.cesium.WMSTerrainProvider.prototype.arrayToHeightmap_ = function(childTileMask, buffer) {
  var heightBuffer = this.postProcessArray_(buffer);
  if (!goog.isDef(heightBuffer)) {
    throw new Cesium.DeveloperError('unexpected height buffer size');
  }

  var optionsHeightmapTerrainData = {
    buffer: heightBuffer,
    width: this.tileSize,
    height: this.tileSize,
    childTileMask: childTileMask,
    structure: this.terrainDataStructure
  };

  return new Cesium.HeightmapTerrainData(optionsHeightmapTerrainData);
};


/**
 * @param {ArrayBuffer} buffer
 * @return {Int16Array|undefined}
 * @private
 */
plugin.cesium.WMSTerrainProvider.prototype.postProcessArray_ = function(buffer) {
  var result;
  var viewerIn = new DataView(buffer);
  var littleEndianBuffer = new ArrayBuffer(this.tileSize * this.tileSize * 2);
  var littleEndianView = new DataView(littleEndianBuffer);
  if (littleEndianBuffer.byteLength === buffer.byteLength) {
    // switch from big to little endian
    var current = 0;
    var goodCell = 0;
    var sum = 0;
    for (var i = 0; i < littleEndianBuffer.byteLength; i += 2) {
      current = viewerIn.getInt16(i, false);

      // don't allow values outside acceptable ranges (in meters) for the Earth.
      if (current > -500 && current < 9000) {
        littleEndianView.setInt16(i, current, true);
        sum += current;
        goodCell++;
      } else {
        // elevation is outside the acceptable range, so use an average
        var average = goodCell > 0 ? (sum / goodCell) : 0;
        littleEndianView.setInt16(i, average, true);
      }
    }

    result = new Int16Array(littleEndianBuffer);
  }
  return result;
};


/**
 * @param {Object} a
 * @param {Object} b
 * @return {number}
 */
plugin.cesium.wmsTerrainLayerCompare = function(a, b) {
  // sort in order of descending maxLevel
  return goog.array.defaultCompare(b.maxLevel, a.maxLevel);
};

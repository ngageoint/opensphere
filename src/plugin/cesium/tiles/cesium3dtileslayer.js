goog.provide('plugin.cesium.tiles.Layer');

goog.require('os.config.DisplaySetting');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.layer.PropertyChange');
goog.require('plugin.cesium');
goog.require('plugin.cesium.PrimitiveLayer');


/**
 * @extends {plugin.cesium.PrimitiveLayer}
 * @constructor
 */
plugin.cesium.tiles.Layer = function() {
  plugin.cesium.tiles.Layer.base(this, 'constructor');

  /**
   * Cesium Ion asset id.
   * @type {number}
   * @protected
   */
  this.assetId = NaN;

  /**
   * Cesium Ion access token.
   * @type {string}
   * @protected
   */
  this.accessToken = '';

  /**
   * @type {string}
   * @protected
   */
  this.url = '';

  this.setOSType(plugin.cesium.CESIUM_ONLY_LAYER);
  this.setIcons('<i class="fa fa-cubes" title="3D tile layer"></i>');
  this.setExplicitType('3D Tiles');
};
goog.inherits(plugin.cesium.tiles.Layer, plugin.cesium.PrimitiveLayer);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Layer.prototype.removePrimitive = function() {
  var tileset = /** @type {Cesium.Cesium3DTileset} */ (this.getPrimitive());

  if (tileset) {
    tileset.loadProgress.removeEventListener(this.onTileProgress, this);
  }

  plugin.cesium.tiles.Layer.base(this, 'removePrimitive');
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Layer.prototype.checkCesiumEnabled = function() {
  plugin.cesium.tiles.Layer.base(this, 'checkCesiumEnabled');

  if (!this.hasError()) {
    var tilesetUrl = '';
    if (!isNaN(this.assetId)) {
      tilesetUrl = Cesium.IonResource.fromAssetId(this.assetId, {
        accessToken: this.accessToken
      });
    } else {
      tilesetUrl = this.url;
    }

    if (tilesetUrl) {
      var tileset = new Cesium.Cesium3DTileset({
        url: tilesetUrl
      });

      this.setPrimitive(tileset);
      tileset.loadProgress.addEventListener(this.onTileProgress, this);
    }
  }
};


/**
 * @param {number} pendingRequests The number of pending requests
 * @param {number} tilesProcessing The number of tiles currently being processed
 * @protected
 */
plugin.cesium.tiles.Layer.prototype.onTileProgress = function(pendingRequests, tilesProcessing) {
  this.setLoading(pendingRequests > 0);
};

/**
 * @inheritDoc
 */
plugin.cesium.tiles.Layer.prototype.restore = function(config) {
  plugin.cesium.tiles.Layer.base(this, 'restore', config);

  if (typeof config['assetId'] == 'number') {
    this.assetId = /** @type {number} */ (config['assetId']);
  }

  if (config['accessToken']) {
    this.accessToken = /** @type {string} */ (config['accessToken']);
  }

  if (config['url']) {
    this.url = /** @type {string} */ (config['url']);
  }

  this.checkCesiumEnabled();
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Layer.prototype.getExtent = function() {
  var tileset = /** @type {Cesium.Cesium3DTileset} */ (this.primitive);
  if (tileset && tileset.root && tileset.root.contentBoundingVolume) {
    var extent = plugin.cesium.rectangleToExtent(tileset.root.contentBoundingVolume.rectangle);
    if (extent) {
      return ol.proj.transformExtent(extent, os.proj.EPSG4326, os.map.PROJECTION);
    }
  }

  return undefined;
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Layer.prototype.supportsAction = function(type, opt_actionArgs) {
  if (os.action) {
    switch (type) {
      case os.action.EventType.GOTO:
        return this.getExtent() != null;
      default:
        break;
    }
  }
  return plugin.cesium.tiles.Layer.base(this, 'supportsAction', type, opt_actionArgs);
};

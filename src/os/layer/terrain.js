goog.provide('os.layer.Terrain');

goog.require('goog.async.Delay');
goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.layer.Layer');
goog.require('os.color');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ExplicitLayerType');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerType');
goog.require('os.layer.PropertyChange');
goog.require('os.ui');
goog.require('os.ui.Icons');
goog.require('os.ui.renamelayer');



/**
 * @extends {ol.layer.Layer}
 * @implements {os.layer.ILayer}
 * @constructor
 */
os.layer.Terrain = function() {
  os.layer.Terrain.base(this, 'constructor', {});

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this.osType_ = os.layer.LayerType.TERRAIN;

  /**
   * @type {!string}
   * @private
   */
  this.title_ = '';

  /**
   * @type {boolean}
   * @private
   */
  this.loading_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.provider_ = null;

  /**
   * @type {?Array.<!string>}
   * @private
   */
  this.tags_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.removable_ = true;

  /**
   * @type {Object.<string, *>}
   * @private
   */
  this.layerOptions_ = null;

  /**
   * @type {!string}
   * @private
   */
  this.nodeUI_ = '<defaultlayernodeui></defaultlayernodeui>';

  /**
   * @type {!string}
   * @private
   */
  this.layerUi_ = 'terrainlayerui';

  /**
   * @type {boolean}
   * @private
   */
  this.hidden_ = false;

  /**
   * @type {number}
   * @private
   */
  this.numLoadingTiles_ = 0;

  /**
   * @type {?goog.async.Delay}
   * @private
   */
  this.loadingDelay_ = null;

  // set the openlayers type to something that won't find a renderer, because there's
  // no way to render terrain in 2D anyway
  this.type = /** @type {ol.LayerType} */ (os.layer.LayerType.TERRAIN);
};
goog.inherits(os.layer.Terrain, ol.layer.Layer);
os.implements(os.layer.Terrain, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.disposeInternal = function() {
  os.layer.Terrain.base(this, 'disposeInternal');

  if (this.loadingDelay_) {
    this.loadingDelay_.dispose();
    this.loadingDelay_ = null;
  }
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * Get the default color for the terrain layer.
 * @return {?string}
 */
os.layer.Terrain.prototype.getDefaultColor = function() {
  return null;
};


/**
 * Get the color for the terrain layer.
 * @return {?string}
 */
os.layer.Terrain.prototype.getColor = function() {
  return null;
};


/**
 * Set the color for the terrain layer.
 * @param {?string} value The new color
 * @param {Object=} opt_options The layer options to use
 */
os.layer.Terrain.prototype.setColor = function(value, opt_options) {
};


/**
 * @return {?(string|osx.ogc.TileStyle)}
 */
os.layer.Terrain.prototype.getStyle = function() {
  return null;
};


/**
 * @param {?(string|osx.ogc.TileStyle)} value
 */
os.layer.Terrain.prototype.setStyle = function(value) {
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getIcons = function() {
  return os.ui.Icons.TERRAIN;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setLoading = function(value) {
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
 * @return {?goog.async.Delay}
 * @protected
 */
os.layer.Terrain.prototype.getLoadingDelay = function() {
  if (!this.loadingDelay_ && !this.isDisposed()) {
    this.loadingDelay_ = new goog.async.Delay(this.fireLoadingEvent_, 500, this);
  }

  return this.loadingDelay_;
};


/**
 * Fires an event to indicate a loading change.
 * @private
 */
os.layer.Terrain.prototype.fireLoadingEvent_ = function() {
  if (!this.isDisposed()) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', this.loading_, !this.loading_));
  }
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setTitle = function(value) {
  this.title_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.TITLE, value));
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getOSType = function() {
  return this.osType_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setOSType = function(value) {
  this.osType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getExplicitType = function() {
  return os.layer.LayerType.TERRAIN;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setExplicitType = function(value) {
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getProvider = function() {
  return this.provider_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getTags = function() {
  return this.tags_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setTags = function(value) {
  this.tags_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.isRemovable = function() {
  return this.removable_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setRemovable = function(value) {
  this.removable_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getNodeUI = function() {
  return this.nodeUI_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setNodeUI = function(value) {
  this.nodeUI_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getLayerUI = function() {
  return this.layerUi_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setLayerUI = function(value) {
  this.layerUi_ = value;
};


/**
 * @return {!function(!ol.layer.Layer)}
 */
os.layer.Terrain.prototype.getRefreshFunction = function() {
  return goog.nullFunction;
};


/**
 * @param {!function(!ol.layer.Layer)} refreshFunction
 */
os.layer.Terrain.prototype.setRefreshFunction = function(refreshFunction) {
};


/**
 * Forces the layer to refresh.
 * @protected
 */
os.layer.Terrain.prototype.refresh = goog.nullFunction;


/**
 * Identify the layer on the map.
 * @protected
 */
os.layer.Terrain.prototype.identify = goog.nullFunction;


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getLayerVisible = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setBaseVisible = function(value) {};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getBaseVisible = function() {};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getLayerOptions = function() {
  return this.layerOptions_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setLayerOptions = function(value) {
  this.layerOptions_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.callAction = function(type) {
  if (os.action) {
    switch (type) {
      case os.action.EventType.REMOVE_LAYER:
        var removeEvent = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, this.getId());
        os.dispatcher.dispatchEvent(removeEvent);
        break;
      default:
        break;
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getGroupUI = function() {
  return null;
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
os.layer.Terrain.prototype.supportsAction = function(type, opt_actionArgs) {
  if (os.action) {
    switch (type) {
      case os.action.EventType.REMOVE_LAYER:
        return this.isRemovable();
      default:
        break;
    }
  }
  return false;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getSynchronizerType = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setSynchronizerType = function(value) {};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getHidden = function() {
  return this.hidden_;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setHidden = function(value) {
  this.hidden_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.persist = function(opt_to) {
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.restore = function(config) {
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getOpacity = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setOpacity = function(value) {
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.getLayerStatesArray = function() {
  return [];
};


/**
 * @inheritDoc
 */
os.layer.Terrain.prototype.setLayerVisible = function(value) {
  // turn the terrain off but leave the descriptor on
  os.MapContainer.getInstance().showTerrain(value);
};


/**
 * Decrements loading
 */
os.layer.Terrain.prototype.decrementLoading = function() {
  this.numLoadingTiles_--;

  if (this.numLoadingTiles_ === 0) {
    this.setLoading(false);
  }
};


/**
 * Increments loading
 */
os.layer.Terrain.prototype.incrementLoading = function() {
  this.numLoadingTiles_++;

  if (this.numLoadingTiles_ === 1) {
    this.setLoading(true);
  }
};

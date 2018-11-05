goog.provide('plugin.cesium.Layer');


goog.require('goog.async.Delay');
goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.layer.Layer');
goog.require('os.color');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ILayer');
goog.require('os.layer.PropertyChange');
goog.require('os.ui');
goog.require('os.ui.Icons');
goog.require('os.ui.renamelayer');



/**
 * @extends {ol.layer.Layer}
 * @implements {os.layer.ILayer}
 * @constructor
 */
plugin.cesium.Layer = function() {
  plugin.cesium.Layer.base(this, 'constructor', {});

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this.osType_ = null;

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
  this.layerUi_ = '';

  /**
   * @type {boolean}
   * @private
   */
  this.hidden_ = false;

  /**
   * @type {number}
   * @private
   */
  this.loadCount_ = 0;

  /**
   * @type {?goog.async.Delay}
   * @private
   */
  this.loadingDelay_ = null;

  /**
   * @type {!string}
   */
  this.icons_ = '';

  /**
   * @type {!string}
   */
  this.explicitType_ = '';

  // set the openlayers type to something that won't find a renderer, because there's
  // no way to render Cesium-specific items in OpenLayers anyway
  this.type = /** @type {ol.LayerType} */ ('cesium');

  /**
   * @type {boolean}
   * @private
   */
  this.error_ = false;

  os.MapContainer.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.onMapChange, false, this);
  this.checkCesiumEnabled();
};
goog.inherits(plugin.cesium.Layer, ol.layer.Layer);
os.implements(plugin.cesium.Layer, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.disposeInternal = function() {
  plugin.cesium.Layer.base(this, 'disposeInternal');

  os.MapContainer.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapChange, false, this);

  if (this.loadingDelay_) {
    this.loadingDelay_.dispose();
    this.loadingDelay_ = null;
  }
};


/**
 * Handle map change events.
 * @param {os.events.PropertyChangeEvent} event The event.
 * @protected
 */
plugin.cesium.Layer.prototype.onMapChange = function(event) {
  if (event && event.getProperty() === os.MapChange.VIEW3D) {
    this.checkCesiumEnabled();
  }
};


/**
 * @protected
 */
plugin.cesium.Layer.prototype.checkCesiumEnabled = function() {
  if (window.Cesium && os.map.mapContainer.is3DEnabled()) {
    if (this.error_) {
      this.error_ = false;
      this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.ERROR, this.error_, !this.error_));
    }
  } else if (!this.error_) {
    this.error_ = true;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.ERROR, this.error_, !this.error_));
  }
};


/**
 * @return {boolean}
 */
plugin.cesium.Layer.prototype.hasError = function() {
  return this.error_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * Get the default color for the terrain layer.
 * @return {?string}
 */
plugin.cesium.Layer.prototype.getDefaultColor = function() {
  return null;
};


/**
 * Get the color for the terrain layer.
 * @return {?string}
 */
plugin.cesium.Layer.prototype.getColor = function() {
  return null;
};


/**
 * Set the color for the terrain layer.
 * @param {?string} value The new color
 * @param {Object=} opt_options The layer options to use
 */
plugin.cesium.Layer.prototype.setColor = function(value, opt_options) {
};


/**
 * @return {?(string|osx.ogc.TileStyle)}
 */
plugin.cesium.Layer.prototype.getStyle = function() {
  return null;
};


/**
 * @param {?(string|osx.ogc.TileStyle)} value
 */
plugin.cesium.Layer.prototype.setStyle = function(value) {
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getIcons = function() {
  var html = '';
  if (this.hasError()) {
    html += '<i class="fa fa-warning text-warning" title="This layer is only visible in 3D mode"></i>';
  }

  return this.icons_ + html;
};


/**
 * @param {string} value
 */
plugin.cesium.Layer.prototype.setIcons = function(value) {
  this.icons_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setLoading = function(value) {
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
        this.loadCount_ = 0;
      }
    }
  }
};


/**
 * @return {?goog.async.Delay}
 * @protected
 */
plugin.cesium.Layer.prototype.getLoadingDelay = function() {
  if (!this.loadingDelay_ && !this.isDisposed()) {
    this.loadingDelay_ = new goog.async.Delay(this.fireLoadingEvent_, 500, this);
  }

  return this.loadingDelay_;
};


/**
 * Fires an event to indicate a loading change.
 * @private
 */
plugin.cesium.Layer.prototype.fireLoadingEvent_ = function() {
  if (!this.isDisposed()) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', this.loading_, !this.loading_));
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setTitle = function(value) {
  this.title_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.TITLE, value));
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getOSType = function() {
  return this.osType_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setOSType = function(value) {
  this.osType_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getExplicitType = function() {
  return this.explicitType_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setExplicitType = function(value) {
  this.explicitType_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getProvider = function() {
  return this.provider_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getTags = function() {
  return this.tags_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setTags = function(value) {
  this.tags_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.isRemovable = function() {
  return this.removable_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setRemovable = function(value) {
  this.removable_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getNodeUI = function() {
  return this.nodeUI_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setNodeUI = function(value) {
  this.nodeUI_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getLayerUI = function() {
  return this.layerUi_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setLayerUI = function(value) {
  this.layerUi_ = value;
};


/**
 * @return {!function(!ol.layer.Layer)}
 */
plugin.cesium.Layer.prototype.getRefreshFunction = function() {
  return goog.nullFunction;
};


/**
 * @param {!function(!ol.layer.Layer)} refreshFunction
 */
plugin.cesium.Layer.prototype.setRefreshFunction = function(refreshFunction) {
};


/**
 * Forces the layer to refresh.
 * @protected
 */
plugin.cesium.Layer.prototype.refresh = goog.nullFunction;


/**
 * Identify the layer on the map.
 * @protected
 */
plugin.cesium.Layer.prototype.identify = goog.nullFunction;


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getLayerVisible = function() {
  return this.getVisible();
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setLayerVisible = function(value) {
  if (value !== this.getLayerVisible()) {
    this.setVisible(value);
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.VISIBLE, value, !value));
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setBaseVisible = function(value) {
  this.setVisible(value);
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getBaseVisible = function() {
  return this.getVisible();
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getLayerOptions = function() {
  return this.layerOptions_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setLayerOptions = function(value) {
  this.layerOptions_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.callAction = function(type) {
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
plugin.cesium.Layer.prototype.getGroupUI = function() {
  return null;
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
plugin.cesium.Layer.prototype.supportsAction = function(type, opt_actionArgs) {
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
plugin.cesium.Layer.prototype.getSynchronizerType = function() {
  return null;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setSynchronizerType = function(value) {};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getHidden = function() {
  return this.hidden_;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setHidden = function(value) {
  this.hidden_ = value;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};
  opt_to['visible'] = this.getVisible();
  return opt_to;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.restore = function(config) {
  if (config['id'] != null) {
    this.setId(config['id']);
  }

  if (config['provider'] != null) {
    this.setProvider(config['provider']);
  }

  if (config['tags'] != null) {
    this.setTags(config['tags']);
  }

  if (config['title'] != null) {
    this.setTitle(config['title']);
  }

  if (config['layerType'] != null) {
    this.setOSType(config['layerType']);
  }

  if (config['visible'] != undefined) {
    this.setLayerVisible(!!config['visible']);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getOpacity = function() {
  return 1;
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.setOpacity = function(value) {
};


/**
 * @inheritDoc
 */
plugin.cesium.Layer.prototype.getLayerStatesArray = function() {
  return [];
};


/**
 * Decrements loading
 */
plugin.cesium.Layer.prototype.decrementLoading = function() {
  this.loadCount_--;

  if (this.loadCount_ === 0) {
    this.setLoading(false);
  }
};


/**
 * Increments loading
 */
plugin.cesium.Layer.prototype.incrementLoading = function() {
  this.loadCount_++;

  if (this.loadCount_ === 1) {
    this.setLoading(true);
  }
};

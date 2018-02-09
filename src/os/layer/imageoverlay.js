goog.provide('os.layer.Image');

goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.layer.Image');
goog.require('os.MapChange');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ExplicitLayerType');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerType');
goog.require('os.layer.PropertyChange');
goog.require('os.registerClass');
goog.require('os.source');
goog.require('os.style');
goog.require('os.ui.Icons');
goog.require('os.ui.featureInfoDirective');
goog.require('os.ui.layer.defaultLayerUIDirective');
goog.require('os.ui.renamelayer');
goog.require('os.ui.window');



/**
 * @extends {ol.layer.Image}
 * @implements {os.layer.ILayer}
 * @param {olx.layer.ImageOptions} options image layer options
 * @constructor
 */
os.layer.Image = function(options) {
  os.layer.Image.base(this, 'constructor', options);

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this.osType_ = os.layer.LayerType.IMAGE;

  /**
   * @type {string}
   * @private
   */
  this.explicitType_ = os.layer.ExplicitLayerType.IMAGE;

  /**
   * @type {!string}
   * @private
   */
  this.title_ = 'Image Overlay';

  if (options['title']) {
    this.setTitle(this.title_ + ' - ' + options['title']);
  }

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
   * @type {string}
   * @private
   */
  this.layerUi_ = 'defaultlayerui';

  /**
   * @type {boolean}
   * @private
   */
  this.visible_ = true;

  /**
   * @type {boolean}
   * @private
   */
  this.mapVisibilityLocked_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.syncType_ = os.layer.SynchronizerType.IMAGE;

  /**
   * Image overlays are hidden by default.
   * @type {boolean}
   * @private
   */
  this.hidden_ = true;

  this.setZIndex(999);
};
goog.inherits(os.layer.Image, ol.layer.Image);
os.implements(os.layer.Image, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
os.layer.Image.prototype.disposeInternal = function() {
  // call the parent chain first to remove listeners
  os.layer.Image.base(this, 'disposeInternal');
  os.MapContainer.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapChange_, false, this);

  // make sure the map loading counters are updated since the layer is being removed
  this.setLoading(false);

  var source = this.getSource();
  if (source) {
    source.dispose();
  }

  os.style.StyleManager.getInstance().removeLayerConfig(this.getId());
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getLayerOptions = function() {
  return this.layerOptions_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setLayerOptions = function(value) {
  this.layerOptions_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    var old = this.loading_;
    this.loading_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.LOADING, value, old));
  }
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getProvider = function() {
  return this.provider_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.isRemovable = function() {
  return this.removable_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setRemovable = function(value) {
  this.removable_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getTags = function() {
  return this.tags_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setTags = function(value) {
  this.tags_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setTitle = function(value) {
  if (this.title_ !== value) {
    var old = this.title_;
    this.title_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('title', value, old));
  }
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getOSType = function() {
  return this.osType_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setOSType = function(value) {
  this.osType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getExplicitType = function() {
  return this.explicitType_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setExplicitType = function(value) {
  this.explicitType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getLayerVisible = function() {
  return this.visible_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setLayerVisible = function(value) {
  value = !!value;

  this.visible_ = value;
  if (!this.mapVisibilityLocked_) {
    this.setVisible(value);
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent('visible', value, !value));

  var source = this.getSource();
  if (source instanceof os.source.Vector) {
    /** @type {os.source.Vector} */ (source).setVisible(value);
  }
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setBaseVisible = function(value) {
  this.setVisible(value);
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getBaseVisible = function() {
  return this.getVisible();
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getNodeUI = function() {
  return '<defaultlayernodeui></defaultlayernodeui>';
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setNodeUI = function(value) {};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getLayerUI = function() {
  return this.layerUi_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setLayerUI = function(value) {
  this.layerUi_ = value;
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.layer.Image.prototype.onMapChange_ = function(event) {
  var p = event.getProperty();
  if (p == os.MapChange.VIEW3D) {
    var enabled = /** @type {boolean} */ (event.getNewValue());

    var source = this.getSource();
    if (source instanceof os.source.Vector) {
      /** @type {os.source.Vector} */ (source).setCesiumEnabled(enabled);
    }
  }
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Image.prototype.getSVGSet = function() {
  var icons = [os.ui.IconsSVG.FEATURES];
  var source = this.getSource();
  if (source instanceof os.source.Vector && source.getTimeEnabled()) {
    icons.push(os.ui.IconsSVG.TIME);
  }

  return icons;
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Image.prototype.getIconSet = function() {
  var icons = [os.ui.Icons.FEATURES];
  var source = this.getSource();
  if (source instanceof os.source.Vector && source.getTimeEnabled()) {
    icons.push(os.ui.Icons.TIME);
  }

  return icons;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getIcons = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.getId());

  if (config) {
    var color = os.style.getConfigColor(config, true);
    return os.ui.createIconSet(this.getId(), this.getSVGSet(), this.getFASet(), color);
  }

  return this.getIconSet().join('');
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Image.prototype.getFASet = function() {
  return [];
};


/**
 * Identify the layer on the map.
 * @protected
 */
os.layer.Image.prototype.identify = function() {
  os.layer.identifyLayer(this);
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getGroupUI = function() {
  return null; // no grouping
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getSynchronizerType = function() {
  return this.syncType_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setSynchronizerType = function(value) {
  this.syncType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getHidden = function() {
  return this.hidden_;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setHidden = function(value) {
  this.hidden_ = value;
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
os.layer.Image.prototype.supportsAction = function(type, opt_actionArgs) {
  if (os.action) {
    switch (type) {
      case os.action.EventType.IDENTIFY:
      case os.action.EventType.GOTO:
        return true;
      case os.action.EventType.RENAME:
        return !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;
      case os.action.EventType.REMOVE_LAYER:
        return this.isRemovable();
      case os.action.EventType.REFRESH:
        return true;
      default:
        break;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.callAction = function(type) {
  if (os.action) {
    switch (type) {
      case os.action.EventType.IDENTIFY:
        this.identify();
        break;
      case os.action.EventType.REMOVE_LAYER:
        var removeEvent = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, this.getId());
        os.dispatcher.dispatchEvent(removeEvent);
        break;
      case os.action.EventType.RENAME:
        os.ui.renamelayer.launchRenameDialog(this);
        break;
      default:
        break;
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};

  opt_to['visible'] = this.getLayerVisible();
  opt_to['opacity'] = this.getOpacity();
  opt_to['minResolution'] = this.getMinResolution();
  opt_to['maxResolution'] = this.getMaxResolution();

  // style
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.getId());

  if (config) {
    opt_to[os.style.StyleField.COLOR] = os.style.getConfigColor(config);
    opt_to[os.style.StyleField.SIZE] = os.style.getConfigSize(config);
  }

  return opt_to;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.restore = function(config) {
  if (goog.isDef(config['id'])) {
    this.setId(config['id']);
  }

  if (goog.isDef(config['provider'])) {
    this.setProvider(config['provider']);
  }

  if (goog.isDef(config['tags'])) {
    this.setTags(config['tags']);
  }

  if (goog.isDef(config['title'])) {
    this.setTitle(config['title']);
  }

  if (goog.isDef(config['layerType'])) {
    this.setOSType(config['layerType']);
  }

  if (goog.isDef(config['explicitType'])) {
    this.setExplicitType(config['explicitType']);
  }

  if (goog.isDef(config['visible'])) {
    this.setLayerVisible(config['visible']);
  }

  var opacity = config['opacity'];

  if (goog.isDef(opacity)) {
    this.setOpacity(opacity);
  }

  this.setMinResolution(config['minResolution'] || this.getMinResolution());
  this.setMaxResolution(config['maxResolution'] || this.getMaxResolution());
};

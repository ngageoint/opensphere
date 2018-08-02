goog.provide('os.layer.LayerGroup');
goog.require('goog.events.EventTarget');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.ui.node.defaultLayerNodeUIDirective');



/**
 * Logical grouping of layers
 * @extends {goog.events.EventTarget}
 * @implements {os.layer.ILayer}
 * @constructor
 */
os.layer.LayerGroup = function() {
  os.layer.LayerGroup.base(this, 'constructor');

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {!Array.<!os.layer.ILayer>}
   * @private
   */
  this.layers_ = [];

  /**
   * @type {Object.<string, *>}
   * @private
   */
  this.layerOptions_ = null;

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
   * @type {string}
   * @private
   */
  this.nodeUi_ = '<defaultlayernodeui></defaultlayernodeui>';

  /**
   * @type {string}
   * @private
   */
  this.layerUi_ = 'defaultlayerui';

  /**
   * @type {boolean}
   * @private
   */
  this.hidden_ = false;
};
goog.inherits(os.layer.LayerGroup, goog.events.EventTarget);
os.implements(os.layer.LayerGroup, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.disposeInternal = function() {
  this.layers_.length = 0;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getSource = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.isLoading = function() {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      if (this.layers_[i].isLoading()) {
        return true;
      }
    } catch (e) {
    }
  }

  return this.loading_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setLoading = function(value) {
  // manually set the loading flag.  this is used when children aren't
  // present yet because there is intermediate loading to be done before
  // we can figure out what the children should actually be.
  this.loading_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setTitle = function(value) {
  this.title_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getIcons = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getOSType = function() {
  if (this.layers_.length > 0) {
    return this.layers_[0].getOSType();
  }
  return 'group';
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setOSType = function(value) {};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getExplicitType = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setExplicitType = function(value) {};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getProvider = function() {
  if (this.layers_.length > 0) {
    return this.layers_[0].getProvider();
  }
  return this.provider_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getBrightness = function() {
  var maxBrightness = 0;
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      maxBrightness = Math.max(maxBrightness, this.layers_[i].getBrightness());
    } catch (e) {
    }
  }

  return goog.math.clamp(maxBrightness, 0, 1);
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setBrightness = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setBrightness(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getContrast = function() {
  var maxContrast = 0;
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      maxContrast = Math.max(maxContrast, this.layers_[i].getContrast());
    } catch (e) {
    }
  }

  return goog.math.clamp(maxContrast, 0, 1);
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setContrast = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setContrast(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getHue = function() {
  var maxHue = -180;
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      maxHue = Math.max(maxHue, this.layers_[i].getHue());
    } catch (e) {
    }
  }

  return goog.math.clamp(maxHue, -180, 180);
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setHue = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setHue(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getOpacity = function() {
  var maxOpacity = 0;
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      maxOpacity = Math.max(maxOpacity, this.layers_[i].getOpacity());
    } catch (e) {
    }
  }

  return goog.math.clamp(maxOpacity, 0, 1);
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setOpacity = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setOpacity(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getSaturation = function() {
  var maxSaturation = 0;
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      maxSaturation = Math.max(maxSaturation, this.layers_[i].getSaturation());
    } catch (e) {
    }
  }

  return goog.math.clamp(maxSaturation, 0, 1);
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setSaturation = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setSaturation(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getLayerVisible = function() {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      if (this.layers_[i].getLayerVisible()) {
        return true;
      }
    } catch (e) {
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setLayerVisible = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setLayerVisible(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setBaseVisible = function(value) {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      this.layers_[i].setBaseVisible(value);
    } catch (e) {
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getBaseVisible = function() {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      if (this.layers_[i].getBaseVisible()) {
        return true;
      }
    } catch (e) {
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getTags = function() {
  return this.tags_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setTags = function(value) {
  this.tags_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getLayerOptions = function() {
  return this.layerOptions_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setLayerOptions = function(value) {
  this.layerOptions_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.isRemovable = function() {
  for (var i = 0, n = this.layers_.length; i < n; i++) {
    try {
      if (!this.layers_[i].isRemovable()) {
        return false;
      }
    } catch (e) {
    }
  }

  return this.removable_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setRemovable = function(value) {
  this.removable_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getNodeUI = function() {
  var set = {};
  var max = 0;
  var maxGroup = null;

  for (var i = 0, n = this.layers_.length; i < n; i++) {
    var group = this.layers_[i].getGroupUI();

    if (group) {
      if (group in set) {
        set[group]++;
      } else {
        set[group] = 1;
      }

      if (set[group] > max) {
        max = set[group];
        maxGroup = group;
      }
    }
  }

  if (maxGroup) {
    return '<' + maxGroup + '></' + maxGroup + '>';
  }

  return this.nodeUi_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setNodeUI = goog.nullFunction();


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getLayerUI = function() {
  return this.layerUi_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setLayerUI = function(value) {
  this.layerUi_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getGroupUI = function() {
  return null;
};


/**
 * Adds a layer to the group.
 * @param {!os.layer.ILayer} layer
 */
os.layer.LayerGroup.prototype.addLayer = function(layer) {
  this.layers_.push(layer);
};


/**
 * Get the layers in the group.
 * @return {!Array.<!os.layer.ILayer>}
 */
os.layer.LayerGroup.prototype.getLayers = function() {
  return this.layers_;
};


/**
 * Removes a layer from the group.
 * @param {!os.layer.ILayer} layer
 */
os.layer.LayerGroup.prototype.removeLayer = function(layer) {
  goog.array.remove(this.layers_, layer);
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.callAction = function(type) {
  // unsupported
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
os.layer.LayerGroup.prototype.supportsAction = function(type, opt_actionArgs) {
  return false;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getSynchronizerType = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setSynchronizerType = function(value) {};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.getHidden = function() {
  return this.hidden_;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.setHidden = function(value) {
  this.hidden_ = value;
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.persist = function(opt_to) {
  // intentionally empty
  return opt_to || {};
};


/**
 * @inheritDoc
 */
os.layer.LayerGroup.prototype.restore = function(config) {
  // intentionally empty
};

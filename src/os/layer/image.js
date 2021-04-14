goog.provide('os.layer.Image');

goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.layer.Image');
goog.require('os.IGroupable');
goog.require('os.MapChange');
goog.require('os.color');
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
goog.require('os.source.ImageStatic');
goog.require('os.style');
goog.require('os.ui');
goog.require('os.ui.Icons');
goog.require('os.ui.IconsSVG');
goog.require('os.ui.icons');
goog.require('os.ui.layer.ImageLayerUI');
goog.require('os.ui.renamelayer');
goog.require('os.ui.window');

goog.requireType('ol.source.Image');



/**
 * @extends {ol.layer.Image}
 * @implements {os.layer.ILayer}
 * @implements {os.IGroupable}
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
  this.layerUi_ = os.ui.layer.ImageLayerUI.directiveTag;

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
  this.syncType_ = null;

  /**
   * Image overlays are hidden by default.
   * @type {boolean}
   * @private
   */
  this.hidden_ = true;

  /**
   * @type {function(Uint8ClampedArray, number, number)}
   * @private
   */
  this.colorFilter_ = this.applyColors.bind(this);

  /**
   * @type {?string}
   * @private
   */
  this.groupId_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.groupLabel_ = null;

  var source = this.getSource();
  if (source) {
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
  }

  this.setZIndex(999);
};
goog.inherits(os.layer.Image, ol.layer.Image);
os.implements(os.layer.Image, os.layer.ILayer.ID);
os.implements(os.layer.Image, os.IGroupable.ID);


/**
 * @inheritDoc
 */
os.layer.Image.prototype.disposeInternal = function() {
  // call the parent chain first to remove listeners
  os.layer.Image.base(this, 'disposeInternal');

  // make sure the map loading counters are updated since the layer is being removed
  this.setLoading(false);

  var source = this.getSource();
  if (source) {
    source.dispose();
  }
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

  // reapply the color filter as changing the layerOptions can change the layer color/colorize
  this.updateColorFilter();
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.isEnabled = function() {
  // Layer does not have separate enabled/visible states, so this is a pass-through.
  return this.getLayerVisible();
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.setEnabled = function(value) {
  // Layer does not have separate enabled/visible states, so this is a pass-through.
  this.setLayerVisible(value);
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
os.layer.Image.prototype.getGroupId = function() {
  return this.groupId_ != null ? this.groupId_ : this.getId();
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getGroupLabel = function() {
  return this.groupLabel_ != null ? this.groupLabel_ : this.getTitle();
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

  if (this.visible_ != value) {
    this.visible_ = value;
    if (!this.mapVisibilityLocked_) {
      this.setVisible(value);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('visible', value, !value));
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
 * @return {Array<string>}
 * @protected
 */
os.layer.Image.prototype.getSVGSet = function() {
  return [os.ui.IconsSVG.FEATURES];
};


/**
 * Get the brightness for the image layer.
 *
 * @return {number}
 * @override
 */
os.layer.Image.prototype.getBrightness = function() {
  if (this.layerOptions_) {
    return /** @type {number} */ (this.layerOptions_['brightness'] || 0);
  }
  return 0;
};


/**
 * Get the contrast for the image layer.
 *
 * @override
 * @return {number}
 */
os.layer.Image.prototype.getContrast = function() {
  if (this.layerOptions_ && this.layerOptions_['contrast'] != null) {
    return /** @type {number} */ (this.layerOptions_['contrast']);
  }
  return 1;
};


/**
 * Get the saturation for the image layer.
 *
 * @override
 * @return {number}
 */
os.layer.Image.prototype.getSaturation = function() {
  if (this.layerOptions_ && this.layerOptions_['saturation'] != null) {
    return /** @type {number} */ (this.layerOptions_['saturation']);
  }
  return 1;
};


/**
 * Get the sharpness for the image layer.
 *
 * @override
 * @return {number}
 */
os.layer.Image.prototype.getSharpness = function() {
  if (this.layerOptions_ && this.layerOptions_['sharpness'] != null) {
    return /** @type {number} */ (this.layerOptions_['sharpness']);
  }
  return 0;
};


/**
 * Adjust the layer brightness.  A value of -1 will render the layer completely
 * black.  A value of 0 will leave the brightness unchanged.  A value of 1 will
 * render the layer completely white.  Other values are linear multipliers on
 * the effect (values are clamped between -1 and 1).
 *
 * @override
 * @param {number} value The brightness of the layer (values clamped between -1 and 1)
 * @param {Object=} opt_options The layer options to use
 */
os.layer.Image.prototype.setBrightness = function(value, opt_options) {
  goog.asserts.assert(value >= -1 && value <= 1, 'brightness is not between -1 and 1');
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['brightness'] = value;
    this.updateColorFilter();
    os.style.notifyStyleChange(this);
  }
  os.layer.Image.base(this, 'setBrightness', value);
};


/**
 * Adjust the layer contrast.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the contrast unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @override
 * @param {number} value The contrast of the layer (values clamped between 0 and 2)
 * @param {Object=} opt_options The layer options to use
 */
os.layer.Image.prototype.setContrast = function(value, opt_options) {
  goog.asserts.assert(value >= 0 && value <= 2, 'contrast is not between 0 and 2');
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['contrast'] = value;
    this.updateColorFilter();
    os.style.notifyStyleChange(this);
  }
  os.layer.Image.base(this, 'setContrast', value);
};


/**
 * Adjust layer saturation.  A value of 0 will render the layer completely
 * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
 * values are linear multipliers of the effect (and values over 1 are
 * permitted).
 *
 * @override
 * @param {number} value The saturation of the layer (values clamped between 0 and 1)
 * @param {Object=} opt_options The layer options to use
 */
os.layer.Image.prototype.setSaturation = function(value, opt_options) {
  goog.asserts.assert(value >= 0, 'saturation is greater than 0');
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['saturation'] = value;
    this.updateColorFilter();
    os.style.notifyStyleChange(this);
  }
  os.layer.Image.base(this, 'setSaturation', value);
};


/**
 * Adjust layer sharpness. A value of 0 will not adjust layer sharpness. A value of 1 will apply the maximum
 * sharpness adjustment to the image.
 *
 * @override
 * @param {number} value The sharpness of the layer (values clamped between 0 and 1)
 * @param {Object=} opt_options The layer options to use
 */
os.layer.Image.prototype.setSharpness = function(value, opt_options) {
  goog.asserts.assert(value >= 0 && value <= 1, 'sharpness is between 0 and 1');
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['sharpness'] = value;
    this.updateColorFilter();
    os.style.notifyStyleChange(this);
  }
  os.layer.Image.base(this, 'setSharpness', value);
};


/**
 * Updates the color filter, either adding or removing depending on whether the layer is colored to a non-default
 * color or colorized.
 *
 * @protected
 */
os.layer.Image.prototype.updateColorFilter = function() {
  var source = this.getSource();
  if (source instanceof ol.source.Image) {
    if (this.getBrightness() != 0 || this.getContrast() != 1 || this.getSaturation() != 1 || this.getSharpness() != 0) {
      // put the colorFilter in place if we are colorized or the current color is different from the default
      source.addImageFilter(this.colorFilter_);
    } else {
      source.removeImageFilter(this.colorFilter_);
    }
  }
};


/**
 * Filter function that applies the layer color image data. This filter is always in the filter array, but it
 * only runs if the current color is different from the default or if the colorize option is active.
 *
 * @param {Uint8ClampedArray} data The image data.
 * @param {number} width The image width.
 * @param {number} height The image height.
 */
os.layer.Image.prototype.applyColors = function(data, width, height) {
  if (!data) {
    return;
  }

  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var saturation = this.getSaturation();
  var sharpness = this.getSharpness();
  if (brightness != 0 || contrast != 1 || saturation != 1 || sharpness != 0) {
    os.color.adjustColor(data, brightness, contrast, saturation);

    if (sharpness > 0) {
      // sharpness is in the range [0, 1]. use a multiplier to enhance the convolution effect.
      os.color.adjustSharpness(data, width, height, sharpness * 2);
    }
  }
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Image.prototype.getIconSet = function() {
  return [os.ui.Icons.FEATURES];
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.getIcons = function() {
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
 *
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
  if (this.syncType_) {
    return this.syncType_;
  }

  return this.getSource() instanceof ol.source.ImageStatic ?
    os.layer.SynchronizerType.IMAGE_STATIC :
    os.layer.SynchronizerType.IMAGE;
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
 * Handler for source change events.
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.layer.Image.prototype.onSourcePropertyChange_ = function(event) {
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p == os.source.PropertyChange.LOADING) {
      this.setLoading(/** @type {boolean} */ (event.getNewValue()));
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
  opt_to['contrast'] = this.getContrast();
  opt_to['brightness'] = this.getBrightness();
  opt_to['saturation'] = this.getSaturation();
  opt_to['sharpness'] = this.getSharpness();
  opt_to['minResolution'] = this.getMinResolution();
  opt_to['maxResolution'] = this.getMaxResolution();
  opt_to['groupId'] = this.getGroupId();
  opt_to['groupLabel'] = this.getGroupLabel();

  return opt_to;
};


/**
 * @inheritDoc
 */
os.layer.Image.prototype.restore = function(config) {
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

  if (config['explicitType'] != null) {
    this.setExplicitType(config['explicitType']);
  }

  if (config['visible'] != null) {
    this.setLayerVisible(config['visible']);
  }

  var opacity = config['alpha'] || config['opacity'];
  if (opacity != null) {
    this.setOpacity(opacity);
  }

  if (config['contrast'] != null) {
    this.setContrast(config['contrast']);
  }

  if (config['brightness'] != null) {
    this.setBrightness(config['brightness']);
  }

  if (config['saturation'] != null) {
    this.setSaturation(config['saturation']);
  }

  if (config['sharpness'] != null) {
    this.setSharpness(config['sharpness']);
  }

  if (config['groupId'] != null) {
    this.groupId_ = /** @type {string} */ (config['groupId']);
  }

  if (config['groupLabel'] != null) {
    this.groupLabel_ = /** @type {string} */ (config['groupLabel']);
  }

  this.setMinResolution(config['minResolution'] || this.getMinResolution());
  this.setMaxResolution(config['maxResolution'] || this.getMaxResolution());
};

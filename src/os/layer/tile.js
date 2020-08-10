goog.provide('os.layer.Tile');

goog.require('goog.string');
goog.require('ol.array');
goog.require('ol.events');
goog.require('ol.layer.Property');
goog.require('ol.layer.Tile');
goog.require('os.IGroupable');
goog.require('os.color');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ExplicitLayerType');
goog.require('os.layer.IColorableLayer');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerType');
goog.require('os.layer.PropertyChange');
goog.require('os.legend.ILegendRenderer');
goog.require('os.math');
goog.require('os.mixin.TileImage');
goog.require('os.mixin.UrlTileSource');
goog.require('os.ogc');
goog.require('os.source.IStyle');
goog.require('os.style');
goog.require('os.tile');
goog.require('os.ui');
goog.require('os.ui.Icons');
goog.require('os.ui.layer.tileLayerUIDirective');
goog.require('os.ui.renamelayer');



/**
 * @extends {ol.layer.Tile}
 * @implements {os.layer.ILayer}
 * @implements {os.layer.IColorableLayer}
 * @implements {os.IGroupable}
 * @implements {os.legend.ILegendRenderer}
 * @param {olx.layer.TileOptions} options Tile layer options
 * @constructor
 */
os.layer.Tile = function(options) {
  os.layer.Tile.base(this, 'constructor', options);

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this.osType_ = os.layer.LayerType.TILES;

  /**
   * @type {string}
   * @private
   */
  this.explicitType_ = os.layer.ExplicitLayerType.TILES;

  /**
   * @type {!string}
   * @private
   */
  this.title_ = 'New Layer';

  /**
   * @type {boolean}
   * @private
   */
  this.error_ = false;

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
   * @type {?Array<!string>}
   * @private
   */
  this.tags_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.removable_ = true;

  /**
   * @type {Object<string, *>}
   * @private
   */
  this.layerOptions_ = null;

  /**
   * The current layer style.
   * @type {?osx.ogc.TileStyle}
   * @private
   */
  this.style_ = null;

  /**
   * @type {?Array<!osx.ogc.TileStyle>}
   * @private
   */
  this.styles_ = null;

  /**
   * @type {!string}
   * @private
   */
  this.nodeUI_ = '<defaultlayernodeui></defaultlayernodeui>';

  /**
   * @type {!string}
   * @private
   */
  this.layerUi_ = 'tilelayerui';

  /**
   * @type {?string}
   * @private
   */
  this.syncType_ = os.layer.SynchronizerType.TILE;

  /**
   * @type {boolean}
   * @private
   */
  this.hidden_ = false;

  /**
   * @type {os.tile.TileFilterFn}
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
};
goog.inherits(os.layer.Tile, ol.layer.Tile);
os.implements(os.layer.Tile, os.layer.ILayer.ID);
os.implements(os.layer.Tile, os.layer.IColorableLayer.ID);
os.implements(os.layer.Tile, os.IGroupable.ID);
os.implements(os.layer.Tile, os.legend.ILegendRenderer.ID);


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.disposeInternal = function() {
  os.layer.Tile.base(this, 'disposeInternal');

  var source = this.getSource();
  if (source) {
    source.dispose();
  }
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setMinResolution = function(value) {
  var source = this.getSource();
  if (source) {
    // If you don't suppress the event for this set, you'll get an infinite, asynchronous
    // loop with the layer UI. Debugging that was fun. Like "shaving your head with a cheese
    // grater" fun.
    source.suppressEvents();
    source.set(ol.layer.Property.MIN_RESOLUTION, value);
    source.enableEvents();
  }

  os.layer.Tile.base(this, 'setMinResolution', value);
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setMaxResolution = function(value) {
  // OL3 treats max resolution as an exclusive value and we want it to be inclusive. determine value to add based on
  // the decimal precision, since it may vary by OS/browser.
  if (isFinite(value)) {
    var precision = os.math.precision(value);
    value = value + Math.pow(10, -precision);
  }

  var source = this.getSource();
  if (source) {
    // If you don't suppress the event for this set, you'll get an infinite, asynchronous
    // loop with the layer UI. Debugging that was fun. Like "shaving your head with a cheese
    // grater" fun.
    source.suppressEvents();
    source.set(ol.layer.Property.MAX_RESOLUTION, value);
    source.enableEvents();
  }

  os.layer.Tile.base(this, 'setMaxResolution', value);
};


/**
 * Update icons to use the current layer color.
 *
 * @private
 */
os.layer.Tile.prototype.updateIcons_ = function() {
  var color = this.getColor();
  if (color) {
    os.ui.adjustIconSet(this.getId(), os.color.toHexString(color));
  }
};


/**
 * Handler for source change events.
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.layer.Tile.prototype.onSourcePropertyChange_ = function(event) {
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p == os.source.PropertyChange.LOADING) {
      this.setLoading(/** @type {boolean} */ (event.getNewValue()));
    } else if (p == os.source.PropertyChange.REFRESH_INTERVAL) {
      var e = new os.events.PropertyChangeEvent(os.layer.PropertyChange.REFRESH_INTERVAL, event.getNewValue(),
          event.getOldValue());
      this.dispatchEvent(e);
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getGroupId = function() {
  return this.groupId_ != null ? this.groupId_ : this.getId();
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getGroupLabel = function() {
  return this.groupLabel_ != null ? this.groupLabel_ : this.getTitle();
};


/**
 * Get the default color for the tile layer.
 *
 * @return {?string}
 */
os.layer.Tile.prototype.getDefaultColor = function() {
  if (this.layerOptions_) {
    return /** @type {string} */ (this.layerOptions_['baseColor']);
  }

  return null;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getColor = function() {
  if (this.layerOptions_) {
    return /** @type {string} */ (this.layerOptions_['color'] || this.layerOptions_['baseColor']);
  }

  return null;
};


/**
 * Get the brightness for the tile layer.
 *
 * @return {number}
 * @override
 */
os.layer.Tile.prototype.getBrightness = function() {
  if (this.layerOptions_) {
    return /** @type {number} */ (this.layerOptions_['brightness'] || 0);
  }
  return 0;
};


/**
 * Get the brightness for the tile layer.
 *
 * @override
 * @return {number}
 */
os.layer.Tile.prototype.getContrast = function() {
  if (this.layerOptions_ && this.layerOptions_['contrast'] != null) {
    return /** @type {number} */ (this.layerOptions_['contrast']);
  }
  return 1;
};


/**
 * Get the saturation for the tile layer.
 *
 * @override
 * @return {number}
 */
os.layer.Tile.prototype.getSaturation = function() {
  if (this.layerOptions_ && this.layerOptions_['saturation'] != null) {
    return /** @type {number} */ (this.layerOptions_['saturation']);
  }
  return 1;
};


/**
 * Get the whether the tile layer is being colorized.
 *
 * @return {boolean}
 */
os.layer.Tile.prototype.getColorize = function() {
  if (this.layerOptions_) {
    return /** @type {boolean} */ (this.layerOptions_['colorize']) || false;
  }

  return false;
};


/**
 * Get the whether the tile layer is being colorized.
 *
 * @param {boolean} value
 */
os.layer.Tile.prototype.setColorize = function(value) {
  if (this.layerOptions_) {
    this.layerOptions_['colorize'] = value;
    this.updateColorFilter();

    os.style.notifyStyleChange(this);
  }
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setColor = function(value, opt_options) {
  var options = opt_options || this.layerOptions_;
  if (options) {
    if (value && typeof value == 'string') {
      options['color'] = os.color.toHexString(value);
    } else {
      // color was reset, so use the original
      options['color'] = null;
    }

    this.updateColorFilter();
    this.updateIcons_();

    os.style.notifyStyleChange(this);
  }
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
os.layer.Tile.prototype.setBrightness = function(value, opt_options) {
  goog.asserts.assert(value >= -1 && value <= 1, 'brightness is not between -1 and 1');
  os.layer.Tile.base(this, 'setBrightness', value);
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['brightness'] = value;
    this.updateColorFilter();
    this.updateIcons_();
    os.style.notifyStyleChange(this);
  }
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
os.layer.Tile.prototype.setContrast = function(value, opt_options) {
  goog.asserts.assert(value >= 0 && value <= 2, 'contrast is not between 0 and 2');
  os.layer.Tile.base(this, 'setContrast', value);
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['contrast'] = value;
    this.updateColorFilter();
    this.updateIcons_();
    os.style.notifyStyleChange(this);
  }
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
os.layer.Tile.prototype.setSaturation = function(value, opt_options) {
  goog.asserts.assert(value >= 0, 'saturation is greater than 0');
  os.layer.Tile.base(this, 'setSaturation', value);
  var options = opt_options || this.layerOptions_;
  if (options) {
    options['saturation'] = value;
    this.updateColorFilter();
    this.updateIcons_();
    os.style.notifyStyleChange(this);
  }
};


/**
 * Updates the color filter, either adding or removing depending on whether the layer is colored to a non-default
 * color or colorized.
 *
 * @protected
 */
os.layer.Tile.prototype.updateColorFilter = function() {
  var source = this.getSource();
  if (source instanceof ol.source.TileImage) {
    if (this.getColorize() || !os.color.equals(this.getColor(), this.getDefaultColor()) ||
        this.getBrightness() != 0 || this.getContrast() != 1 || this.getSaturation() != 1) {
      // put the colorFilter in place if we are colorized or the current color is different from the default
      source.addTileFilter(this.colorFilter_);
    } else {
      source.removeTileFilter(this.colorFilter_);
    }
  }
};


/**
 * Filter function that applies the layer color tile image data. This filter is always in the filter array, but it
 * only runs if the current color is different from the default or if the colorize option is active.
 *
 * @param {Array<number>} data
 * @protected
 */
os.layer.Tile.prototype.applyColors = function(data) {
  var srcColor = this.getDefaultColor() || '#fffffe';
  var tgtColor = this.getColor() || '#fffffe';
  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var saturation = this.getSaturation();
  var colorize = this.getColorize();
  if (colorize || !os.color.equals(srcColor, tgtColor) ||
      this.getBrightness() != 0 || this.getContrast() != 1 || this.getSaturation() != 1) {
    if (tgtColor) {
      if (colorize) {
        // colorize will set all of the colors to the target
        os.color.colorize(data, tgtColor);
      } else if (!os.color.equals(srcColor, tgtColor)) {
        // transformColor blends between the src and target color, leaving densitization intact
        os.color.transformColor(data, srcColor, tgtColor);
      }
      os.color.adjustColor(data, brightness, contrast, saturation);
    }
  }
};


/**
 * @return {?Array<!osx.ogc.TileStyle>}
 */
os.layer.Tile.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * @param {?Array<!osx.ogc.TileStyle>} value
 */
os.layer.Tile.prototype.setStyles = function(value) {
  this.styles_ = value;
};


/**
 * Get the default server style.
 *
 * @return {?osx.ogc.TileStyle}
 */
os.layer.Tile.prototype.getDefaultStyle = function() {
  if (this.styles_) {
    for (var i = 0; i < this.styles_.length; i++) {
      if (this.styles_[i].label == os.ogc.DEFAULT_TILE_STYLE.label) {
        return this.styles_[i];
      }
    }
  }

  return null;
};


/**
 * @return {?(string|osx.ogc.TileStyle)}
 */
os.layer.Tile.prototype.getStyle = function() {
  var style = this.style_;
  if (!style) {
    var source = this.getSource();

    if (os.implements(source, os.source.IStyle.ID)) {
      style = /** @type {os.source.IStyle} */ (source).getStyle();
      var styles = this.getStyles();

      if (styles) {
        // find style in styles and return that
        for (var i = 0, n = styles.length; i < n; i++) {
          if (styles[i].data == style) {
            return styles[i];
          }
        }
      }
    }
  }

  return style;
};


/**
 * @param {?(string|osx.ogc.TileStyle)} value
 */
os.layer.Tile.prototype.setStyle = function(value) {
  if (typeof value == 'string') {
    value = this.styles_ ? ol.array.find(this.styles_, os.layer.Tile.findStyleByData.bind(this, value)) : null;
  }

  this.style_ = value;

  var source = this.getSource();
  if (os.implements(source, os.source.IStyle.ID)) {
    /** @type {os.source.IStyle} */ (source).setStyle(value);
    os.style.notifyStyleChange(this);
  }
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getIcons = function() {
  var color;

  var html = '';
  if (this.error_) {
    html += '<i class="fa fa-warning text-warning" title="There were errors accessing the tiles for this layer"></i>';
  }

  var layerColor = this.getColor();
  if (layerColor) {
    color = os.color.toRgbArray(layerColor);
  }

  html += color ? os.ui.createIconSet(this.getId(), this.getSVGIconsInternal(), this.getStateBadge(), color)
    : this.getIconsInternal();
  return html;
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Tile.prototype.getStateBadge = function() {
  if (os.state.isStateFile(this.getId())) {
    return [os.ui.Icons.STATE];
  } else {
    return null;
  }
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Tile.prototype.getSVGIconsInternal = function() {
  return [os.ui.IconsSVG.TILES];
};


/**
 * @return {string}
 * @protected
 */
os.layer.Tile.prototype.getIconsInternal = function() {
  return os.ui.Icons.TILES;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.isEnabled = function() {
  // Layer does not have separate enabled/visible states, so this is a pass-through.
  return this.getLayerVisible();
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setEnabled = function(value) {
  // Layer does not have separate enabled/visible states, so this is a pass-through.
  this.setLayerVisible(value);
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    var old = this.loading_;
    this.loading_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.LOADING, value, old));

    var source = this.getSource();
    if (source instanceof ol.source.UrlTile) {
      var error = source.hasError();

      if (error !== this.error_) {
        this.error_ = error;
        this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.ERROR, this.error_, !this.error_));
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setTitle = function(value) {
  this.title_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.TITLE, value));
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getOSType = function() {
  return this.osType_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setOSType = function(value) {
  this.osType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getExplicitType = function() {
  return this.explicitType_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setExplicitType = function(value) {
  this.explicitType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getProvider = function() {
  return this.provider_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getTags = function() {
  return this.tags_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setTags = function(value) {
  this.tags_ = value;
};


/**
 * @return {boolean} Whether or not the layer is in error
 */
os.layer.Tile.prototype.getError = function() {
  return this.error_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.isRemovable = function() {
  return this.removable_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setRemovable = function(value) {
  this.removable_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getNodeUI = function() {
  return this.nodeUI_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setNodeUI = function(value) {
  this.nodeUI_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getLayerUI = function() {
  return this.layerUi_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setLayerUI = function(value) {
  this.layerUi_ = value;
};


/**
 * Identify the layer on the map.
 *
 * @protected
 */
os.layer.Tile.prototype.identify = function() {
  os.layer.identifyLayer(this);
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getLayerVisible = function() {
  // always use the inherited OpenLayers value
  return ol.layer.Tile.prototype.getVisible.call(this);
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setLayerVisible = function(value) {
  if (value !== this.getLayerVisible()) {
    this.setVisible(value);
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.VISIBLE, value, !value));
  }
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setBaseVisible = function(value) {
  this.setVisible(value);
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getBaseVisible = function() {
  return this.getVisible();
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getLayerOptions = function() {
  return this.layerOptions_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setLayerOptions = function(value) {
  this.layerOptions_ = value;

  // reapply the color filter as changing the layerOptions can change the layer color/colorize
  this.updateColorFilter();
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.callAction = function(type) {
  var source = this.getSource();

  if (os.action) {
    switch (type) {
      case os.action.EventType.IDENTIFY:
        this.identify();
        break;
      case os.action.EventType.MOST_RECENT:
        os.dataManager.setTimeFromDescriptor(this.getId());
        break;
      case os.action.EventType.REFRESH:
        source.refresh();
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
os.layer.Tile.prototype.getGroupUI = function() {
  return null;
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
os.layer.Tile.prototype.supportsAction = function(type, opt_actionArgs) {
  if (os.action) {
    switch (type) {
      case os.action.EventType.GOTO:
        var projExtent = os.map.PROJECTION.getExtent();
        var layerExtent = os.fn.reduceExtentFromLayers(/** @type {!ol.Extent} */ (ol.extent.createEmpty()), this);
        var projArea = ol.extent.getArea(projExtent);
        var layerArea = ol.extent.getArea(layerExtent);
        return !ol.extent.isEmpty(layerExtent) && layerArea / projArea < 0.8;
      case os.action.EventType.IDENTIFY:
      case os.action.EventType.REFRESH:
      case os.action.EventType.SHOW_DESCRIPTION:
        return true;
      case os.action.EventType.RENAME:
        return !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;
      case os.action.EventType.MOST_RECENT:
        // only enable if descriptor exists and max date is greater than 0
        var desc = os.dataManager.getDescriptor(this.getId());
        if (desc != null) {
          var maxDate = desc.getMaxDate();
          return maxDate > 0 && maxDate < os.time.TimeInstant.MAX_TIME;
        }

        break;
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
os.layer.Tile.prototype.getSynchronizerType = function() {
  return this.syncType_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setSynchronizerType = function(value) {
  this.syncType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.getHidden = function() {
  return this.hidden_;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.setHidden = function(value) {
  this.hidden_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.renderLegend = function(options) {
  // use default tile layer legend renderer
  os.legend.drawTileLayer(this, options);
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};

  opt_to['visible'] = this.getLayerVisible();
  opt_to['opacity'] = this.getOpacity();
  opt_to['contrast'] = this.getContrast();
  opt_to['brightness'] = this.getBrightness();
  opt_to['saturation'] = this.getSaturation();
  opt_to['color'] = this.getColor();
  opt_to['colorize'] = this.getColorize();
  opt_to['groupId'] = this.getGroupId();
  opt_to['groupLabel'] = this.getGroupLabel();

  // we now store min and max zoom rather than resolution because the resolutions can change
  // drastically if the user or admin switches the default projection (resulting in the layer
  // being basically invisible)
  var tilegrid = this.getSource().getTileGrid();

  var config = this.getLayerOptions();
  var offset = /** @type {number} */ (config ? config['zoomOffset'] || 0 : 0);

  opt_to['maxZoom'] = Math.min(os.map.MAX_ZOOM, tilegrid.getZForResolution(this.getMinResolution()) - offset);
  opt_to['minZoom'] = Math.max(os.map.MIN_ZOOM, tilegrid.getZForResolution(this.getMaxResolution()) - offset);

  var style = this.getStyle();
  if (style) {
    opt_to['style'] = typeof style === 'string' ? style : style.data;
  }

  var source = this.getSource();
  if (source && source instanceof ol.source.UrlTile) {
    opt_to['refreshInterval'] = source.getRefreshInterval();
  }

  return opt_to;
};


/**
 * @inheritDoc
 */
os.layer.Tile.prototype.restore = function(config) {
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

  if (config['color']) {
    var color = /** @type {string} */ (config['color']);
    this.setColor(color, config);
  }

  if (config['colorize']) {
    var colorize = /** @type {boolean} */ (config['colorize']);
    this.setColorize(colorize);
  }

  if (config['refreshInterval'] !== undefined) {
    var source = this.getSource();
    if (source && source instanceof ol.source.UrlTile) {
      source.setRefreshInterval(/** @type {number} */ (config['refreshInterval']));
    }
  }

  if (config['groupId'] != null) {
    this.groupId_ = /** @type {string} */ (config['groupId']);
  }

  if (config['groupLabel'] != null) {
    this.groupLabel_ = /** @type {string} */ (config['groupLabel']);
  }

  // A layer's min/max resolution depends directly on its own tile grid.
  //
  // Do not use MapContainer.zoomToResolution here. That is for overall map/view
  // purposes and not for individual layers, which may have discrete tile matrices.
  var offset = config['zoomOffset'] || 0;
  var grid = this.getSource().getTileGrid();
  var tgMin = grid.getMinZoom();
  var tgMax = grid.getMaxZoom();

  if (config['minZoom'] != null) {
    var z = Math.min(tgMax, Math.max(tgMin, Math.round(config['minZoom']) + offset));
    this.setMaxResolution(grid.getResolution(z));
  }

  if (config['maxZoom'] != null) {
    z = Math.min(tgMax, Math.max(tgMin, Math.round(config['maxZoom']) + offset));
    this.setMinResolution(grid.getResolution(z));
  }

  var style = config['style'] || '';
  var currStyle = this.getStyle();

  if (!currStyle || (typeof currStyle === 'string' && style != currStyle) || style != currStyle.data) {
    this.setStyle(style);
  }
};


/**
 * @param {string} data The style data
 * @param {!osx.ogc.TileStyle} style The style
 * @return {boolean}
 */
os.layer.Tile.findStyleByData = function(data, style) {
  return style.data == data;
};

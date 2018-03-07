goog.provide('os.layer.Vector');

goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.layer.Property');
goog.require('ol.layer.Vector');
goog.require('os.MapChange');
goog.require('os.events.LayerConfigEvent');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.filter.IFilterable');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ExplicitLayerType');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerType');
goog.require('os.layer.PropertyChange');
goog.require('os.legend');
goog.require('os.legend.ILegendRenderer');
goog.require('os.registerClass');
goog.require('os.source');
goog.require('os.source.Request');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.ui.Icons');
goog.require('os.ui.featureInfoDirective');
goog.require('os.ui.layer.vectorLayerUIDirective');
goog.require('os.ui.node.defaultLayerNodeUIDirective');
goog.require('os.ui.renamelayer');
goog.require('os.ui.window');



/**
 * @extends {ol.layer.Vector}
 * @implements {os.layer.ILayer}
 * @implements {os.filter.IFilterable}
 * @implements {os.legend.ILegendRenderer}
 * @param {olx.layer.VectorOptions} options Vector layer options
 * @constructor
 */
os.layer.Vector = function(options) {
  os.layer.Vector.base(this, 'constructor', options);

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this.osType_ = os.layer.LayerType.FEATURES;

  /**
   * @type {string}
   * @private
   */
  this.explicitType_ = os.layer.ExplicitLayerType.FEATURES;

  /**
   * @type {!string}
   * @private
   */
  this.title_ = 'New Layer';

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
   * The tree node UI (glyphs) to show in the layers window.
   * @type {string}
   * @private
   */
  this.nodeUi_ = '<defaultlayernodeui></defaultlayernodeui>';

  /**
   * The controls UI to show in the Layers window.
   * @type {string}
   * @private
   */
  this.layerUi_ = 'vectorlayerui';

  /**
   * @type {boolean}
   * @private
   */
  this.visible_ = true;

  /**
   * @type {boolean}
   * @private
   */
  this.animationEnabled_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.mapVisibilityLocked_ = false;

  /**
   * @type {Function}
   * @private
   */
  this.doubleClickHandler_ = os.layer.Vector.defaultDoubleClickHandler_.bind(this);

  /**
   * Function to launch the filter manager for this layer
   * @type {?os.filter.FilterLauncherFn}
   * @private
   */
  this.filterLauncher_ = null;

  /**
   * Function to return the columns used in the filter
   * @type {?os.filter.FilterColumnsFn}
   * @private
   */
  this.filterColumns_ = null;

  /**
   * @type {string|undefined} An alternative feature directive name. Used to override the default behavior.
   * @private
   */
  this.featureDirective_;

  /**
   * @type {boolean}
   * @private
   */
  this.sticky_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.syncType_ = os.layer.SynchronizerType.VECTOR;

  /**
   * @type {boolean}
   * @private
   */
  this.hidden_ = false;

  // we don't care about the render order, so disable it to save some processing time
  this.setRenderOrder(null);
  os.MapContainer.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.onMapChange_, false, this);
};
goog.inherits(os.layer.Vector, ol.layer.Vector);
os.implements(os.layer.Vector, os.layer.ILayer.ID);
os.implements(os.layer.Vector, os.filter.IFilterable.ID);
os.implements(os.layer.Vector, os.legend.ILegendRenderer.ID);


/**
 * Class name
 * @type {string}
 * @const
 */
os.layer.Vector.NAME = 'os.layer.Vector';
os.registerClass(os.layer.Vector.NAME, os.layer.Vector);


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.disposeInternal = function() {
  // call the parent chain first to remove listeners
  os.layer.Vector.base(this, 'disposeInternal');
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
os.layer.Vector.prototype.setSource = function(source) {
  var old = this.getSource();
  if (old && old instanceof os.source.Vector) {
    ol.events.unlisten(old, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange, this);
    old.setCesiumEnabled(false);
  }

  os.layer.Vector.base(this, 'setSource', source);

  if (source && source instanceof os.source.Vector) {
    source = /** @type {os.source.Vector} */ (source);
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange, this);
    source.setCesiumEnabled(os.MapContainer.getInstance().is3DEnabled());
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.layer.Vector.prototype.onMapChange_ = function(event) {
  var p = event.getProperty();
  if (p == os.MapChange.VIEW3D) {
    var enabled = /** @type {boolean} */ (event.getNewValue());
    this.updateMapVisibility_();

    var source = this.getSource();
    if (source instanceof os.source.Vector) {
      /** @type {os.source.Vector} */ (source).setCesiumEnabled(enabled);
    }
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.layer.Vector.prototype.onSourceChange = function(event) {
  var p = event.getProperty();
  var e;

  switch (p) {
    case os.source.PropertyChange.FEATURE_VISIBILITY:
      var source = /** @type {os.source.ISource} */ (this.getSource());
      var features = /** @type {Array.<ol.Feature>} */ (event.getNewValue());
      if (features) {
        for (var i = 0, n = features.length; i < n; i++) {
          var feature = features[i];
          os.MapContainer.getInstance().updateFeatureVisibility(feature, !source.isHidden(feature));
        }
      }
      break;
    case os.source.PropertyChange.LOADING:
      this.setLoading(/** @type {boolean} */ (event.getNewValue()));
      break;
    case os.source.PropertyChange.VISIBLE:
      this.setLayerVisible(/** @type {boolean} */ (event.getNewValue()));
      break;
    case os.source.PropertyChange.ANIMATION_ENABLED:
      this.animationEnabled_ = /** @type {boolean} */ (event.getNewValue());
      this.updateMapVisibility_();
      break;
    case os.source.PropertyChange.TIME_ENABLED:
      // forward as a layer event
      e = new os.events.PropertyChangeEvent(os.layer.PropertyChange.TIME_ENABLED, event.getNewValue(),
          event.getOldValue());
      this.dispatchEvent(e);
      break;
    case os.source.PropertyChange.STYLE:
      // forward as a layer event
      e = new os.events.PropertyChangeEvent(os.layer.PropertyChange.STYLE, event.getNewValue(),
          event.getOldValue());
      this.dispatchEvent(e);
      break;
    case os.source.PropertyChange.LOCK:
      e = new os.events.PropertyChangeEvent(os.layer.PropertyChange.LOCK, event.getNewValue(),
          event.getOldValue());
      this.dispatchEvent(e);
      break;
    case os.source.PropertyChange.REFRESH_INTERVAL:
      e = new os.events.PropertyChangeEvent(os.layer.PropertyChange.REFRESH_INTERVAL, event.getNewValue(),
          event.getOldValue());
      this.dispatchEvent(e);
      break;
    case os.source.PropertyChange.COLOR_MODEL:
      e = new os.events.PropertyChangeEvent(os.layer.PropertyChange.COLOR_MODEL, event.getNewValue(),
          event.getOldValue());
      this.dispatchEvent(e);
      break;
    case os.source.PropertyChange.COLUMNS:
    case os.source.PropertyChange.COLUMN_ADDED:
      this.dispatchEvent(new os.events.PropertyChangeEvent(p));
      break;
    default:
      break;
  }
};


/**
 * Updates map visibility based on the animation/view (2d/3d) state.
 * @private
 */
os.layer.Vector.prototype.updateMapVisibility_ = function() {
  if (this.animationEnabled_ && !os.MapContainer.getInstance().is3DEnabled()) {
    this.lockMapVisibility(false);
  } else {
    this.unlockMapVisibility();
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getIcons = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.getId());

  if (config) {
    var color = os.style.getConfigColor(config, true);
    return os.ui.createIconSet(this.getId(), this.getSVGSet(), this.getFASet(), color);
  }

  return this.getIconSet().join('');
};


/**
 * Get the FontAwesome icons for the layer.
 * @return {!Array<string>}
 * @protected
 */
os.layer.Vector.prototype.getFASet = function() {
  var icons = [];

  var source = this.getSource();
  if (source instanceof os.source.Vector) {
    if (source.getColorModel()) {
      icons.push(os.ui.Icons.COLOR_MODEL);
    }
  }

  return icons;
};


/**
 * Get the SVG icons for the layer.
 * @return {Array<string>}
 * @protected
 */
os.layer.Vector.prototype.getSVGSet = function() {
  var icons = [os.ui.IconsSVG.FEATURES];
  var source = this.getSource();

  if (source instanceof os.source.Vector) {
    if (source.getTimeEnabled()) {
      icons.push(os.ui.IconsSVG.TIME);
    }

    if (source.isLocked()) {
      icons.push(os.ui.IconsSVG.LOCK);
    }
  }

  return icons;
};


/**
 * @return {Array<string>}
 * @protected
 */
os.layer.Vector.prototype.getIconSet = function() {
  var icons = [os.ui.Icons.FEATURES];
  var source = this.getSource();
  if (source instanceof os.source.Vector) {
    if (source.getTimeEnabled()) {
      icons.push(os.ui.Icons.TIME);
    }

    if (source.isLocked()) {
      icons.push(os.ui.Icons.LOCK);
    }

    if (source.getColorModel()) {
      icons.push(os.ui.Icons.COLOR_MODEL);
    }
  }

  return icons;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getLayerOptions = function() {
  return this.layerOptions_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setLayerOptions = function(value) {
  this.layerOptions_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    var old = this.loading_;
    this.loading_ = value;

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.LOADING, value, old));
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getProvider = function() {
  return this.provider_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.isRemovable = function() {
  return this.removable_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setRemovable = function(value) {
  this.removable_ = value;
};


/**
 * Tells whether the vector should stick
 * @return {boolean}
 */
os.layer.Vector.prototype.isSticky = function() {
  return this.sticky_;
};


/**
 * Set whether the vector should stick
 * @param {boolean} value
 */
os.layer.Vector.prototype.setSticky = function(value) {
  this.sticky_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getTags = function() {
  return this.tags_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setTags = function(value) {
  this.tags_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setTitle = function(value) {
  if (this.title_ !== value) {
    var old = this.title_;
    this.title_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('title', value, old));
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getOSType = function() {
  return this.osType_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setOSType = function(value) {
  this.osType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getExplicitType = function() {
  return this.explicitType_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setExplicitType = function(value) {
  this.explicitType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getLayerVisible = function() {
  return this.visible_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setLayerVisible = function(value) {
  value = !!value;

  if (value != this.visible_) {
    this.visible_ = value;
    if (!this.mapVisibilityLocked_) {
      this.setVisible(value);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('visible', value, !value));

    var source = this.getSource();
    if (source instanceof os.source.Vector) {
      /** @type {os.source.Vector} */ (source).setVisible(value);
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setBaseVisible = function(value) {
  this.setVisible(value);
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getBaseVisible = function() {
  return this.getVisible();
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getNodeUI = function() {
  return this.nodeUi_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setNodeUI = function(value) {
  this.nodeUi_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setOpacity = function(value) {
  var source = this.getSource();
  if (source instanceof os.source.Vector) {
    source.setOverlayOpacity(value);
    source.set(ol.layer.Property.OPACITY, value, true);
  }

  os.layer.Vector.base(this, 'setOpacity', value);
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setZIndex = function(value) {
  var source = this.getSource();
  if (source instanceof os.source.Vector) {
    source.setOverlayZIndex(value);
    source.set(ol.layer.Property.Z_INDEX, value, true);
  }

  os.layer.Vector.base(this, 'setZIndex', value);

  os.style.label.updateShown();
};


/**
 * @return {string|undefined} The alternative feature directive.
 */
os.layer.Vector.prototype.getFeatureDirective = function() {
  return this.featureDirective_;
};


/**
 * @param {string|undefined} value An alternative feature directive.
 */
os.layer.Vector.prototype.setFeatureDirective = function(value) {
  this.featureDirective_ = value;
};


/**
 * Locks map visibility for this layer to the specified value. This is useful when rendering features with an
 * overlay instead of the rbush for things like animation.
 * @param {boolean} value
 */
os.layer.Vector.prototype.lockMapVisibility = function(value) {
  this.mapVisibilityLocked_ = true;

  if (this.getVisible() != value) {
    this.setVisible(value);
  }
};


/**
 * Unlocks map visibility for this layer.
 */
os.layer.Vector.prototype.unlockMapVisibility = function() {
  this.mapVisibilityLocked_ = false;

  if (this.getVisible() != this.visible_) {
    this.setVisible(this.visible_);
  }
};


/**
 * Identify the layer on the map.
 * @protected
 */
os.layer.Vector.prototype.identify = function() {
  var source = this.getSource();
  if (source instanceof os.source.Vector) {
    os.source.identifySource(/** @type {os.source.Vector} */ (source));
  } else {
    os.layer.identifyLayer(this);
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.callAction = function(type) {
  var source = this.getSource();

  if (os.action) {
    switch (type) {
      case os.action.EventType.IDENTIFY:
        this.identify();
        break;
      case os.action.EventType.CLEAR_SELECTION:
        if (source instanceof os.source.Vector) {
          source.selectNone();
        }
        break;
      case os.action.EventType.DISABLE_TIME:
        if (source instanceof os.source.Vector) {
          source.setTimeEnabled(false);
        }
        break;
      case os.action.EventType.ENABLE_TIME:
        if (source instanceof os.source.Vector) {
          source.setTimeEnabled(true);
        }
        break;
      case os.action.EventType.MOST_RECENT:
        var dm = os.dataManager;

        if (!dm.setTimeFromDescriptor(this.getId()) && source instanceof os.source.Vector) {
          var timeModel = source.getTimeModel();
          if (timeModel) {
            var range = timeModel.getRange();
            var maxTime = range.getEnd();
            if (maxTime > 0 && maxTime < os.time.TimeInstant.MAX_TIME) {
              // try to clamp this to reasonable values, avoiding unbounded end dates
              os.time.TimelineController.getInstance().setRangeStart(maxTime);
            }
          }
        }
        break;
      case os.action.EventType.REFRESH:
        if (source instanceof os.source.Request) {
          /** @type {os.source.Request} */ (source).refresh();
        }
        break;
      case os.action.EventType.LOCK:
      case os.action.EventType.UNLOCK:
        if (source instanceof os.source.Vector && source.isLockable()) {
          source.setLocked(type == os.action.EventType.LOCK);
        }
        break;
      case os.action.EventType.REMOVE_LAYER:
        var removeEvent = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, this.getId());
        os.dispatcher.dispatchEvent(removeEvent);
        break;
      case os.action.EventType.RENAME:
        os.ui.renamelayer.launchRenameDialog(this);
        break;
      case os.action.EventType.RESET_COLOR:
        if (source instanceof os.source.Vector) {
          source.setColorModel(null);
        }
        break;
      default:
        break;
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getLayerUI = function() {
  return this.layerUi_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setLayerUI = function(value) {
  this.layerUi_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getGroupUI = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.isFilterable = function() {
  return goog.isDefAndNotNull(this.filterLauncher_);
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getFilterKey = function() {
  var options = this.getLayerOptions();
  var id = /** @type {string} */ (options['id']);

  // try to get it from the descriptor
  var d = os.dataManager.getDescriptor(id);
  if (os.implements(d, os.filter.IFilterable.ID)) {
    return /** @type {!os.filter.IFilterable} */ (d).getFilterKey();
  }

  // try to derive it from the layer options
  var url = /** @type {string} */ (options['url']);
  var params = /** @type {string} */ (options['params']);
  var typeName = params ? /** @type {string} */ (params.get('typename')) : null;
  if (url && typeName) {
    return url + '!!' + typeName;
  }

  // dang
  return null;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getFilterableTypes = function() {
  return [this.getId()];
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.launchFilterManager = function() {
  if (goog.isDefAndNotNull(this.filterLauncher_)) {
    this.filterLauncher_(this);
  }
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getFilterColumns = function() {
  if (goog.isDefAndNotNull(this.filterColumns_)) {
    return this.filterColumns_(this);
  }

  return null;
};


/**
 * Get the filter manager launcher for this layer
 * @return {?os.filter.FilterLauncherFn}
 */
os.layer.Vector.prototype.getFilterLauncher = function() {
  return this.filterLauncher_;
};


/**
 * Set the filter manager launcher for this layer
 * @param {?os.filter.FilterLauncherFn} value
 */
os.layer.Vector.prototype.setFilterLauncher = function(value) {
  this.filterLauncher_ = value;
};


/**
 * Gets the function that returns the filter columns
 * @return {?os.filter.FilterColumnsFn}
 */
os.layer.Vector.prototype.getFilterColumnsFn = function() {
  return this.filterColumns_;
};


/**
 * Sets the function that returns the filter columns
 * @param {?os.filter.FilterColumnsFn} value
 */
os.layer.Vector.prototype.setFilterColumnsFn = function(value) {
  this.filterColumns_ = value;
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
os.layer.Vector.prototype.supportsAction = function(type, opt_actionArgs) {
  var source = /** @type {os.source.Vector} */ (this.getSource());
  var isVector = source instanceof os.source.Vector;

  if (os.action) {
    switch (type) {
      case os.action.EventType.GOTO:
      case os.action.EventType.IDENTIFY:
      case os.action.EventType.SHOW_DESCRIPTION:
        return true;
      case os.action.EventType.RENAME:
        return !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;
      case os.action.EventType.BUFFER:
      case os.action.EventType.EXPORT:
      case os.action.EventType.CLEAR_SELECTION:
        return isVector && source.getSupportsAction(type);
      case os.action.EventType.DISABLE_TIME:
        return isVector && source.getTimeEnabled();
      case os.action.EventType.ENABLE_TIME:
        return isVector && !source.getTimeEnabled();
      case os.action.EventType.MOST_RECENT:
        var maxDate = NaN;
        if (isVector) {
          // look for the max date on the descriptor
          var desc = os.dataManager.getDescriptor(this.getId());
          if (goog.isDefAndNotNull(desc)) {
            maxDate = desc.getMaxDate();
          }

          // if the descriptor didn't have it, try the time model
          if (isNaN(maxDate) || maxDate <= 0) {
            var timeModel = source.getTimeModel();
            if (timeModel) {
              var range = timeModel.getRange();
              maxDate = range.getEnd();
            }
          }
        }

        return maxDate > 0 && maxDate < os.time.TimeInstant.MAX_TIME;
      case os.action.EventType.REMOVE_LAYER:
        return this.isRemovable();
      case os.action.EventType.REFRESH:
        // don't allow refresh on reference layers (internally managed), or if the source doesn't allow refresh
        return this.osType_ !== os.layer.LayerType.REF && isVector && source.isRefreshEnabled();
      case os.action.EventType.LOCK:
        return isVector && source.isLockable() && !source.isLocked();
      case os.action.EventType.UNLOCK:
        return isVector && source.isLockable() && source.isLocked();
      case os.action.EventType.RESET_COLOR:
        return isVector && source.getColorModel() != null;
      default:
        // ask the source if it supports the action
        return isVector && source.getSupportsAction(type);
    }
  }

  return false;
};


/**
 * @return {Function}
 */
os.layer.Vector.prototype.getDoubleClickHandler = function() {
  return this.doubleClickHandler_;
};


/**
 * @param {Function} handler
 */
os.layer.Vector.prototype.setDoubleClickHandler = function(handler) {
  this.doubleClickHandler_ = handler;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getSynchronizerType = function() {
  return this.syncType_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setSynchronizerType = function(value) {
  this.syncType_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.getHidden = function() {
  return this.hidden_;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.setHidden = function(value) {
  this.hidden_ = value;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.renderLegend = function(options) {
  // use default vector layer legend renderer
  os.legend.drawVectorLayer(this, options);
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};

  opt_to['visible'] = this.getLayerVisible();
  opt_to['opacity'] = this.getOpacity();
  opt_to['minResolution'] = this.getMinResolution();
  opt_to['maxResolution'] = this.getMaxResolution();

  // style
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.getId());

  if (config) {
    opt_to[os.style.StyleField.ARROW_SIZE] = config[os.style.StyleField.ARROW_SIZE];
    opt_to[os.style.StyleField.ARROW_UNITS] = config[os.style.StyleField.ARROW_UNITS];
    opt_to[os.style.StyleField.COLOR] = os.style.getConfigColor(config);
    opt_to[os.style.StyleField.REPLACE_STYLE] = config[os.style.StyleField.REPLACE_STYLE];
    opt_to[os.style.StyleField.SIZE] = os.style.getConfigSize(config);
    opt_to[os.style.StyleField.ICON] = os.style.getConfigIcon(config);
    opt_to[os.style.StyleField.LABELS] = config[os.style.StyleField.LABELS];
    opt_to[os.style.StyleField.LABEL_COLOR] = config[os.style.StyleField.LABEL_COLOR];
    opt_to[os.style.StyleField.LABEL_SIZE] = config[os.style.StyleField.LABEL_SIZE];
    opt_to[os.style.StyleField.LOB_COLUMN_LENGTH] = config[os.style.StyleField.LOB_COLUMN_LENGTH];
    opt_to[os.style.StyleField.LOB_LENGTH] = config[os.style.StyleField.LOB_LENGTH];
    opt_to[os.style.StyleField.LOB_LENGTH_TYPE] = config[os.style.StyleField.LOB_LENGTH_TYPE];
    opt_to[os.style.StyleField.LOB_LENGTH_COLUMN] = config[os.style.StyleField.LOB_LENGTH_COLUMN];
    opt_to[os.style.StyleField.LOB_LENGTH_ERROR] = config[os.style.StyleField.LOB_LENGTH_ERROR];
    opt_to[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN] = config[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN];
    opt_to[os.style.StyleField.LOB_LENGTH_ERROR_UNITS] = config[os.style.StyleField.LOB_LENGTH_ERROR_UNITS];
    opt_to[os.style.StyleField.LOB_LENGTH_UNITS] = config[os.style.StyleField.LOB_LENGTH_UNITS];
    opt_to[os.style.StyleField.LOB_BEARING_COLUMN] = config[os.style.StyleField.LOB_BEARING_COLUMN];
    opt_to[os.style.StyleField.LOB_BEARING_ERROR] = config[os.style.StyleField.LOB_BEARING_ERROR];
    opt_to[os.style.StyleField.LOB_BEARING_ERROR_COLUMN] = config[os.style.StyleField.LOB_BEARING_ERROR_COLUMN];
    opt_to[os.style.StyleField.ROTATION_COLUMN] = config[os.style.StyleField.ROTATION_COLUMN];
    opt_to[os.style.StyleField.SHOW_ROTATION] = config[os.style.StyleField.SHOW_ROTATION];
    opt_to[os.style.StyleField.SHOW_ARROW] = config[os.style.StyleField.SHOW_ARROW];
    opt_to[os.style.StyleField.SHOW_ELLIPSE] = config[os.style.StyleField.SHOW_ELLIPSE];
    opt_to[os.style.StyleField.SHOW_ERROR] = config[os.style.StyleField.SHOW_ERROR];
    opt_to[os.style.StyleField.SHOW_LABELS] = config[os.style.StyleField.SHOW_LABELS];
    opt_to[os.style.StyleField.SHOW_ELLIPSOIDS] = config[os.style.StyleField.SHOW_ELLIPSOIDS];
    opt_to[os.style.StyleField.SHOW_GROUND_REF] = config[os.style.StyleField.SHOW_GROUND_REF];
  }

  var source =  /** @type {os.IPersistable} */ (this.getSource());
  if (source && os.implements(source, os.source.ISource.ID)) {
    opt_to = /** @type {os.source.ISource} */ (source).persist(opt_to);
  }

  return opt_to;
};


/**
 * @inheritDoc
 */
os.layer.Vector.prototype.restore = function(config) {
  if (config['id'] != null) {
    this.setId(config['id']);
  }

  var styleConf = os.style.StyleManager.getInstance().getOrCreateLayerConfig(this.getId());

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

  if (config['featureDirective'] != null) {
    this.setFeatureDirective(config['featureDirective']);
  }

  if (config['layerUI'] != null) {
    this.setLayerUI(config['layerUI']);
  }

  if (config['nodeUI'] != null) {
    this.setNodeUI(config['nodeUI']);
  }

  var opacity = config['alpha'] || config['opacity'];
  if (opacity != null) {
    this.setOpacity(opacity);
  }

  this.setMinResolution(config['minResolution'] || this.getMinResolution());
  this.setMaxResolution(config['maxResolution'] || this.getMaxResolution());

  if (config[os.style.StyleField.COLOR] != null) {
    os.style.setConfigColor(styleConf, os.style.toRgbaString(config[os.style.StyleField.COLOR]));
  }

  if (config[os.style.StyleField.REPLACE_STYLE] != null) {
    styleConf[os.style.StyleField.REPLACE_STYLE] = config[os.style.StyleField.REPLACE_STYLE];
  }

  if (config[os.style.StyleField.SIZE] != null) {
    os.style.setConfigSize(styleConf, config[os.style.StyleField.SIZE]);
  }

  if (config[os.style.StyleField.ICON] != null) {
    os.style.setConfigIcon(styleConf, config[os.style.StyleField.ICON]);
  }

  if (config[os.style.StyleField.SHOW_ARROW] != null) {
    styleConf[os.style.StyleField.SHOW_ARROW] = config[os.style.StyleField.SHOW_ARROW];
  }

  if (config[os.style.StyleField.SHOW_ERROR] != null) {
    styleConf[os.style.StyleField.SHOW_ERROR] = config[os.style.StyleField.SHOW_ERROR];
  }

  if (config[os.style.StyleField.SHOW_ELLIPSE] != null) {
    styleConf[os.style.StyleField.SHOW_ELLIPSE] = config[os.style.StyleField.SHOW_ELLIPSE];
  }

  if (config[os.style.StyleField.SHOW_ELLIPSOIDS] != null) {
    styleConf[os.style.StyleField.SHOW_ELLIPSOIDS] = config[os.style.StyleField.SHOW_ELLIPSOIDS];
  }

  if (config[os.style.StyleField.SHOW_GROUND_REF] != null) {
    styleConf[os.style.StyleField.SHOW_GROUND_REF] = config[os.style.StyleField.SHOW_GROUND_REF];
  }

  if (config[os.style.StyleField.SHOW_ROTATION] != null) {
    styleConf[os.style.StyleField.SHOW_ROTATION] = config[os.style.StyleField.SHOW_ROTATION];
  }

  styleConf[os.style.StyleField.ARROW_SIZE] = config[os.style.StyleField.ARROW_SIZE] || os.style.DEFAULT_ARROW_SIZE;
  styleConf[os.style.StyleField.ARROW_UNITS] = config[os.style.StyleField.ARROW_UNITS] || os.style.DEFAULT_UNITS;
  styleConf[os.style.StyleField.LOB_COLUMN_LENGTH] = config[os.style.StyleField.LOB_COLUMN_LENGTH] ||
    os.style.DEFAULT_LOB_LENGTH;
  styleConf[os.style.StyleField.LOB_LENGTH] = config[os.style.StyleField.LOB_LENGTH] || os.style.DEFAULT_LOB_LENGTH;
  styleConf[os.style.StyleField.LOB_LENGTH_ERROR] = config[os.style.StyleField.LOB_LENGTH_ERROR] ||
    os.style.DEFAULT_LOB_LENGTH_ERROR;
  styleConf[os.style.StyleField.LOB_LENGTH_TYPE] = config[os.style.StyleField.LOB_LENGTH_TYPE] ||
    os.style.DEFAULT_LOB_LENGTH_TYPE;
  styleConf[os.style.StyleField.LOB_LENGTH_COLUMN] = config[os.style.StyleField.LOB_LENGTH_COLUMN] || '';
  styleConf[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN] = config[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN] || '';
  styleConf[os.style.StyleField.LOB_BEARING_COLUMN] = config[os.style.StyleField.LOB_BEARING_COLUMN] || '';
  styleConf[os.style.StyleField.LOB_LENGTH_ERROR_UNITS] = config[os.style.StyleField.LOB_LENGTH_ERROR_UNITS] ||
    os.style.DEFAULT_UNITS;
  styleConf[os.style.StyleField.LOB_LENGTH_UNITS] = config[os.style.StyleField.LOB_LENGTH_UNITS] ||
    os.style.DEFAULT_UNITS;
  styleConf[os.style.StyleField.LOB_BEARING_ERROR] = config[os.style.StyleField.LOB_BEARING_ERROR] ||
    os.style.DEFAULT_LOB_BEARING_ERROR;
  styleConf[os.style.StyleField.LOB_BEARING_ERROR_COLUMN] = config[os.style.StyleField.LOB_BEARING_ERROR_COLUMN] || '';
  styleConf[os.style.StyleField.ROTATION_COLUMN] = config[os.style.StyleField.ROTATION_COLUMN] || '';
  styleConf[os.style.StyleField.LABELS] = config[os.style.StyleField.LABELS] || [os.style.label.cloneConfig()];
  styleConf[os.style.StyleField.LABEL_COLOR] = config[os.style.StyleField.LABEL_COLOR];
  styleConf[os.style.StyleField.LABEL_SIZE] = config[os.style.StyleField.LABEL_SIZE] || os.style.label.DEFAULT_SIZE;
  styleConf[os.style.StyleField.SHOW_LABELS] = config[os.style.StyleField.SHOW_LABELS] || false;

  var source =  /** @type {os.IPersistable} */ (this.getSource());
  if (source && os.implements(source, os.source.ISource.ID)) {
    /** @type {os.source.ISource} */ (source).restore(config);
  }
};


/**
 * Handles double clicks on features by popping up a window to display feature metadata.
 * @param {ol.Feature} feature
 * @private
 *
 * @this os.layer.Vector
 */
os.layer.Vector.defaultDoubleClickHandler_ = function(feature) {
  if (feature) {
    // look for a title on the feature, otherwise use the layer title
    var title = os.feature.getTitle(feature) || this.getTitle();
    os.ui.launchFeatureInfo(feature, title, this.getFeatureDirective());
  }
};

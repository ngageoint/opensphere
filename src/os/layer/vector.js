goog.module('os.layer.Vector');

const GoogEventType = goog.require('goog.events.EventType');
const {getRandomString} = goog.require('goog.string');

const events = goog.require('ol.events');
const Property = goog.require('ol.layer.Property');
const OLVectorLayer = goog.require('ol.layer.Vector');

const dispatcher = goog.require('os.Dispatcher');
const IGroupable = goog.require('os.IGroupable');
const MapChange = goog.require('os.MapChange');
const ActionEventType = goog.require('os.action.EventType');
const {toRgbArray} = goog.require('os.color');
const DataManager = goog.require('os.data.DataManager');
const IMappingDescriptor = goog.require('os.data.IMappingDescriptor');
const LayerEvent = goog.require('os.events.LayerEvent');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {getTitle} = goog.require('os.feature');
const IFilterable = goog.require('os.filter.IFilterable');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const osImplements = goog.require('os.implements');
const {identifyLayer} = goog.require('os.layer');
const ExplicitLayerType = goog.require('os.layer.ExplicitLayerType');
const ILayer = goog.require('os.layer.ILayer');
const LayerClass = goog.require('os.layer.LayerClass');
const LayerType = goog.require('os.layer.LayerType');
const PropertyChange = goog.require('os.layer.PropertyChange');
const SynchronizerType = goog.require('os.layer.SynchronizerType');
const {drawVectorLayer} = goog.require('os.legend');
const ILegendRenderer = goog.require('os.legend.ILegendRenderer');
const {getMapContainer} = goog.require('os.map.instance');
const {paramsToQueryData} = goog.require('os.net');
const {getQueryManager} = goog.require('os.query.instance');
const registerClass = goog.require('os.registerClass');
const {identifySource} = goog.require('os.source');
const ISource = goog.require('os.source.ISource');
const SourcePropertyChange = goog.require('os.source.PropertyChange');
const VectorSource = goog.require('os.source.Vector');
const {isStateFile} = goog.require('os.state');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const {DEFAULT_SIZE, cloneConfig, updateShown} = goog.require('os.style.label');
const TimeInstant = goog.require('os.time.TimeInstant');
const TimelineController = goog.require('os.time.TimelineController');
const {default: Icons} = goog.require('os.ui.Icons');
const {default: IconsSVG} = goog.require('os.ui.IconsSVG');
const {default: launchMultiFeatureInfo} = goog.require('os.ui.feature.launchMultiFeatureInfo');
const {FILTER_KEY_DELIMITER} = goog.require('os.ui.filter');
const {createIconSet} = goog.require('os.ui.icons');
const {directiveTag: layerUi} = goog.require('os.ui.layer.VectorLayerUI');
const {directiveTag: nodeUi} = goog.require('os.ui.node.DefaultLayerNodeUI');
const {launchRenameDialog} = goog.require('os.ui.renamelayer');
const TimelineUI = goog.require('os.ui.timeline.TimelineUI');

const Feature = goog.requireType('ol.Feature');
const IPersistable = goog.requireType('os.IPersistable');
const filter = goog.requireType('os.filter');


/**
 * @implements {ILayer}
 * @implements {IGroupable}
 * @implements {IFilterable}
 * @implements {ILegendRenderer}
 */
class Vector extends OLVectorLayer {
  /**
   * Constructor.
   * @param {olx.layer.VectorOptions} options Vector layer options
   */
  constructor(options) {
    super(options);

    /**
     * @type {!string}
     * @private
     */
    this.id_ = getRandomString();

    /**
     * @type {?string}
     * @private
     */
    this.osType_ = LayerType.FEATURES;

    /**
     * @type {string}
     * @private
     */
    this.explicitType_ = ExplicitLayerType.FEATURES;

    /**
     * @type {!string}
     * @private
     */
    this.title_ = 'New Layer';

    /**
     * If the layer is enabled.
     * @type {boolean}
     * @private
     */
    this.enabled_ = true;

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
    this.nodeUi_ = `<${nodeUi}></${nodeUi}>`;

    /**
     * The controls UI to show in the Layers window.
     * @type {string}
     * @private
     */
    this.layerUi_ = layerUi;

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
    this.doubleClickHandler_ = Vector.defaultDoubleClickHandler.bind(this);

    /**
     * Function to launch the filter manager for this layer
     * @type {?filter.FilterLauncherFn}
     * @private
     */
    this.filterLauncher_ = null;

    /**
     * Function to return the columns used in the filter
     * @type {?filter.FilterColumnsFn}
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
    this.syncType_ = SynchronizerType.VECTOR;

    /**
     * @type {boolean}
     * @private
     */
    this.hidden_ = false;

    // we don't care about the render order, so disable it to save some processing time
    this.setRenderOrder(null);
    getMapContainer().listen(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    // call the parent chain first to remove listeners
    super.disposeInternal();
    getMapContainer().unlisten(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);

    // make sure the map loading counters are updated since the layer is being removed
    this.setLoading(false);

    var source = this.getSource();
    if (source) {
      source.dispose();
    }

    StyleManager.getInstance().removeLayerConfig(this.getId());
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    var old = this.getSource();
    if (old && old instanceof VectorSource) {
      events.unlisten(old, GoogEventType.PROPERTYCHANGE, this.onSourceChange, this);
      old.setWebGLEnabled(false);
    }

    super.setSource(source);

    if (source && source instanceof VectorSource) {
      source = /** @type {VectorSource} */ (source);
      events.listen(source, GoogEventType.PROPERTYCHANGE, this.onSourceChange, this);
      source.setWebGLEnabled(getMapContainer().is3DEnabled());
    }
  }

  /**
   * @param {PropertyChangeEvent} event
   * @private
   */
  onMapChange_(event) {
    var p = event.getProperty();
    if (p == MapChange.VIEW3D) {
      var enabled = /** @type {boolean} */ (event.getNewValue());
      this.updateMapVisibility_();

      var source = this.getSource();
      if (source instanceof VectorSource) {
        /** @type {VectorSource} */ (source).setWebGLEnabled(enabled);
      }
    }
  }

  /**
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onSourceChange(event) {
    var p = event.getProperty();
    var e;

    switch (p) {
      case SourcePropertyChange.FEATURE_VISIBILITY:
        var source = /** @type {ISource} */ (this.getSource());
        var features = /** @type {Array.<Feature>} */ (event.getNewValue());
        if (features) {
          for (var i = 0, n = features.length; i < n; i++) {
            var feature = features[i];
            getMapContainer().updateFeatureVisibility(feature, !source.isHidden(feature));
          }
        }
        break;
      case SourcePropertyChange.LOADING:
        this.setLoading(/** @type {boolean} */ (event.getNewValue()));
        break;
      case SourcePropertyChange.VISIBLE:
        this.setLayerVisible(/** @type {boolean} */ (event.getNewValue()));
        break;
      case SourcePropertyChange.ANIMATION_ENABLED:
        this.animationEnabled_ = /** @type {boolean} */ (event.getNewValue());
        this.updateMapVisibility_();
        break;
      case SourcePropertyChange.TIME_ENABLED:
        // forward as a layer event
        e = new PropertyChangeEvent(PropertyChange.TIME_ENABLED, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
        break;
      case SourcePropertyChange.STYLE:
        // forward as a layer event
        e = new PropertyChangeEvent(PropertyChange.STYLE, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
        break;
      case SourcePropertyChange.LABEL:
        // forward as a layer event
        e = new PropertyChangeEvent(PropertyChange.LABEL, event.getNewValue(), event.getOldValue());
        this.dispatchEvent(e);
        break;
      case SourcePropertyChange.LOCK:
        e = new PropertyChangeEvent(PropertyChange.LOCK, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
        break;
      case SourcePropertyChange.REFRESH_INTERVAL:
        e = new PropertyChangeEvent(PropertyChange.REFRESH_INTERVAL, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
        break;
      case SourcePropertyChange.COLOR_MODEL:
        e = new PropertyChangeEvent(PropertyChange.COLOR_MODEL, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
        break;
      case SourcePropertyChange.HAS_MODIFICATIONS:
      case SourcePropertyChange.COLUMNS:
      case SourcePropertyChange.COLUMN_ADDED:
        this.dispatchEvent(new PropertyChangeEvent(p, event.getNewValue(), event.getOldValue()));
        break;
      case SourcePropertyChange.ALTITUDE:
        // forward as a layer event
        e = new PropertyChangeEvent(PropertyChange.ALTITUDE, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
        break;
      default:
        break;
    }
  }

  /**
   * Updates map visibility based on the animation/view (2d/3d) state.
   *
   * @private
   */
  updateMapVisibility_() {
    if (this.animationEnabled_ && !getMapContainer().is3DEnabled()) {
      this.lockMapVisibility(false);
    } else {
      this.unlockMapVisibility();
    }
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(value) {
    this.id_ = value;
  }

  /**
   * @inheritDoc
   */
  getGroupId() {
    return this.getId();
  }

  /**
   * @inheritDoc
   */
  getGroupLabel() {
    return this.getTitle();
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    var config = StyleManager.getInstance().getLayerConfig(this.getId());

    if (config) {
      var color = osStyle.getConfigColor(config, true);
      if (color) {
        return createIconSet(this.getId(), this.getSVGSet(), this.getFASet(), color);
      }
    }

    return this.getIconSet().join('');
  }

  /**
   * Get the FontAwesome icons for the layer.
   *
   * @return {!Array<string>}
   * @protected
   */
  getFASet() {
    var icons = [];

    var source = this.getSource();
    if (source instanceof VectorSource) {
      if (source.hasColors()) {
        icons.push(Icons.COLOR_MODEL);
      }

      if (ImportActionManager.getInstance().hasActiveActions(/** @type {string} */ (source.getId()))) {
        icons.push(Icons.FEATUREACTION);
      }
    }

    if (isStateFile(this.getId())) {
      icons.push(Icons.STATE);
    }

    if (getQueryManager().hasEnabledEntries(this.getId())) {
      icons.push(Icons.FILTER);
    }

    return icons;
  }

  /**
   * Get the SVG icons for the layer.
   *
   * @return {Array<string>}
   * @protected
   */
  getSVGSet() {
    var icons = [IconsSVG.FEATURES];
    var source = this.getSource();

    if (source instanceof VectorSource) {
      if (source.getTimeEnabled()) {
        icons.push(IconsSVG.TIME);
      }

      if (source.isLocked()) {
        icons.push(IconsSVG.LOCK);
      }
    }

    return icons;
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getIconSet() {
    var icons = [Icons.FEATURES];
    var source = this.getSource();
    if (source instanceof VectorSource) {
      if (source.getTimeEnabled()) {
        icons.push(Icons.TIME);
      }

      if (source.isLocked()) {
        icons.push(Icons.LOCK);
      }

      if (source.hasColors()) {
        icons.push(Icons.COLOR_MODEL);
      }

      if (isStateFile(this.getId())) {
        icons.push(Icons.STATE);
      }

      if (getQueryManager().hasEnabledEntries(this.getId())) {
        icons.push(Icons.FILTER);
      }
    }

    return icons;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    return this.layerOptions_;
  }

  /**
   * @inheritDoc
   */
  setLayerOptions(value) {
    this.layerOptions_ = value;
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    return this.enabled_;
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    if (this.enabled_ !== value) {
      this.enabled_ = value;
      this.setEnabledInternal(value);
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ENABLED, value, !value));
    }
  }

  /**
   * Perform internal layer actions when the enabled state changes.
   * @param {boolean} value The new value.
   * @protected
   */
  setEnabledInternal(value) {
    var source = this.getSource();
    if (osImplements(source, ISource.ID)) {
      /** @type {ISource} */ (source).setEnabled(value);
    }
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return this.loading_;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    if (this.loading_ !== value) {
      var old = this.loading_;
      this.loading_ = value;

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.LOADING, value, old));
    }
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return this.provider_;
  }

  /**
   * @inheritDoc
   */
  setProvider(value) {
    this.provider_ = value;
  }

  /**
   * @inheritDoc
   */
  isRemovable() {
    return this.removable_;
  }

  /**
   * @inheritDoc
   */
  setRemovable(value) {
    this.removable_ = value;
  }

  /**
   * Tells whether the vector should stick
   *
   * @return {boolean}
   */
  isSticky() {
    return this.sticky_;
  }

  /**
   * Set whether the vector should stick
   *
   * @param {boolean} value
   */
  setSticky(value) {
    this.sticky_ = value;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.tags_;
  }

  /**
   * @inheritDoc
   */
  setTags(value) {
    this.tags_ = value;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.title_;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    if (this.title_ !== value) {
      var old = this.title_;
      this.title_ = value;
      this.dispatchEvent(new PropertyChangeEvent('title', value, old));
    }
  }

  /**
   * @inheritDoc
   */
  getOSType() {
    return this.osType_;
  }

  /**
   * @inheritDoc
   */
  setOSType(value) {
    this.osType_ = value;
  }

  /**
   * @inheritDoc
   */
  getExplicitType() {
    return this.explicitType_;
  }

  /**
   * @inheritDoc
   */
  setExplicitType(value) {
    this.explicitType_ = value;
  }

  /**
   * @inheritDoc
   */
  getLayerVisible() {
    return this.visible_;
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    value = !!value;

    if (value != this.visible_) {
      this.visible_ = value;
      if (!this.mapVisibilityLocked_) {
        this.setVisible(value);
      }

      this.dispatchEvent(new PropertyChangeEvent('visible', value, !value));

      var source = this.getSource();
      if (source instanceof VectorSource) {
        /** @type {VectorSource} */ (source).setVisible(value);
      }
    }
  }

  /**
   * @inheritDoc
   */
  setBaseVisible(value) {
    this.setVisible(value);
  }

  /**
   * @inheritDoc
   */
  getBaseVisible() {
    return this.getVisible();
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return this.nodeUi_;
  }

  /**
   * @inheritDoc
   */
  setNodeUI(value) {
    this.nodeUi_ = value;
  }

  /**
   * @inheritDoc
   */
  setOpacity(value) {
    var source = this.getSource();
    if (source instanceof VectorSource) {
      source.setOverlayOpacity(value);
      source.set(Property.OPACITY, value, true);
    }

    super.setOpacity(value);
  }

  /**
   * @inheritDoc
   */
  setZIndex(value) {
    var source = this.getSource();
    if (source instanceof VectorSource) {
      source.setOverlayZIndex(value);
      source.set(Property.Z_INDEX, value, true);
    }

    super.setZIndex(value);

    updateShown();
  }

  /**
   * @return {string|undefined} The alternative feature directive.
   */
  getFeatureDirective() {
    return this.featureDirective_;
  }

  /**
   * @param {string|undefined} value An alternative feature directive.
   */
  setFeatureDirective(value) {
    this.featureDirective_ = value;
  }

  /**
   * Locks map visibility for this layer to the specified value. This is useful when rendering features with an
   * overlay instead of the rbush for things like animation.
   *
   * @param {boolean} value
   */
  lockMapVisibility(value) {
    this.mapVisibilityLocked_ = true;

    if (this.getVisible() != value) {
      this.setVisible(value);
    }
  }

  /**
   * Unlocks map visibility for this layer.
   */
  unlockMapVisibility() {
    this.mapVisibilityLocked_ = false;

    if (this.getVisible() != this.visible_) {
      this.setVisible(this.visible_);
    }
  }

  /**
   * Identify the layer on the map.
   *
   * @protected
   */
  identify() {
    var source = this.getSource();
    if (source instanceof VectorSource) {
      identifySource(/** @type {VectorSource} */ (source));
    } else {
      identifyLayer(this);
    }
  }

  /**
   * @inheritDoc
   */
  callAction(type) {
    var source = this.getSource();

    switch (type) {
      case ActionEventType.IDENTIFY:
        this.identify();
        break;
      case ActionEventType.CLEAR_SELECTION:
        if (source instanceof VectorSource) {
          source.selectNone();
        }
        break;
      case ActionEventType.DISABLE_TIME:
        if (source instanceof VectorSource) {
          source.setTimeEnabled(false);
        }
        break;
      case ActionEventType.ENABLE_TIME:
        if (source instanceof VectorSource) {
          source.setTimeEnabled(true);
        }
        break;
      case ActionEventType.MOST_RECENT:
        var dm = DataManager.getInstance();

        if (!dm.setTimeFromDescriptor(this.getId()) && source instanceof VectorSource) {
          var timeModel = source.getTimeModel();
          if (timeModel) {
            var range = timeModel.getRange();
            var maxTime = range.getEnd();
            if (maxTime > 0 && maxTime < TimeInstant.MAX_TIME) {
              // try to clamp this to reasonable values, avoiding unbounded end dates
              TimelineController.getInstance().setRangeStart(maxTime);
            }
          }
        }
        TimelineUI.Controller.setView();
        break;
      case ActionEventType.REFRESH:
        if (source instanceof VectorSource && source.isRefreshEnabled()) {
          source.refresh();
        }
        break;
      case ActionEventType.LOCK:
      case ActionEventType.UNLOCK:
        if (source instanceof VectorSource && source.isLockable()) {
          source.setLocked(type == ActionEventType.LOCK);
        }
        break;
      case ActionEventType.REMOVE_LAYER:
        var removeEvent = new LayerEvent(LayerEventType.REMOVE, this.getId());
        dispatcher.getInstance().dispatchEvent(removeEvent);
        break;
      case ActionEventType.RENAME:
        launchRenameDialog(this);
        break;
      case ActionEventType.RESET_COLOR:
        if (source instanceof VectorSource) {
          source.setColorModel(null);
        }
        break;
      default:
        break;
    }
  }

  /**
   * @inheritDoc
   */
  getLayerUI() {
    return this.layerUi_;
  }

  /**
   * @inheritDoc
   */
  setLayerUI(value) {
    this.layerUi_ = value;
  }

  /**
   * @inheritDoc
   */
  getGroupUI() {
    return null;
  }

  /**
   * @inheritDoc
   */
  isFilterable() {
    return this.filterLauncher_ != null;
  }

  /**
   * @inheritDoc
   */
  getFilterKey() {
    var options = this.getLayerOptions();
    if (options) {
      var id = /** @type {string} */ (options['id']);

      // try to get it from the descriptor
      var d = DataManager.getInstance().getDescriptor(id);
      if (osImplements(d, IFilterable.ID)) {
        return (
          /** @type {!IFilterable} */
          (d).getFilterKey()
        );
      }

      // try to derive it from the layer options
      var url = /** @type {string} */ (options['url']);
      var params = /** @type {string|Object<string, *>|goog.Uri.QueryData} */ (options['params']);
      if (params) {
        params = paramsToQueryData(params);
        var typeName = params.get('typename');
        if (url && typeName) {
          return url + FILTER_KEY_DELIMITER + typeName;
        }
      }
    }

    // dang
    return null;
  }

  /**
   * @inheritDoc
   */
  getFilterableTypes() {
    return [this.getId()];
  }

  /**
   * @inheritDoc
   */
  launchFilterManager() {
    if (this.filterLauncher_ != null) {
      this.filterLauncher_(this);
    }
  }

  /**
   * @inheritDoc
   */
  getFilterColumns() {
    if (this.filterColumns_ != null) {
      return this.filterColumns_(this);
    }

    return null;
  }

  /**
   * Get the filter manager launcher for this layer
   *
   * @return {?filter.FilterLauncherFn}
   */
  getFilterLauncher() {
    return this.filterLauncher_;
  }

  /**
   * Set the filter manager launcher for this layer
   *
   * @param {?filter.FilterLauncherFn} value
   */
  setFilterLauncher(value) {
    this.filterLauncher_ = value;
  }

  /**
   * Gets the function that returns the filter columns
   *
   * @return {?filter.FilterColumnsFn}
   */
  getFilterColumnsFn() {
    return this.filterColumns_;
  }

  /**
   * Sets the function that returns the filter columns
   *
   * @param {?filter.FilterColumnsFn} value
   */
  setFilterColumnsFn(value) {
    this.filterColumns_ = value;
  }

  /**
   * @inheritDoc
   * @see {os.ui.action.IActionTarget}
   */
  supportsAction(type, opt_actionArgs) {
    const source = /** @type {VectorSource} */ (this.getSource());
    const isVector = source instanceof VectorSource;
    const onlyOneLayer = !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;

    switch (type) {
      case ActionEventType.GOTO:
      case ActionEventType.IDENTIFY:
      case ActionEventType.SHOW_DESCRIPTION:
        return true;
      case ActionEventType.FEATURE_LIST:
        return isVector;
      case ActionEventType.RENAME:
        return onlyOneLayer;
      case ActionEventType.BUFFER:
      case ActionEventType.EXPORT:
      case ActionEventType.CLEAR_SELECTION:
        return isVector && source.getSupportsAction(type);
      case ActionEventType.DISABLE_TIME:
        return isVector && source.getTimeEnabled();
      case ActionEventType.ENABLE_TIME:
        return isVector && !source.getTimeEnabled();
      case ActionEventType.MOST_RECENT:
        var maxDate = NaN;
        if (isVector) {
          // look for the max date on the descriptor
          var desc = DataManager.getInstance().getDescriptor(this.getId());
          if (desc != null) {
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

        return maxDate > 0 && maxDate < TimeInstant.MAX_TIME;
      case ActionEventType.REMOVE_LAYER:
        return this.isRemovable();
      case ActionEventType.REFRESH:
        // don't allow refresh on reference layers (internally managed), or if the source doesn't allow refresh
        return this.osType_ !== LayerType.REF && isVector && source.isRefreshEnabled();
      case ActionEventType.LOCK:
        return isVector && source.isLockable() && !source.isLocked();
      case ActionEventType.UNLOCK:
        return isVector && source.isLockable() && source.isLocked();
      case ActionEventType.RESET_COLOR:
        return isVector && source.hasColors();
      case ActionEventType.SAVE_LAYER:
      case ActionEventType.SAVE_LAYER_AS:
        return isVector && source.getHasModifications();
      case ActionEventType.LAYER_SETTINGS:
        const descriptor = DataManager.getInstance().getDescriptor(source.getId());

        return isVector && onlyOneLayer &&
        osImplements(descriptor, IMappingDescriptor.ID) &&
        /** @type {IMappingDescriptor} */ (descriptor).supportsMapping();
      default:
        // ask the source if it supports the action
        return isVector && source.getSupportsAction(type);
    }
  }

  /**
   * Gets the double click handler for the layer.
   *
   * @return {Function}
   */
  getDoubleClickHandler() {
    return this.doubleClickHandler_;
  }

  /**
   * Sets the double click handler for the layer. This can be a function that operates on either a single feature
   * or an array of features.
   *
   * @param {Function} handler
   */
  setDoubleClickHandler(handler) {
    this.doubleClickHandler_ = handler;
  }

  /**
   * @inheritDoc
   */
  getSynchronizerType() {
    return this.syncType_;
  }

  /**
   * @inheritDoc
   */
  setSynchronizerType(value) {
    this.syncType_ = value;
  }

  /**
   * @inheritDoc
   */
  getHidden() {
    return this.hidden_;
  }

  /**
   * @inheritDoc
   */
  setHidden(value) {
    this.hidden_ = value;
  }

  /**
   * @inheritDoc
   */
  renderLegend(options) {
    // use default vector layer legend renderer
    drawVectorLayer(this, options);
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = opt_to || {};

    opt_to['enabled'] = this.isEnabled();
    opt_to['visible'] = this.getLayerVisible();
    opt_to['opacity'] = this.getOpacity();
    opt_to['minResolution'] = this.getMinResolution();
    opt_to['maxResolution'] = this.getMaxResolution();

    // style
    var config = StyleManager.getInstance().getLayerConfig(this.getId());

    if (config) {
      opt_to[StyleField.ARROW_SIZE] = config[StyleField.ARROW_SIZE];
      opt_to[StyleField.ARROW_UNITS] = config[StyleField.ARROW_UNITS];
      opt_to[StyleField.COLOR] = osStyle.getConfigColor(config);
      opt_to[StyleField.FILL_COLOR] = osStyle.getConfigColor(config, false, StyleField.FILL);
      opt_to[StyleField.REPLACE_STYLE] = config[StyleField.REPLACE_STYLE];
      opt_to[StyleField.SIZE] = osStyle.getConfigSize(config);
      opt_to[StyleField.ICON] = osStyle.getConfigIcon(config);
      opt_to[StyleField.LABELS] = config[StyleField.LABELS];
      opt_to[StyleField.LABEL_COLOR] = config[StyleField.LABEL_COLOR];
      opt_to[StyleField.LABEL_SIZE] = config[StyleField.LABEL_SIZE];
      opt_to[StyleField.LINE_DASH] = osStyle.getConfigLineDash(config);
      opt_to[StyleField.LOB_COLUMN_LENGTH] = config[StyleField.LOB_COLUMN_LENGTH];
      opt_to[StyleField.LOB_LENGTH] = config[StyleField.LOB_LENGTH];
      opt_to[StyleField.LOB_LENGTH_TYPE] = config[StyleField.LOB_LENGTH_TYPE];
      opt_to[StyleField.LOB_LENGTH_COLUMN] = config[StyleField.LOB_LENGTH_COLUMN];
      opt_to[StyleField.LOB_LENGTH_ERROR] = config[StyleField.LOB_LENGTH_ERROR];
      opt_to[StyleField.LOB_LENGTH_ERROR_COLUMN] = config[StyleField.LOB_LENGTH_ERROR_COLUMN];
      opt_to[StyleField.LOB_LENGTH_ERROR_UNITS] = config[StyleField.LOB_LENGTH_ERROR_UNITS];
      opt_to[StyleField.LOB_LENGTH_UNITS] = config[StyleField.LOB_LENGTH_UNITS];
      opt_to[StyleField.LOB_BEARING_COLUMN] = config[StyleField.LOB_BEARING_COLUMN];
      opt_to[StyleField.LOB_BEARING_ERROR] = config[StyleField.LOB_BEARING_ERROR];
      opt_to[StyleField.LOB_BEARING_ERROR_COLUMN] = config[StyleField.LOB_BEARING_ERROR_COLUMN];
      opt_to[StyleField.ROTATION_COLUMN] = config[StyleField.ROTATION_COLUMN];
      opt_to[StyleField.SHOW_ROTATION] = config[StyleField.SHOW_ROTATION];
      opt_to[StyleField.SHOW_ARROW] = config[StyleField.SHOW_ARROW];
      opt_to[StyleField.SHOW_ELLIPSE] = config[StyleField.SHOW_ELLIPSE];
      opt_to[StyleField.SHOW_ERROR] = config[StyleField.SHOW_ERROR];
      opt_to[StyleField.SHOW_LABELS] = config[StyleField.SHOW_LABELS];
      opt_to[StyleField.SHOW_ELLIPSOIDS] = config[StyleField.SHOW_ELLIPSOIDS];
      opt_to[StyleField.SHOW_GROUND_REF] = config[StyleField.SHOW_GROUND_REF];
    }

    var source = /** @type {IPersistable} */ (this.getSource());
    if (source && osImplements(source, ISource.ID)) {
      opt_to = /** @type {ISource} */ (source).persist(opt_to);
    }

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    if (config['id'] != null) {
      this.setId(config['id']);
    }

    if (config['enabled'] != null) {
      this.setEnabled(config['enabled']);
    }

    var styleConf = StyleManager.getInstance().getOrCreateLayerConfig(this.getId());

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

    var color = config[StyleField.COLOR];
    if (color) {
      osStyle.setConfigColor(styleConf, osStyle.toRgbaString(color));
    }

    var fillColor = config[StyleField.FILL_COLOR];

    // if fill color is not defined, use the base color with default fill opacity
    if (!fillColor && color) {
      fillColor = toRgbArray(color);
      fillColor[3] = osStyle.DEFAULT_FILL_ALPHA;
    }

    if (fillColor) {
      // if a fill opacity is defined, override it in the color
      if (config[StyleField.FILL_OPACITY] != null) {
        fillColor = toRgbArray(fillColor);
        fillColor[3] = config[StyleField.FILL_OPACITY];
      }

      osStyle.setFillColor(styleConf, osStyle.toRgbaString(fillColor));
    }

    if (config[StyleField.REPLACE_STYLE] != null) {
      styleConf[StyleField.REPLACE_STYLE] = config[StyleField.REPLACE_STYLE];
    }

    if (config[StyleField.SIZE] != null) {
      osStyle.setConfigSize(styleConf, config[StyleField.SIZE]);
    }

    if (config[StyleField.LINE_DASH] != null) {
      osStyle.setConfigLineDash(styleConf, config[StyleField.LINE_DASH]);
    }

    if (config[StyleField.ICON] != null) {
      osStyle.setConfigIcon(styleConf, config[StyleField.ICON]);
    }

    if (config[StyleField.SHOW_ARROW] != null) {
      styleConf[StyleField.SHOW_ARROW] = config[StyleField.SHOW_ARROW];
    }

    if (config[StyleField.SHOW_ERROR] != null) {
      styleConf[StyleField.SHOW_ERROR] = config[StyleField.SHOW_ERROR];
    }

    if (config[StyleField.SHOW_ELLIPSE] != null) {
      styleConf[StyleField.SHOW_ELLIPSE] = config[StyleField.SHOW_ELLIPSE];
    }

    if (config[StyleField.SHOW_ELLIPSOIDS] != null) {
      styleConf[StyleField.SHOW_ELLIPSOIDS] = config[StyleField.SHOW_ELLIPSOIDS];
    }

    if (config[StyleField.SHOW_GROUND_REF] != null) {
      styleConf[StyleField.SHOW_GROUND_REF] = config[StyleField.SHOW_GROUND_REF];
    }

    if (config[StyleField.SHOW_ROTATION] != null) {
      styleConf[StyleField.SHOW_ROTATION] = config[StyleField.SHOW_ROTATION];
    }

    styleConf[StyleField.ARROW_SIZE] = config[StyleField.ARROW_SIZE] || osStyle.DEFAULT_ARROW_SIZE;
    styleConf[StyleField.ARROW_UNITS] = config[StyleField.ARROW_UNITS] || osStyle.DEFAULT_UNITS;
    styleConf[StyleField.LOB_COLUMN_LENGTH] = config[StyleField.LOB_COLUMN_LENGTH] ||
        osStyle.DEFAULT_LOB_LENGTH;
    styleConf[StyleField.LOB_LENGTH] = config[StyleField.LOB_LENGTH] || osStyle.DEFAULT_LOB_LENGTH;
    styleConf[StyleField.LOB_LENGTH_ERROR] = config[StyleField.LOB_LENGTH_ERROR] ||
        osStyle.DEFAULT_LOB_LENGTH_ERROR;
    styleConf[StyleField.LOB_LENGTH_TYPE] = config[StyleField.LOB_LENGTH_TYPE] ||
        osStyle.DEFAULT_LOB_LENGTH_TYPE;
    styleConf[StyleField.LOB_LENGTH_COLUMN] = config[StyleField.LOB_LENGTH_COLUMN] || '';
    styleConf[StyleField.LOB_LENGTH_ERROR_COLUMN] = config[StyleField.LOB_LENGTH_ERROR_COLUMN] || '';
    styleConf[StyleField.LOB_BEARING_COLUMN] = config[StyleField.LOB_BEARING_COLUMN] || '';
    styleConf[StyleField.LOB_LENGTH_ERROR_UNITS] = config[StyleField.LOB_LENGTH_ERROR_UNITS] ||
        osStyle.DEFAULT_UNITS;
    styleConf[StyleField.LOB_LENGTH_UNITS] = config[StyleField.LOB_LENGTH_UNITS] ||
        osStyle.DEFAULT_UNITS;
    styleConf[StyleField.LOB_BEARING_ERROR] = config[StyleField.LOB_BEARING_ERROR] ||
        osStyle.DEFAULT_LOB_BEARING_ERROR;
    styleConf[StyleField.LOB_BEARING_ERROR_COLUMN] = config[StyleField.LOB_BEARING_ERROR_COLUMN] || '';
    styleConf[StyleField.ROTATION_COLUMN] = config[StyleField.ROTATION_COLUMN] || '';
    styleConf[StyleField.LABELS] = config[StyleField.LABELS] || [cloneConfig()];
    styleConf[StyleField.LABEL_COLOR] = config[StyleField.LABEL_COLOR];
    styleConf[StyleField.LABEL_SIZE] = config[StyleField.LABEL_SIZE] || DEFAULT_SIZE;
    styleConf[StyleField.SHOW_LABELS] = config[StyleField.SHOW_LABELS] || false;

    var source = /** @type {IPersistable} */ (this.getSource());
    if (source && osImplements(source, ISource.ID)) {
      /** @type {ISource} */ (source).restore(config);
    }
  }

  /**
   * Handles double clicks on features by popping up a window to display feature metadata.
   *
   * @param {Feature} feature *
   * @this Vector
   */
  static defaultDoubleClickHandler(feature) {
    if (feature) {
      // look for a title on the feature, otherwise use the layer title
      var title = getTitle(feature) || this.getTitle();
      launchMultiFeatureInfo(feature, title);
    }
  }
}
osImplements(Vector, ILayer.ID);
osImplements(Vector, IGroupable.ID);
osImplements(Vector, IFilterable.ID);
osImplements(Vector, ILegendRenderer.ID);

/**
 * Class name
 * @type {string}
 * @deprecated Please use LayerClass.VECTOR.
 */
Vector.NAME = LayerClass.VECTOR;
registerClass(LayerClass.VECTOR, Vector);

exports = Vector;

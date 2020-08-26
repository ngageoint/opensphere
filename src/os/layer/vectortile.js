goog.module('os.layer.VectorTile');
goog.module.declareLegacyNamespace();

const {assert} = goog.require('goog.asserts');
const GoogEventType = goog.require('goog.events.EventType');
const {getRandomString} = goog.require('goog.string');

const VectorImageTile = goog.require('ol.VectorImageTile');
const events = goog.require('ol.events');
const olExtent = goog.require('ol.extent');
const Property = goog.require('ol.layer.Property');
const VectorTileLayer = goog.require('ol.layer.VectorTile');
const VectorTileLayerRenderer = goog.require('ol.renderer.canvas.VectorTileLayer');
const TileImageSource = goog.require('ol.source.TileImage');
const UrlTileSource = goog.require('ol.source.UrlTile');

const IGroupable = goog.require('os.IGroupable');
const ActionEventType = goog.require('os.action.EventType');
const osColor = goog.require('os.color');
const LayerEvent = goog.require('os.events.LayerEvent');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {reduceExtentFromLayers} = goog.require('os.fn');
const osImplements = goog.require('os.implements');
const layer = goog.require('os.layer');
const ExplicitLayerType = goog.require('os.layer.ExplicitLayerType');
const IColorableLayer = goog.require('os.layer.IColorableLayer');
const ILayer = goog.require('os.layer.ILayer');
const LayerType = goog.require('os.layer.LayerType');
const LayerPropertyChange = goog.require('os.layer.PropertyChange');
const TileLayer = goog.require('os.layer.Tile');
const {MAX_ZOOM, MIN_ZOOM, PROJECTION} = goog.require('os.map');
const math = goog.require('os.math');
const registerClass = goog.require('os.registerClass');
const SourcePropertyChange = goog.require('os.source.PropertyChange');
const {isStateFile} = goog.require('os.state');
const osStyle = goog.require('os.style');
const TimeInstant = goog.require('os.time.TimeInstant');
const ui = goog.require('os.ui');
const Icons = goog.require('os.ui.Icons');
const renamelayer = goog.require('os.ui.renamelayer');
const tile = goog.requireType('os.tile');

const OLLayer = goog.requireType('ol.layer.Layer');


/**
 * OpenSphere vector tile layer.
 *
 * @implements {ILayer}
 * @implements {IColorableLayer}
 * @implements {IGroupable}
 */
class VectorTile extends VectorTileLayer {
  /**
   * Constructor.
   * @param {olx.layer.VectorTileOptions} options Tile layer options
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
    this.osType_ = LayerType.TILES;

    /**
     * @type {string}
     * @private
     */
    this.explicitType_ = ExplicitLayerType.TILES;

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
    this.syncType_ = layer.SynchronizerType.TILE;

    /**
     * @type {boolean}
     * @private
     */
    this.hidden_ = false;

    /**
     * @type {tile.TileFilterFn}
     * @private
     */
    this.colorFilter_ = TileLayer.applyColors.bind(this);

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
      events.listen(source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
    }

    /**
     * @type {!VectorTileLayerRenderer}
     * @private
     */
    this.renderer_ = new VectorTileLayerRenderer(this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var source = this.getSource();
    if (source) {
      source.dispose();
    }
  }

  /**
   * @inheritDoc
   */
  setMinResolution(value) {
    var source = this.getSource();
    if (source) {
      // If you don't suppress the event for this set, you'll get an infinite, asynchronous
      // loop with the layer UI. Debugging that was fun. Like "shaving your head with a cheese
      // grater" fun.
      source.suppressEvents();
      source.set(Property.MIN_RESOLUTION, value);
      source.enableEvents();
    }

    super.setMinResolution(value);
  }

  /**
   * @inheritDoc
   */
  setMaxResolution(value) {
    // OL3 treats max resolution as an exclusive value and we want it to be inclusive. determine value to add based on
    // the decimal precision, since it may vary by OS/browser.
    if (isFinite(value)) {
      var precision = math.precision(value);
      value = value + Math.pow(10, -precision);
    }

    var source = this.getSource();
    if (source) {
      // If you don't suppress the event for this set, you'll get an infinite, asynchronous
      // loop with the layer UI. Debugging that was fun. Like "shaving your head with a cheese
      // grater" fun.
      source.suppressEvents();
      source.set(Property.MAX_RESOLUTION, value);
      source.enableEvents();
    }

    super.setMaxResolution(value);
  }

  /**
   * Update icons to use the current layer color.
   *
   * @private
   */
  updateIcons_() {
    var color = this.getColor();
    if (color) {
      ui.adjustIconSet(this.getId(), osColor.toHexString(color));
    }
  }

  /**
   * Handler for source change events.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onSourcePropertyChange_(event) {
    if (event instanceof PropertyChangeEvent) {
      var p = event.getProperty();
      if (p == SourcePropertyChange.LOADING) {
        this.setLoading(/** @type {boolean} */ (event.getNewValue()));
      } else if (p == SourcePropertyChange.REFRESH_INTERVAL) {
        var e = new PropertyChangeEvent(LayerPropertyChange.REFRESH_INTERVAL, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
      }
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
    return this.groupId_ != null ? this.groupId_ : this.getId();
  }

  /**
   * @inheritDoc
   */
  getGroupLabel() {
    return this.groupLabel_ != null ? this.groupLabel_ : this.getTitle();
  }

  /**
   * Get the default color for the tile layer.
   *
   * @return {?string}
   */
  getDefaultColor() {
    if (this.layerOptions_) {
      return /** @type {string} */ (this.layerOptions_['baseColor']);
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getColor() {
    if (this.layerOptions_) {
      return /** @type {string} */ (this.layerOptions_['color'] || this.layerOptions_['baseColor']);
    }

    return null;
  }

  /**
   * Get the brightness for the tile layer.
   *
   * @return {number}
   * @override
   */
  getBrightness() {
    if (this.layerOptions_) {
      return /** @type {number} */ (this.layerOptions_['brightness'] || 0);
    }
    return 0;
  }

  /**
   * Get the brightness for the tile layer.
   *
   * @override
   * @return {number}
   */
  getContrast() {
    if (this.layerOptions_ && this.layerOptions_['contrast'] != null) {
      return /** @type {number} */ (this.layerOptions_['contrast']);
    }
    return 1;
  }

  /**
   * Get the saturation for the tile layer.
   *
   * @override
   * @return {number}
   */
  getSaturation() {
    if (this.layerOptions_ && this.layerOptions_['saturation'] != null) {
      return /** @type {number} */ (this.layerOptions_['saturation']);
    }
    return 1;
  }

  /**
   * Get the whether the tile layer is being colorized.
   *
   * @return {boolean}
   */
  getColorize() {
    if (this.layerOptions_) {
      return /** @type {boolean} */ (this.layerOptions_['colorize']) || false;
    }

    return false;
  }

  /**
   * Get the whether the tile layer is being colorized.
   *
   * @param {boolean} value
   */
  setColorize(value) {
    if (this.layerOptions_) {
      this.layerOptions_['colorize'] = value;
      this.updateColorFilter();

      osStyle.notifyStyleChange(this);
    }
  }

  /**
   * @inheritDoc
   */
  setColor(value, opt_options) {
    var options = opt_options || this.layerOptions_;
    if (options) {
      if (value && typeof value == 'string') {
        options['color'] = osColor.toHexString(value);
      } else {
        // color was reset, so use the original
        options['color'] = null;
      }

      this.updateColorFilter();
      this.updateIcons_();

      osStyle.notifyStyleChange(this);
    }
  }

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
  setBrightness(value, opt_options) {
    assert(value >= -1 && value <= 1, 'brightness is not between -1 and 1');
    super.setBrightness(value);
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['brightness'] = value;
      this.updateColorFilter();
      this.updateIcons_();
      osStyle.notifyStyleChange(this);
    }
  }

  /**
   * Adjust the layer contrast.  A value of 0 will render the layer completely
   * grey.  A value of 1 will leave the contrast unchanged.  Other values are
   * linear multipliers on the effect (and values over 1 are permitted).
   *
   * @override
   * @param {number} value The contrast of the layer (values clamped between 0 and 2)
   * @param {Object=} opt_options The layer options to use
   */
  setContrast(value, opt_options) {
    assert(value >= 0 && value <= 2, 'contrast is not between 0 and 2');
    super.setContrast(value);
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['contrast'] = value;
      this.updateColorFilter();
      this.updateIcons_();
      osStyle.notifyStyleChange(this);
    }
  }

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
  setSaturation(value, opt_options) {
    assert(value >= 0, 'saturation is greater than 0');
    super.setSaturation(value);
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['saturation'] = value;
      this.updateColorFilter();
      this.updateIcons_();
      osStyle.notifyStyleChange(this);
    }
  }

  /**
   * Updates the color filter, either adding or removing depending on whether the layer is colored to a non-default
   * color or colorized.
   *
   * @protected
   */
  updateColorFilter() {
    var source = this.getSource();
    if (source instanceof TileImageSource) {
      if (this.getColorize() || !osColor.equals(this.getColor(), this.getDefaultColor()) ||
          this.getBrightness() != 0 || this.getContrast() != 1 || this.getSaturation() != 1) {
        // put the colorFilter in place if we are colorized or the current color is different from the default
        source.addTileFilter(this.colorFilter_);
      } else {
        source.removeTileFilter(this.colorFilter_);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    var color;

    var html = '';
    if (this.error_) {
      html += '<i class="fa fa-warning text-warning" title="There were errors accessing the tiles for this layer"></i>';
    }

    var layerColor = this.getColor();
    if (layerColor) {
      color = osColor.toRgbArray(layerColor);
    }

    html += color ? ui.createIconSet(this.getId(), this.getSVGIconsInternal(), this.getStateBadge(), color)
      : this.getIconsInternal();
    return html;
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getStateBadge() {
    if (isStateFile(this.getId())) {
      return [Icons.STATE];
    } else {
      return null;
    }
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getSVGIconsInternal() {
    return [ui.IconsSVG.TILES];
  }

  /**
   * @return {string}
   * @protected
   */
  getIconsInternal() {
    return Icons.TILES;
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    // Layer does not have separate enabled/visible states, so this is a pass-through.
    return this.getLayerVisible();
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    // Layer does not have separate enabled/visible states, so this is a pass-through.
    this.setLayerVisible(value);
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
      this.dispatchEvent(new PropertyChangeEvent(LayerPropertyChange.LOADING, value, old));

      var source = this.getSource();
      if (source instanceof UrlTileSource) {
        var error = source.hasError();

        if (error !== this.error_) {
          this.error_ = error;
          this.dispatchEvent(new PropertyChangeEvent(LayerPropertyChange.ERROR, this.error_, !this.error_));
        }
      }
    }
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
    this.title_ = value;
    this.dispatchEvent(new PropertyChangeEvent(LayerPropertyChange.TITLE, value));
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
   * @return {boolean} Whether or not the layer is in error
   */
  getError() {
    return this.error_;
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
   * @inheritDoc
   */
  getNodeUI() {
    return this.nodeUI_;
  }

  /**
   * @inheritDoc
   */
  setNodeUI(value) {
    this.nodeUI_ = value;
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
   * Identify the layer on the map.
   *
   * @protected
   */
  identify() {
    layer.identifyLayer(this);
  }

  /**
   * @inheritDoc
   */
  getLayerVisible() {
    return this.getVisible();
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    if (value !== this.getLayerVisible()) {
      this.setVisible(value);
      this.dispatchEvent(new PropertyChangeEvent(LayerPropertyChange.VISIBLE, value, !value));
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
  getLayerOptions() {
    return this.layerOptions_;
  }

  /**
   * @inheritDoc
   */
  setLayerOptions(value) {
    this.layerOptions_ = value;

    // reapply the color filter as changing the layerOptions can change the layer color/colorize
    this.updateColorFilter();
  }

  /**
   * @inheritDoc
   */
  callAction(type) {
    var source = this.getSource();

    if (os.action) {
      switch (type) {
        case ActionEventType.IDENTIFY:
          this.identify();
          break;
        case ActionEventType.MOST_RECENT:
          os.dataManager.setTimeFromDescriptor(this.getId());
          break;
        case ActionEventType.REFRESH:
          source.refresh();
          break;
        case ActionEventType.REMOVE_LAYER:
          var removeEvent = new LayerEvent(LayerEventType.REMOVE, this.getId());
          os.dispatcher.dispatchEvent(removeEvent);
          break;
        case ActionEventType.RENAME:
          renamelayer.launchRenameDialog(this);
          break;
        default:
          break;
      }
    }
  }

  /**
   * @inheritDoc
   */
  getGroupUI() {
    return null;
  }

  /**
   * @inheritDoc
   * @see {ui.action.IActionTarget}
   */
  supportsAction(type, opt_actionArgs) {
    if (os.action) {
      switch (type) {
        case ActionEventType.GOTO:
          var projExtent = PROJECTION.getExtent();
          var layerExtent = reduceExtentFromLayers(/** @type {!ol.Extent} */ (olExtent.createEmpty()), this);
          var projArea = olExtent.getArea(projExtent);
          var layerArea = olExtent.getArea(layerExtent);
          return !olExtent.isEmpty(layerExtent) && layerArea / projArea < 0.8;
        case ActionEventType.IDENTIFY:
        case ActionEventType.REFRESH:
        case ActionEventType.SHOW_DESCRIPTION:
          return true;
        case ActionEventType.RENAME:
          return Array.isArray(opt_actionArgs) && opt_actionArgs.length === 1;
        case ActionEventType.MOST_RECENT:
          // only enable if descriptor exists and max date is greater than 0
          var desc = os.dataManager.getDescriptor(this.getId());
          if (desc != null) {
            var maxDate = desc.getMaxDate();
            return maxDate > 0 && maxDate < TimeInstant.MAX_TIME;
          }

          break;
        case ActionEventType.REMOVE_LAYER:
          return this.isRemovable();
        default:
          break;
      }
    }

    return false;
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
  persist(opt_to) {
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

    opt_to['maxZoom'] = Math.min(MAX_ZOOM, tilegrid.getZForResolution(this.getMinResolution()) - offset);
    opt_to['minZoom'] = Math.max(MIN_ZOOM, tilegrid.getZForResolution(this.getMaxResolution()) - offset);

    var source = this.getSource();
    if (source && source instanceof UrlTileSource) {
      opt_to['refreshInterval'] = source.getRefreshInterval();
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
      if (source && source instanceof UrlTileSource) {
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
  }

  /**
   * @return {!VectorTileLayerRenderer}
   */
  getRenderer() {
    return this.renderer_;
  }

  /**
   * The class name.
   * @type {string}
   */
  static get NAME() {
    return 'os.layer.VectorTile';
  }
}

// Register interfaces
osImplements(VectorTile, ILayer.ID);
osImplements(VectorTile, IColorableLayer.ID);
osImplements(VectorTile, IGroupable.ID);

// Register class
registerClass(VectorTile.NAME, VectorTile);

// Mixins

/**
 * OpenLayers does not actually draw inside the vector tiles. Rather, those
 * tiles are rendered by the vector tile renderer later. This is problematic
 * because the OpenLayers renderers do not run when syncing to a WebGL context.
 *
 * This override copies the main tile drawing logic from the VectorTile canvas
 * renderer and runs it immediately if the `getImage` method returns nothing.
 *
 * @param {OLLayer} layer
 * @return {HTMLCanvasElement} Canvas.
 * @suppress {visibility}
 */
VectorImageTile.prototype.getDrawnImage = function(layer) {
  let canvas = this.getImage(layer);

  if (!canvas && layer instanceof VectorTile) {
    const frameState = os.map.mapContainer.getMap().frameState_;
    if (frameState) {
      const renderer = layer.getRenderer();

      renderer.createReplayGroup_(this, frameState);
      renderer.renderTileImage_(this, frameState, /** @type {ol.LayerState} */ ({}));

      canvas = this.getImage(layer);
    }
  }

  return canvas;
};

exports = VectorTile;

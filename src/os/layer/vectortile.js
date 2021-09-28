goog.module('os.layer.VectorTile');

goog.require('os.ui.layer.DefaultLayerUI');

const GoogEventType = goog.require('goog.events.EventType');
const {getRandomString} = goog.require('goog.string');

const {DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM} = goog.require('ol');
const events = goog.require('ol.events');
const olExtent = goog.require('ol.extent');
const Property = goog.require('ol.layer.Property');
const VectorTileLayer = goog.require('ol.layer.VectorTile');
const VectorTileLayerRenderer = goog.require('ol.renderer.canvas.VectorTileLayer');
const UrlTileSource = goog.require('ol.source.UrlTile');

const {dispatcher} = goog.require('os');
const IGroupable = goog.require('os.IGroupable');
const ActionEventType = goog.require('os.action.EventType');
const LayerEvent = goog.require('os.events.LayerEvent');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {reduceExtentFromLayers} = goog.require('os.fn');
const osImplements = goog.require('os.implements');
const {identifyLayer} = goog.require('os.layer');
const ExplicitLayerType = goog.require('os.layer.ExplicitLayerType');
const ILayer = goog.require('os.layer.ILayer');
const LayerType = goog.require('os.layer.LayerType');
const LayerPropertyChange = goog.require('os.layer.PropertyChange');
const SynchronizerType = goog.require('os.layer.SynchronizerType');
const osMap = goog.require('os.map');
const math = goog.require('os.math');
const registerClass = goog.require('os.registerClass');
const SourcePropertyChange = goog.require('os.source.PropertyChange');
const {isStateFile} = goog.require('os.state');
const {default: Icons} = goog.require('os.ui.Icons');
const {default: IconsSVG} = goog.require('os.ui.IconsSVG');
const {directiveTag: nodeUi} = goog.require('os.ui.node.DefaultLayerNodeUI');
const renamelayer = goog.require('os.ui.renamelayer');


/**
 * OpenSphere vector tile layer.
 *
 * @implements {ILayer}
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
    this.osType_ = LayerType.VECTOR_TILES;

    /**
     * @type {string}
     * @private
     */
    this.explicitType_ = ExplicitLayerType.VECTOR_TILES;

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
    this.nodeUI_ = `<${nodeUi}></${nodeUi}>`;

    /**
     * @type {!string}
     * @private
     */
    this.layerUi_ = 'defaultlayerui';

    /**
     * @type {?string}
     * @private
     */
    this.syncType_ = SynchronizerType.VECTOR_TILE;

    /**
     * @type {boolean}
     * @private
     */
    this.hidden_ = false;

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
   * @inheritDoc
   */
  getIcons() {
    var html = '';
    if (this.error_) {
      html += '<i class="fa fa-warning text-warning" title="There were errors accessing the tiles for this layer"></i>';
    }

    html += this.getIconsInternal();
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
    return [IconsSVG.TILES];
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
    identifyLayer(this);
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
  }

  /**
   * @inheritDoc
   */
  callAction(type) {
    var source = this.getSource();
    if (source) {
      switch (type) {
        case ActionEventType.IDENTIFY:
          this.identify();
          break;
        case ActionEventType.REFRESH:
          source.refresh();
          break;
        case ActionEventType.REMOVE_LAYER:
          var removeEvent = new LayerEvent(LayerEventType.REMOVE, this.getId());
          dispatcher.dispatchEvent(removeEvent);
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
    switch (type) {
      case ActionEventType.GOTO:
        var projExtent = osMap.PROJECTION.getExtent();
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
      case ActionEventType.REMOVE_LAYER:
        return this.isRemovable();
      default:
        break;
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
    opt_to['groupId'] = this.getGroupId();
    opt_to['groupLabel'] = this.getGroupLabel();

    // we now store min and max zoom rather than resolution because the resolutions can change
    // drastically if the user or admin switches the default projection (resulting in the layer
    // being basically invisible)
    var tilegrid = this.getSource().getTileGrid();

    var config = this.getLayerOptions();
    var offset = /** @type {number} */ (config ? config['zoomOffset'] || 0 : 0);

    opt_to['maxZoom'] = Math.min(DEFAULT_MAX_ZOOM, tilegrid.getZForResolution(this.getMinResolution()) - offset);
    opt_to['minZoom'] = Math.max(DEFAULT_MIN_ZOOM, tilegrid.getZForResolution(this.getMaxResolution()) - offset);

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

    if (config['minZoom'] != null) {
      // Max resolution depends directly on the layer's tile grid. This ensures tiles are not requested until the first
      // supported zoom level.
      const offset = config['zoomOffset'] || 0;
      const grid = this.getSource().getTileGrid();
      const tgMin = grid.getMinZoom();
      const tgMax = grid.getMaxZoom();

      const z = Math.min(tgMax, Math.max(tgMin, Math.round(config['minZoom']) + offset));
      this.setMaxResolution(grid.getResolution(z));
    }

    // Vector tiles can be rendered at higher zoom levels using data from previous levels. Setting maxZoom will only
    // impact when tiles will no longer be requested from the service.
    this.setMinResolution(0);
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

// Register class/interfaces
registerClass(VectorTile.NAME, VectorTile);
osImplements(VectorTile, ILayer.ID);
osImplements(VectorTile, IGroupable.ID);

exports = VectorTile;

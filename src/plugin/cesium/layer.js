goog.declareModuleId('plugin.cesium.Layer');

import OLLayer from 'ol/src/layer/Layer.js';
import ActionEventType from '../../os/action/eventtype.js';
import * as osColor from '../../os/color.js';
import * as dispatcher from '../../os/dispatcher.js';
import LayerEvent from '../../os/events/layerevent.js';
import LayerEventType from '../../os/events/layereventtype.js';
import PropertyChangeEvent from '../../os/events/propertychangeevent.js';
import IGroupable from '../../os/igroupable.js';
import osImplements from '../../os/implements.js';
import IColorableLayer from '../../os/layer/icolorablelayer.js';
import ILayer from '../../os/layer/ilayer.js';
import PropertyChange from '../../os/layer/propertychange.js';
import MapChange from '../../os/map/mapchange.js';
import MapContainer from '../../os/mapcontainer.js';
import {DEFAULT_LAYER_COLOR, notifyStyleChange} from '../../os/style/style.js';
import {adjustIconSet, createIconSet} from '../../os/ui/icons/index.js';
import {directiveTag as nodeUi} from '../../os/ui/node/defaultlayernodeui.js';

const Delay = goog.require('goog.async.Delay');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const googString = goog.require('goog.string');


/**
 * The logger.
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.cesium.Layer');


/**
 * @implements {ILayer}
 * @implements {IColorableLayer}
 * @implements {IGroupable}
 */
export default class Layer extends OLLayer {
  /**
   * Constructor.
   */
  constructor() {
    super({});

    /**
     * @type {!string}
     * @private
     */
    this.id_ = googString.getRandomString();

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
    this.nodeUI_ = `<${nodeUi}></${nodeUi}>`;

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
     * @type {?Delay}
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

    /**
     * The logger.
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    // set the openlayers type to something that won't find a renderer, because there's
    // no way to render Cesium-specific items in OpenLayers anyway
    this.type = /** @type {LayerType} */ ('cesium');

    /**
     * @type {string}
     * @private
     */
    this.error = '';

    MapContainer.getInstance().listen(GoogEventType.PROPERTYCHANGE, this.onMapChange, false, this);

    // allow extending classes to finish initializing before trying to sync
    setTimeout(this.synchronize.bind(this), 0);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    MapContainer.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.onMapChange, false, this);

    if (this.loadingDelay_) {
      this.loadingDelay_.dispose();
      this.loadingDelay_ = null;
    }
  }

  /**
   * Handle map change events.
   *
   * @param {PropertyChangeEvent} event The event.
   * @protected
   */
  onMapChange(event) {
    if (event && event.getProperty() === MapChange.VIEW3D) {
      this.synchronize();
    }
  }

  /**
   * Test if Cesium is enabled and synchronize with Cesium.
   *
   * @protected
   */
  synchronize() {
    this.updateError();
  }

  /**
   * Update the error message for the layer.
   *
   * @protected
   */
  updateError() {
    var oldError = this.error;
    this.error = this.getErrorMessage();

    if (oldError != this.error) {
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ERROR, this.error, oldError));
    }
  }

  /**
   * Get the error message to display on the layer.
   *
   * @return {string} The message.
   * @protected
   */
  getErrorMessage() {
    if (!window.Cesium || !MapContainer.getInstance().is3DEnabled()) {
      return 'This layer is only visible in 3D mode';
    }

    return '';
  }

  /**
   * @return {boolean}
   */
  hasError() {
    return !!this.error;
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
   * Get the default color for the layer.
   *
   * @return {?string}
   */
  getDefaultColor() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getColor() {
    var color;
    if (this.layerOptions_) {
      color = /** @type {string} */ (this.layerOptions_['color'] || this.layerOptions_['baseColor']);
    }

    return color || DEFAULT_LAYER_COLOR;
  }

  /**
   * @inheritDoc
   */
  setColor(value, opt_options) {
    var options = this.layerOptions_ || opt_options;
    if (options) {
      if (value && typeof value == 'string') {
        options['color'] = osColor.toHexString(value);
      } else {
        // color was reset, so use the original
        options['color'] = null;
      }

      this.updateIcons_();

      notifyStyleChange(this);
    }
  }

  /**
   * Update icons to use the current layer color.
   *
   * @private
   */
  updateIcons_() {
    var color = this.getColor();
    if (color) {
      adjustIconSet(this.getId(), osColor.toHexString(color));
    }
  }

  /**
   * @return {?(string|osx.ogc.TileStyle)}
   */
  getStyle() {
    return null;
  }

  /**
   * @param {?(string|osx.ogc.TileStyle)} value
   */
  setStyle(value) {
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    var color;

    var html = '';
    if (this.hasError()) {
      html += '<i class="fa fa-warning text-warning" title="' + this.error + '"></i>';
    }

    var layerColor = this.getColor();
    if (layerColor) {
      color = osColor.toRgbArray(layerColor);
    }

    html += color ? createIconSet(this.getId(), null, [this.icons_], color) : this.icons_;
    return html;
  }

  /**
   * @param {string} value
   */
  setIcons(value) {
    this.icons_ = value;
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
  }

  /**
   * @return {?Delay}
   * @protected
   */
  getLoadingDelay() {
    if (!this.loadingDelay_ && !this.isDisposed()) {
      this.loadingDelay_ = new Delay(this.fireLoadingEvent_, 500, this);
    }

    return this.loadingDelay_;
  }

  /**
   * Fires an event to indicate a loading change.
   *
   * @private
   */
  fireLoadingEvent_() {
    if (!this.isDisposed()) {
      this.dispatchEvent(new PropertyChangeEvent('loading', this.loading_, !this.loading_));
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
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TITLE, value));
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
   * @return {!function(!OLLayer)}
   */
  getRefreshFunction() {
    return () => {};
  }

  /**
   * @param {!function(!OLLayer)} refreshFunction
   */
  setRefreshFunction(refreshFunction) {
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
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.VISIBLE, value, !value));
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
    switch (type) {
      case ActionEventType.REMOVE_LAYER:
        var removeEvent = new LayerEvent(LayerEventType.REMOVE, this.getId());
        dispatcher.getInstance().dispatchEvent(removeEvent);
        break;
      default:
        break;
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
   * @see {IActionTarget}
   */
  supportsAction(type, opt_actionArgs) {
    switch (type) {
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
    return null;
  }

  /**
   * @inheritDoc
   */
  setSynchronizerType(value) {}

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
    opt_to['visible'] = this.getVisible();
    opt_to['opacity'] = this.getOpacity();
    opt_to['color'] = this.getColor();
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

    if (config['visible'] != undefined) {
      this.setLayerVisible(!!config['visible']);
    }

    if (config['color']) {
      var color = /** @type {string} */ (config['color']);
      this.setColor(color, config);
    }

    var opacity = config['opacity'];
    if (opacity != null) {
      this.setOpacity(opacity);
    }
  }

  /**
   * @inheritDoc
   */
  getLayerStatesArray() {
    return [];
  }

  /**
   * @return {Cesium.Scene|undefined}
   * @protected
   */
  getScene() {
    if (MapContainer.getInstance()) {
      var renderer = MapContainer.getInstance().getWebGLRenderer();
      if (renderer) {
        return /** @type {CesiumRenderer} */ (renderer).getCesiumScene();
      }
    }

    return undefined;
  }

  /**
   * Decrements loading
   */
  decrementLoading() {
    this.loadCount_ = Math.max(this.loadCount_ - 1, 0);

    if (this.loadCount_ === 0) {
      this.setLoading(false);
    }
  }

  /**
   * Increments loading
   */
  incrementLoading() {
    this.loadCount_++;

    if (this.loadCount_ === 1) {
      this.setLoading(true);
    }
  }

  /**
   * Identify the layer on the map.
   * @protected
   */
  identify() {}

  /**
   * Forces the layer to refresh.
   * @protected
   */
  refresh() {}
}

osImplements(Layer, ILayer.ID);
osImplements(Layer, IColorableLayer.ID);
osImplements(Layer, IGroupable.ID);

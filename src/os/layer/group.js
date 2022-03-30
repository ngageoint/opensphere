goog.declareModuleId('os.layer.Group');

import CollectionEventType from 'ol/src/CollectionEventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import OLLayerGroup from 'ol/src/layer/Group.js';
import Layer from 'ol/src/layer/Layer.js';

import LayerEvent from '../events/layerevent.js';
import LayerEventType from '../events/layereventtype.js';

/**
 * Adds priority support and a function that checks if a layer belongs in this group
 */
export default class Group extends OLLayerGroup {
  /**
   * Constructor.
   * @param {olx.layer.GroupOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);

    /**
     * @type {number}
     * @private
     */
    this.priority_ = 0;

    /**
     * @type {?function(!Layer):!boolean}
     * @private
     */
    this.checkFunc_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.osType_ = null;

    this.addListenKey = null;
    this.removeListenKey = null;

    var layers = this.getLayers();
    if (layers) {
      this.addListenKey = listen(layers, CollectionEventType.ADD, this.onLayerAdded, this);
      this.removeListenKey = listen(layers, CollectionEventType.REMOVE, this.onLayerRemoved, this);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var oldLayers = this.getLayers();
    if (oldLayers) {
      unlistenByKey(this.addListenKey);
      unlistenByKey(this.removeListenKey);
    }
  }

  /**
   * @inheritDoc
   */
  setLayers(layers) {
    var oldLayers = this.getLayers();
    if (oldLayers) {
      unlistenByKey(this.addListenKey);
      unlistenByKey(this.removeListenKey);
    }

    if (layers) {
      this.addListenKey = listen(layers, CollectionEventType.ADD, this.onLayerAdded, this);
      this.removeListenKey = listen(layers, CollectionEventType.REMOVE, this.onLayerRemoved, this);
    }

    super.setLayers(layers);
  }

  /**
   * Gets the priority of the group
   *
   * @return {number}
   */
  getPriority() {
    return this.priority_;
  }

  /**
   * Sets the priority of the group. Lower values are lower in the layer stack.
   *
   * @param {number} value
   */
  setPriority(value) {
    this.priority_ = value;
  }

  /**
   * Gets the check function
   *
   * @return {?function(!Layer):boolean}
   */
  getCheckFunc() {
    return this.checkFunc_;
  }

  /**
   * Sets the check function
   *
   * @param {?function(!Layer):boolean} value
   */
  setCheckFunc(value) {
    this.checkFunc_ = value;
  }

  /**
   * Gets the type
   *
   * @return {?string}
   */
  getOSType() {
    return this.osType_;
  }

  /**
   * Sets the group type
   *
   * @param {string} value
   */
  setOSType(value) {
    this.osType_ = value;
  }

  /**
   * Handle a layer being added to the group.
   *
   * @param {Collection.Event} event
   * @protected
   */
  onLayerAdded(event) {
    if (event.element instanceof Layer) {
      var layerEvent = new LayerEvent(LayerEventType.ADD, event.element);
      this.dispatchEvent(layerEvent);
    }
  }

  /**
   * Handle a layer being removed from the group.
   *
   * @param {Collection.Event} event
   * @protected
   */
  onLayerRemoved(event) {
    if (event.element instanceof Layer) {
      var layerEvent = new LayerEvent(LayerEventType.REMOVE, event.element);
      this.dispatchEvent(layerEvent);
    }
  }
}

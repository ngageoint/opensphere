goog.module('os.layer.Group');
goog.module.declareLegacyNamespace();

const CollectionEventType = goog.require('ol.CollectionEventType');
const {listen, unlisten} = goog.require('ol.events');
const OLLayerGroup = goog.require('ol.layer.Group');
const Layer = goog.require('ol.layer.Layer');
const LayerEvent = goog.require('os.events.LayerEvent');
const LayerEventType = goog.require('os.events.LayerEventType');

const Collection = goog.requireType('ol.Collection');


/**
 * Adds priority support and a function that checks if a layer belongs in this group
 */
class Group extends OLLayerGroup {
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

    var layers = this.getLayers();
    if (layers) {
      listen(layers, CollectionEventType.ADD, this.onLayerAdded, this);
      listen(layers, CollectionEventType.REMOVE, this.onLayerRemoved, this);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var oldLayers = this.getLayers();
    if (oldLayers) {
      unlisten(oldLayers, CollectionEventType.ADD, this.onLayerAdded, this);
      unlisten(oldLayers, CollectionEventType.REMOVE, this.onLayerRemoved, this);
    }
  }

  /**
   * @inheritDoc
   */
  setLayers(layers) {
    var oldLayers = this.getLayers();
    if (oldLayers) {
      unlisten(oldLayers, CollectionEventType.ADD, this.onLayerAdded, this);
      unlisten(oldLayers, CollectionEventType.REMOVE, this.onLayerRemoved, this);
    }

    if (layers) {
      listen(layers, CollectionEventType.ADD, this.onLayerAdded, this);
      listen(layers, CollectionEventType.REMOVE, this.onLayerRemoved, this);
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

exports = Group;

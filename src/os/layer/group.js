goog.provide('os.layer.Group');

goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.events');
goog.require('ol.layer.Group');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');



/**
 * Adds priority support and a function that checks if a layer belongs in this group
 * @param {olx.layer.GroupOptions=} opt_options
 * @extends {ol.layer.Group}
 * @constructor
 */
os.layer.Group = function(opt_options) {
  os.layer.Group.base(this, 'constructor', opt_options);

  /**
   * @type {number}
   * @private
   */
  this.priority_ = 0;

  /**
   * @type {?function(!ol.layer.Layer):!boolean}
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
    ol.events.listen(layers, ol.CollectionEventType.ADD, this.onLayerAdded, this);
    ol.events.listen(layers, ol.CollectionEventType.REMOVE, this.onLayerRemoved, this);
  }
};
goog.inherits(os.layer.Group, ol.layer.Group);


/**
 * @inheritDoc
 */
os.layer.Group.prototype.disposeInternal = function() {
  os.layer.Group.base(this, 'disposeInternal');

  var oldLayers = this.getLayers();
  if (oldLayers) {
    ol.events.unlisten(oldLayers, ol.CollectionEventType.ADD, this.onLayerAdded, this);
    ol.events.unlisten(oldLayers, ol.CollectionEventType.REMOVE, this.onLayerRemoved, this);
  }
};


/**
 * @inheritDoc
 */
os.layer.Group.prototype.setLayers = function(layers) {
  var oldLayers = this.getLayers();
  if (oldLayers) {
    ol.events.unlisten(oldLayers, ol.CollectionEventType.ADD, this.onLayerAdded, this);
    ol.events.unlisten(oldLayers, ol.CollectionEventType.REMOVE, this.onLayerRemoved, this);
  }

  if (layers) {
    ol.events.listen(layers, ol.CollectionEventType.ADD, this.onLayerAdded, this);
    ol.events.listen(layers, ol.CollectionEventType.REMOVE, this.onLayerRemoved, this);
  }

  os.layer.Group.base(this, 'setLayers', layers);
};


/**
 * Gets the priority of the group
 * @return {number}
 */
os.layer.Group.prototype.getPriority = function() {
  return this.priority_;
};


/**
 * Sets the priority of the group. Lower values are lower in the layer stack.
 * @param {number} value
 */
os.layer.Group.prototype.setPriority = function(value) {
  this.priority_ = value;
};


/**
 * Gets the check function
 * @return {?function(!ol.layer.Layer):boolean}
 */
os.layer.Group.prototype.getCheckFunc = function() {
  return this.checkFunc_;
};


/**
 * Sets the check function
 * @param {?function(!ol.layer.Layer):boolean} value
 */
os.layer.Group.prototype.setCheckFunc = function(value) {
  this.checkFunc_ = value;
};


/**
 * Gets the type
 * @return {?string}
 */
os.layer.Group.prototype.getOSType = function() {
  return this.osType_;
};


/**
 * Sets the group type
 * @param {string} value
 */
os.layer.Group.prototype.setOSType = function(value) {
  this.osType_ = value;
};


/**
 * Handle a layer being added to the group.
 * @param {ol.Collection.Event} event
 * @protected
 */
os.layer.Group.prototype.onLayerAdded = function(event) {
  if (event.element instanceof ol.layer.Layer) {
    var layerEvent = new os.events.LayerEvent(os.events.LayerEventType.ADD, event.element);
    this.dispatchEvent(layerEvent);
  }
};


/**
 * Handle a layer being removed from the group.
 * @param {ol.Collection.Event} event
 * @protected
 */
os.layer.Group.prototype.onLayerRemoved = function(event) {
  if (event.element instanceof ol.layer.Layer) {
    var layerEvent = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, event.element);
    this.dispatchEvent(layerEvent);
  }
};

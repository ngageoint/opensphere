goog.provide('os.events.LayerEvent');
goog.provide('os.events.LayerEventType');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.events.LayerEventType = {
  ADD: 'addLayer',
  REMOVE: 'removeLayer',
  RENAME: 'renameLayer',
  MOVE: 'moveLayer',
  SYNC: 'syncLayer',
  IDENTIFY: 'identifyLayer',
  COLOR_CHANGE: 'layerColorChange',
  BASELAYER_CHANGE: 'baseLayerChange'
};



/**
 * @param {string} type
 * @param {ol.layer.Layer|string} layer
 * @param {number=} opt_index
 * @extends {goog.events.Event}
 * @constructor
 */
os.events.LayerEvent = function(type, layer, opt_index) {
  os.events.LayerEvent.base(this, 'constructor', type);

  /**
   * @type {ol.layer.Layer|string}
   */
  this.layer = layer;

  /**
   * @type {number}
   */
  this.index = goog.isDefAndNotNull(opt_index) ? opt_index : -1;
};
goog.inherits(os.events.LayerEvent, goog.events.Event);


/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|ol.events.EventTarget|undefined}
 * @suppress {duplicate}
 */
os.events.LayerEvent.prototype.target;

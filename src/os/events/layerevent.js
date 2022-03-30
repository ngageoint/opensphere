goog.declareModuleId('os.events.LayerEvent');

const GoogEvent = goog.require('goog.events.Event');

/**
 */
export default class LayerEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {ol.layer.Layer|string} layer
   * @param {number=} opt_index
   */
  constructor(type, layer, opt_index) {
    super(type);

    /**
     * @type {ol.layer.Layer|string}
     */
    this.layer = layer;

    /**
     * @type {number}
     */
    this.index = opt_index != null ? opt_index : -1;
  }
}

/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|OLEventTarget|undefined}
 * @suppress {duplicate}
 */
LayerEvent.prototype.target;

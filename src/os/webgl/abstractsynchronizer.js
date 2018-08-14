goog.provide('os.webgl.AbstractWebGLSynchronizer');

goog.require('goog.Disposable');


/**
 * Abstract class to synchronize an OpenLayers layer to a WebGL renderer.
 * @param {!T} layer The OpenLayers layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @extends {goog.Disposable}
 * @constructor
 * @template T
 */
os.webgl.AbstractWebGLSynchronizer = function(layer, map) {
  os.webgl.AbstractWebGLSynchronizer.base(this, 'constructor');

  /**
   * If the synchronizer is active (WebGL enabled).
   * @type {boolean}
   * @protected
   */
  this.active = false;

  /**
   * The OpenLayers layer.
   * @type {T}
   * @protected
   */
  this.layer = layer;

  /**
   * The OpenLayers map.
   * @type {!ol.PluggableMap}
   * @protected
   */
  this.map = map;

  /**
   * The OpenLayers view.
   * @type {ol.View}
   * @protected
   */
  this.view = map.getView();

  /**
   * The timeline controller instance.
   * @type {os.time.TimelineController}
   * @protected
   */
  this.tlc = os.time.TimelineController.getInstance();
};
goog.inherits(os.webgl.AbstractWebGLSynchronizer, goog.Disposable);


/**
 * Performs complete synchronization of the layer.
 */
os.webgl.AbstractWebGLSynchronizer.prototype.synchronize = goog.abstractMethod;


/**
 * Resets the synchronizer to a clean state.
 */
os.webgl.AbstractWebGLSynchronizer.prototype.reset = goog.abstractMethod;


/**
 * Set if the synchronizer should be actively used.
 * @param {boolean} value If the synchronizer is active.
 */
os.webgl.AbstractWebGLSynchronizer.prototype.setActive = function(value) {
  this.active = value;
};


/**
 * Repositions all layers, starting from the provided position.
 * @param {number} start The start index in the layers array.
 * @param {number} end The last index in the layers array.
 * @return {number} The next available index in the layers array.
 */
os.webgl.AbstractWebGLSynchronizer.prototype.reposition = function(start, end) {
  return ++start;
};


/**
 * Called after the WebGL camera finishes changing. Useful for synchronizers that need to perform actions once the
 * camera move is done and the render is finished.
 */
os.webgl.AbstractWebGLSynchronizer.prototype.updateFromCamera = goog.nullFunction;

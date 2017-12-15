goog.provide('os.olcs.sync.AbstractSynchronizer');
goog.require('goog.Disposable');



/**
 * @param {!T} layer
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @extends {goog.Disposable}
 * @constructor
 * @template T
 */
os.olcs.sync.AbstractSynchronizer = function(layer, map, scene) {
  /**
   * If the synchronizer is active (3D mode enabled).
   * @type {boolean}
   * @protected
   */
  this.active = false;

  /**
   * @type {T}
   * @protected
   */
  this.layer = layer;

  /**
   * @type {!ol.Map}
   * @protected
   */
  this.map = map;

  /**
   * @type {ol.View}
   * @protected
   */
  this.view = map.getView();

  /**
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;

  /**
   * @type {os.time.TimelineController}
   * @protected
   */
  this.tlc = os.time.TimelineController.getInstance();
};
goog.inherits(os.olcs.sync.AbstractSynchronizer, goog.Disposable);


/**
 * Performs complete synchronization of the layer.
 */
os.olcs.sync.AbstractSynchronizer.prototype.synchronize = goog.abstractMethod;


/**
 * Resets the synchronizer to a clean state.
 */
os.olcs.sync.AbstractSynchronizer.prototype.reset = goog.abstractMethod;


/**
 * Set if the synchronizer should be actively used.
 * @param {boolean} value
 */
os.olcs.sync.AbstractSynchronizer.prototype.setActive = function(value) {
  this.active = value;
};


/**
 * Repositions all layers on the scene, starting from the provided position.
 * @param {number} start The start index in the Cesium imagery layers array.
 * @param {number} end the last index in the array
 * @return {number} The next available index in the Cesium imagery layers array.
 */
os.olcs.sync.AbstractSynchronizer.prototype.reposition = function(start, end) {
  return ++start;
};


/**
 * Called after the Cesium camera finishes changing. Useful for synchronizers that need to perform actions once the
 * camera move is done and the render is finished.
 */
os.olcs.sync.AbstractSynchronizer.prototype.updateFromCamera = goog.nullFunction;

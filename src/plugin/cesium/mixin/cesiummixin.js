/**
 * @fileoverview mixins for Cesium
 * @suppress {missingProvide}
 */
goog.provide('plugin.cesium.mixin');


/**
 * Load Cesium mixins.
 * @throws {Error} If Cesium has not been loaded.
 */
plugin.cesium.mixin.loadCesiumMixins = function() {
  if (window.Cesium === undefined) {
    throw new Error('Cesium has not been loaded!');
  }

  /**
   * This "fixes" Cesium's lackluster crossOrigin support by setting crossOrigin on the image to an actual value.
   * Firefox will not be able to load tiles without this change.
   * @param {string} url
   * @param {boolean} crossOrigin
   * @param {*} deferred
   * @suppress {accessControls|duplicate}
   */
  Cesium.loadImage.createImage = function(url, crossOrigin, deferred) {
    var image = new Image();

    /**
     * @param {Event} e
     */
    image.onload = function(e) {
      deferred.resolve(image);
    };

    /**
     * @param {Event} e
     */
    image.onerror = function(e) {
      deferred.reject(e);
    };

    if (crossOrigin) {
      image.crossOrigin = os.net.getCrossOrigin(url);
    }

    image.src = url;
  };


  /**
   * @suppress {accessControls|duplicate}
   */
  Cesium.loadImage.defaultCreateImage = Cesium.loadImage.createImage;


  /**
   * @param {Cesium.Context} context
   * @param {number} key
   * @param {Cesium.Color} color
   * @constructor
   */
  Cesium.PickId = function(context, key, color) {
    /**
     * @type {?Cesium.Context}
     * @private
     */
    this.context_ = context;

    /**
     * @type {number}
     */
    this.key = key;

    /**
     * @type {Cesium.Color}
     */
    this.color = color;
  };

  Cesium.defineProperties(Cesium.PickId.prototype, {
    'object': {
      get:
          /**
           * @return {Object|undefined}
           * @this Cesium.PickId
           */
          function() {
            return this.context_.getPickObjects()[this.key];
          },
      set:
          /**
           * @param {Object} value
           * @this Cesium.PickId
           */
          function(value) {
            this.context_.getPickObjects()[this.key] = value;
          }
    }
  });


  /**
   * @return {undefined}
   */
  Cesium.PickId.prototype.destroy = function() {
    this.context_.getPickObjects()[this.key] = undefined;
    this.context_ = null;
    return undefined;
  };
  goog.exportProperty(Cesium.PickId.prototype, 'destroy', Cesium.PickId.prototype.destroy);


  /**
   * Remove undefined values from the pick id array.
   */
  Cesium.Context.prototype.cleanupPickIds = function() {
    this._pickObjects = os.object.prune(this._pickObjects);
  };


  /**
   * Gets pick objects reference.
   * @return {Object} [description]
   */
  Cesium.Context.prototype.getPickObjects = function() {
    return this._pickObjects;
  };


  /**
   * Creates a unique ID associated with the input object for use with color-buffer picking.
   * The ID has an RGBA color value unique to this context.  You must call destroy()
   * on the pick ID when destroying the input object.
   *
   * @param {Object} object The object to associate with the pick ID.
   * @return {Object} A PickId object with a <code>color</code> property.
   */
  Cesium.Context.prototype.createPickId = function(object) {
    if (!Cesium.defined(object)) {
      throw new Cesium.DeveloperError('object is required.');
    }

    // the increment and assignment have to be separate statements to
    // actually detect overflow in the Uint32 value
    ++this._nextPickColor[0];
    var key = this._nextPickColor[0];
    if (key === 0) {
      // In case of overflow
      throw new Cesium.RuntimeError('Out of unique Pick IDs.');
    }

    this._pickObjects[key] = object;
    return new Cesium.PickId(this, key, Cesium.Color.fromRgba(key));
  };
  goog.exportProperty(Cesium.Context.prototype, 'createPickId', Cesium.Context.prototype.createPickId);
};

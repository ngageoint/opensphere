/**
 * @fileoverview mixins for Cesium
 * @suppress {missingProvide}
 */
goog.module('plugin.cesium.mixin');

goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const MapEvent = goog.require('os.MapEvent');
const Request = goog.require('os.net.Request');


/**
 * Load Cesium mixins.
 *
 * @throws {Error} If Cesium has not been loaded.
 */
const loadCesiumMixins = function() {
  if (window.Cesium === undefined) {
    throw new Error('Cesium has not been loaded!');
  }

  const oldCreateImage = Cesium.Resource._Implementations.createImage;

  /**
   * Gets the port from a URL. Cesium requires passing a valid port to its TrustedServers API.
   * Returns 443 for https, 80 for http and everything else that isn't specified.
   * @param {URL} url The URL to get the port from.
   * @return {number} The port.
   */
  const getPort = (url) => {
    let port = parseInt(url.port, 10);

    if (isNaN(port) || port == null) {
      // if it's not specified, use 443 for https or 80 else
      port = url.protocol === 'https:' ? 443 : 80;
    }

    return port;
  };

  /**
   * This "fixes" Cesium's lackluster crossOrigin support by setting crossOrigin on the image to an actual value.
   * Firefox will not be able to load tiles without this change.
   *
   * @param {Cesium.ResourceFetchOptions} options
   * @param {boolean} crossOrigin
   * @param {Cesium.Promise} promise
   * @param {boolean} flipY
   * @param {boolean} preferImageBitmap
   *
   * @suppress {accessControls|duplicate}
   */
  Cesium.Resource._Implementations.createImage = (options, crossOrigin, promise, flipY, preferImageBitmap) => {
    let url = options.url || '';
    if (crossOrigin) {
      const osCrossOrigin = os.net.getCrossOrigin(url);
      if (osCrossOrigin != os.net.CrossOrigin.NONE) {
        url = new URL(url);
        Cesium.TrustedServers.add(url.hostname, getPort(url));
      }
    }

    oldCreateImage(options, crossOrigin, promise, flipY, preferImageBitmap);
  };


  /**
   * Hook Cesium into our request stack
   *
   * @param {Cesium.ResourceFetchOptions} options
   * @return {Cesium.Promise<*>}
   */
  Cesium.Resource.prototype._makeRequest = function(options) {
    var req = new Request(options.url || this.url);
    var headers = options.headers || this.headers;

    if (headers) {
      req.setHeaders(headers);
    }

    if (options.responseType) {
      req.setResponseType(options.responseType);
    }

    var deferred = Cesium.when.defer();

    req.getPromise().then(function(response) {
      deferred.resolve(response);
    }).thenCatch(function(reason) {
      deferred.reject(reason);
    }).thenAlways(function() {
      // The old olcs render loop fired a repaint when requests returned. While that shouldn't
      // be necessary with Cesium's new explicit rendering, there are still cases like async
      // Billboard/Icon loading which do not appear to be triggering a render request.
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    });

    return deferred.promise;
  };

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

  Object.defineProperties(Cesium.PickId.prototype, {
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
  Cesium.PickId.prototype['destroy'] = Cesium.PickId.prototype.destroy;


  /**
   * Remove undefined values from the pick id array.
   */
  Cesium.Context.prototype.cleanupPickIds = function() {
    this._pickObjects = os.object.prune(this._pickObjects);
  };


  /**
   * Gets pick objects reference.
   *
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
  Cesium.Context.prototype['createPickId'] = Cesium.Context.prototype.createPickId;
};

exports = {
  loadCesiumMixins
};

goog.provide('os.ol.source.tileimage');

goog.require('goog.net.EventType');
goog.require('os.net.HandlerType');
goog.require('os.net.ProxyHandler');
goog.require('os.net.Request');


/**
 * Wraps the tileUrlFunction of the given source so that it goes through the
 * proxy configured in os.net.ProxyHandler
 *
 * @param {ol.source.TileImage} source
 */
os.ol.source.tileimage.addProxyWrapper = function(source) {
  // wrap the tileUrlFunction with the proxy
  var originalUrlFunction = source.getTileUrlFunction();

  var wrapper =
      /**
       * @param {ol.TileCoord} tileCoord
       * @param {number}  pixelRatio
       * @param {ol.proj.Projection} projection
       * @return {string|undefined} url for tile
       */
      function(tileCoord, pixelRatio, projection) {
        var uri = originalUrlFunction(tileCoord, pixelRatio, projection);
        if (uri) {
          uri = os.net.ProxyHandler.getProxyUri(uri);
        }

        return uri;
      };

  source.setTileUrlFunction(wrapper);
};


/**
 * Automatically wrap the source with the proxy if CORS fails and the proxy succeeds.
 *
 * @param {ol.source.TileImage} source
 * @param {ol.proj.Projection} proj
 */
os.ol.source.tileimage.autoProxyCheck = function(source, proj) {
  var url = source.getTileUrlFunction()([2, 2, -1], 1, proj);

  if (url) {
    var request = new os.net.Request(url);
    var listener = function(evt) {
      var request = /** @type {os.net.Request} */ (evt.target);

      if (request.getSuccessfulHandlerType() === os.net.HandlerType.PROXY) {
        var codes = request.getStatusCodes();

        // This ensures that:
        //  1) the upstream handler failed (most likely) due to CORS
        //  2) or the proxy handler was the only handler
        if (codes && (codes.length === 1 || (codes.length > 1 && codes[codes.length - 2] === 0))) {
          os.ol.source.tileimage.addProxyWrapper(source);
        }
      }

      request.dispose();
    };

    request.listen(goog.net.EventType.SUCCESS, listener);
    request.listen(goog.net.EventType.ERROR, listener);
    request.load();
  }
};

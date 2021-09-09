goog.module('os.ol.source.tileimage');

const EventType = goog.require('goog.net.EventType');
const HandlerType = goog.require('os.net.HandlerType');
const ProxyHandler = goog.require('os.net.ProxyHandler');
const Request = goog.require('os.net.Request');

const Projection = goog.requireType('ol.proj.Projection');
const TileImage = goog.requireType('ol.source.TileImage');
const VectorTile = goog.requireType('ol.source.VectorTile');


/**
 * Wraps the tileUrlFunction of the given source so that it goes through the
 * proxy configured in ProxyHandler
 *
 * @param {TileImage|VectorTile} source
 */
const addProxyWrapper = function(source) {
  // wrap the tileUrlFunction with the proxy
  var originalUrlFunction = source.getTileUrlFunction();

  var wrapper =
      /**
       * @param {ol.TileCoord} tileCoord
       * @param {number}  pixelRatio
       * @param {Projection} projection
       * @return {string|undefined} url for tile
       */
      function(tileCoord, pixelRatio, projection) {
        var uri = originalUrlFunction(tileCoord, pixelRatio, projection);
        if (uri) {
          uri = ProxyHandler.getProxyUri(uri);
        }

        return uri;
      };

  source.setTileUrlFunction(wrapper);
};

/**
 * Automatically wrap the source with the proxy if CORS fails and the proxy succeeds.
 *
 * @param {TileImage|VectorTile} source
 * @param {Projection} proj
 */
const autoProxyCheck = function(source, proj) {
  var url = source.getTileUrlFunction()([2, 2, -1], 1, proj);

  if (url) {
    var request = new Request(url);
    var listener = function(evt) {
      var request = /** @type {Request} */ (evt.target);

      if (request.getSuccessfulHandlerType() === HandlerType.PROXY) {
        var codes = request.getStatusCodes();

        // This ensures that:
        //  1) the upstream handler failed (most likely) due to CORS
        //  2) or the proxy handler was the only handler
        if (codes && (codes.length === 1 || (codes.length > 1 && codes[codes.length - 2] === 0))) {
          addProxyWrapper(source);
        }
      }

      request.dispose();
    };

    request.listen(EventType.SUCCESS, listener);
    request.listen(EventType.ERROR, listener);
    request.load();
  }
};

exports = {
  addProxyWrapper,
  autoProxyCheck
};

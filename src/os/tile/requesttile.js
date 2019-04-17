goog.provide('os.tile.RequestTile');

goog.require('goog.asserts');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('os.net.Request');
goog.require('os.tile.ColorableTile');


/**
 * Implementation of a tile that loads through the OpenSphere request stack.
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @extends {os.tile.ColorableTile}
 * @constructor
 */
os.tile.RequestTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction) {
  os.tile.RequestTile.base(this, 'constructor', tileCoord, state, src, crossOrigin, this.requestImage_);

  /**
   * The active request promise.
   * @type {goog.Promise|undefined}
   */
  this.requestPromise = undefined;
};
goog.inherits(os.tile.RequestTile, os.tile.ColorableTile);


/**
 * @inheritDoc
 */
os.tile.RequestTile.prototype.disposeInternal = function() {
  // cancel pending tile request
  if (this.requestPromise) {
    this.requestPromise.cancel();
    this.requestPromise = undefined;
  }

  // revoke the blob object URL
  var image = this.getImage();
  if (image && image.src) {
    URL.revokeObjectURL(image.src);
  }

  os.tile.RequestTile.base(this, 'disposeInternal');
};


/**
 * Load a tile through the request stack.
 * @param {ol.Tile} tile The tile.
 * @param {string} url The url.
 * @private
 */
os.tile.RequestTile.prototype.requestImage_ = function(tile, url) {
  goog.asserts.assert(tile instanceof os.tile.RequestTile, 'Tile is not a request tile');

  var image = tile.getImage();

  var request = new os.net.Request(url);
  request.setResponseType(goog.net.XhrIo.ResponseType.BLOB);

  tile.requestPromise = request.getPromise().then(function(response) {
    tile.requestPromise = undefined;

    if (response) {
      image.src = URL.createObjectURL(response);
    } else {
      image.dispatchEvent(new Event(ol.events.EventType.ERROR));
    }
  }, function(error) {
    tile.requestPromise = undefined;

    image.dispatchEvent(new Event(ol.events.EventType.ERROR));
  });
};

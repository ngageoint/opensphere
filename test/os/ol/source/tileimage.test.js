goog.require('os.net.ProxyHandler');
goog.require('os.ol.source.tileimage');
goog.require('ol.source.TileImage');

describe('os.ol.source.tileimage', function() {
  it('should wrap sources with proxies', function() {
    var url = '/path/to/tiles';

    var fn = function() {
      return url;
    };

    var source = new ol.source.TileImage({});
    source.setTileUrlFunction(fn);

    os.ol.source.tileimage.addProxyWrapper(source);

    expect(source.getTileUrlFunction()()).toBe(os.net.ProxyHandler.getProxyUri(url));
  });
});

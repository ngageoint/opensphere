goog.require('ol.source.TileImage');
goog.require('os.net.ProxyHandler');
goog.require('os.ol.source.tileimage');

describe('os.ol.source.tileimage', function() {
  const TileImage = goog.module.get('ol.source.TileImage');
  const ProxyHandler = goog.module.get('os.net.ProxyHandler');
  const tileimage = goog.module.get('os.ol.source.tileimage');

  it('should wrap sources with proxies', function() {
    var url = '/path/to/tiles';

    var fn = function() {
      return url;
    };

    var source = new TileImage({});
    source.setTileUrlFunction(fn);

    tileimage.addProxyWrapper(source);

    expect(source.getTileUrlFunction()()).toBe(ProxyHandler.getProxyUri(url));
  });
});

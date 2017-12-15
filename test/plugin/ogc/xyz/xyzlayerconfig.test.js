goog.require('os.net.ProxyHandler');
goog.require('ol.proj');
goog.require('plugin.xyz.XYZLayerConfig');


describe('plugin.xyz.XYZLayerConfig', function() {
  it('should proxy URLs properly', function() {
    var options = {
      url: 'http://www.example.com/wms',
      params: 'LAYERS=test',
      title: 'Test'
    };

    var lc = new plugin.xyz.XYZLayerConfig();
    var original = lc.createLayer(options);

    options['proxy'] = true;
    var proxy = lc.createLayer(options);

    var originalFunc = original.getSource().getTileUrlFunction();
    var proxyFunc = proxy.getSource().getTileUrlFunction();

    var tileCoord = [0, 0, 0];
    var pixelRatio = 1;
    var proj = ol.proj.get('EPSG:4326');

    var originalUrl = originalFunc(tileCoord, pixelRatio, proj);
    var proxyUrl = proxyFunc(tileCoord, pixelRatio, proj);

    expect(proxyUrl).toBe(os.net.ProxyHandler.getProxyUri(originalUrl));
  });
});

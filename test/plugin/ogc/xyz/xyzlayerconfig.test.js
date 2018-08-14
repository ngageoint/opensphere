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

  it('should handle single URLs properly', function() {
    var options = {
      url: 'http://a.tiles.example.com/osm/{z}/{x}/{y}.png',
      title: 'TestA'
    };

    var lc = new plugin.xyz.XYZLayerConfig();
    var layer = lc.createLayer(options);

    var tileFn = layer.getSource().getTileUrlFunction();

    var tileCoord = [3, 2, -1];
    var pixelRatio = 1;
    var proj = ol.proj.get('EPSG:3857');

    var resultURL = tileFn(tileCoord, pixelRatio, proj);

    expect(resultURL).toBe('http://a.tiles.example.com/osm/3/2/0.png');
  });

  it('should handle single URLs as array properly', function() {
    var options = {
      urls: ['http://b.tiles.example.com/osm/{z}/{x}/{y}.png'],
      title: 'TestB'
    };

    var lc = new plugin.xyz.XYZLayerConfig();
    var layer = lc.createLayer(options);

    var tileFn = layer.getSource().getTileUrlFunction();

    var tileCoord = [3, 2, -1];
    var pixelRatio = 1;
    var proj = ol.proj.get('EPSG:3857');

    var resultURL = tileFn(tileCoord, pixelRatio, proj);

    expect(resultURL).toBe('http://b.tiles.example.com/osm/3/2/0.png');
  });

  it('should handle multiple URLs as array properly', function() {
    var options = {
      urls: ['http://a.tiles.example.com/osm/{z}/{x}/{y}.png', 'http://b.tiles.example.com/osm/{z}/{x}/{y}.png', 'http://c.tiles.example.com/osm/{z}/{x}/{y}.png'],
      title: 'Test2'
    };

    var lc = new plugin.xyz.XYZLayerConfig();
    var layer = lc.createLayer(options);

    var tileFn = layer.getSource().getTileUrlFunction();

    var tileCoord = [3, 2, -1];
    var pixelRatio = 1;
    var proj = ol.proj.get('EPSG:3857');

    var resultURL = tileFn(tileCoord, pixelRatio, proj);

    expect(resultURL).toMatch('http://[a-c].tiles.example.com/osm/3/2/0.png');
  });

  it('should handle wildcard URLs properly', function() {
    var options = {
      url: 'http://{a-c}.tiles.example.com/osm/{z}/{x}/{y}.png',
      title: 'TestABC'
    };

    var lc = new plugin.xyz.XYZLayerConfig();
    var layer = lc.createLayer(options);

    var tileFn = layer.getSource().getTileUrlFunction();

    var tileCoord = [3, 2, -1];
    var pixelRatio = 1;
    var proj = ol.proj.get('EPSG:3857');

    var resultURL = tileFn(tileCoord, pixelRatio, proj);
    expect(resultURL).toMatch('http://[a-c].tiles.example.com/osm/3/2/0.png');

    resultURL = tileFn(tileCoord, pixelRatio, proj);
    expect(resultURL).toMatch('http://[a-c].tiles.example.com/osm/3/2/0.png');
  });

  it('should handle wildcard URLs with numeric values properly', function() {
    var options = {
      url: 'http://{0-4}.tiles.example.com/osm/{z}/{x}/{y}.png',
      title: 'Test04'
    };

    var lc = new plugin.xyz.XYZLayerConfig();
    var layer = lc.createLayer(options);

    var tileFn = layer.getSource().getTileUrlFunction();

    var tileCoord = [3, 2, -1];
    var pixelRatio = 1;
    var proj = ol.proj.get('EPSG:3857');

    var resultURL = tileFn(tileCoord, pixelRatio, proj);
    expect(resultURL).toMatch('http://[0-4].tiles.example.com/osm/3/2/0.png');

    resultURL = tileFn(tileCoord, pixelRatio, proj);
    expect(resultURL).toMatch('http://[0-4].tiles.example.com/osm/3/2/0.png');
  });
});

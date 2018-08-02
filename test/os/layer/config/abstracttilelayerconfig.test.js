goog.require('ol.source.XYZ');
goog.require('os.layer.config.AbstractTileLayerConfig');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockLayerConfig');
goog.require('os.mock');
goog.require('os.net');
goog.require('os.source.MockSource');

describe('os.layer.config.AbstractTileLayerConfig', function() {
  it('configures for an explicitType', function() {
    var lc = new os.layer.config.AbstractTileLayerConfig();
    var layer = new os.layer.MockLayer();
    var options = { 'explicitType' : 'someType' };
    lc.configureLayer(layer, options);
    expect(layer.getExplicitType()).toBe('someType');
  });

  it('correctly replaces URLs with rotating numeric ranges', function() {
    var lc = new os.layer.config.AbstractTileLayerConfig();
    var expandedURL = lc.getUrlPattern('https://{0-4}.tile.bits/{x}/{y}/{z}.png');
    expect(expandedURL.toString()).toBe('/^https:\\/\\/\\d.tile.bits\\/\\d+\\/\\d+\\/\\d+.png/');
  });

  it('correctly replaces URLs with rotating alpha ranges', function() {
    var lc = new os.layer.config.AbstractTileLayerConfig();
    var expandedURL = lc.getUrlPattern('https://{d-f}.tile.bits/{x}/{y}/{z}.png');
    expect(expandedURL.toString()).toBe('/^https:\\/\\/[a-zA-Z].tile.bits\\/\\d+\\/\\d+\\/\\d+.png/');
  });

  it('returns URLs as Regexp when no rotating range', function() {
    var lc = new os.layer.config.AbstractTileLayerConfig();
    var expandedURL = lc.getUrlPattern('https://abc.tile.bits/{x}/{y}/{z}.png');
    expect(expandedURL.toString()).toBe('/^https:\\/\\/abc.tile.bits\\/\\d+\\/\\d+\\/\\d+.png/');
  });

  it('sets desired projection for web Mercator if included in options', function() {
    var testLayerId = 'test-layer';
    var testOptions = {
      'id': testLayerId,
      'url': 'https://abc.layer.bits/{x}/{y}/{z}',
      'type': os.layer.config.MockLayerConfig.TYPE,
      'projection': os.proj.EPSG3857
    };
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
    var lc = new os.layer.config.AbstractTileLayerConfig();
    lc.initializeConfig(testOptions);
    expect(lc.projection.getCode()).toBe(os.proj.EPSG3857);
  });

  it('sets desired projection for WGS-84 if included in options', function() {
    var testLayerId = 'test-layer';
    var testOptions = {
      'id': testLayerId,
      'url': 'https://abc.layer.bits/{x}/{y}/{z}',
      'type': os.layer.config.MockLayerConfig.TYPE,
      'projection': os.proj.EPSG4326
    };
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
    var lc = new os.layer.config.AbstractTileLayerConfig();
    lc.initializeConfig(testOptions);
    expect(lc.projection.getCode()).toBe(os.proj.EPSG4326);
  });

  it('sets cross origin if included in options', function() {
    var testLayerId = 'test-layer';
    var testOptions = {
      'id': testLayerId,
      'url': 'https://{a-b}.layer.bits',
      'type': os.layer.config.MockLayerConfig.TYPE,
      'crossOrigin': os.net.CrossOrigin.USE_CREDENTIALS
    };
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
    var lc = new os.layer.config.AbstractTileLayerConfig();
    lc.initializeConfig(testOptions);
    expect(os.net.getCrossOrigin('https://a.layer.bits')).toBe(os.net.CrossOrigin.USE_CREDENTIALS);
    expect(os.net.getCrossOrigin('https://b.layer.bits')).toBe(os.net.CrossOrigin.USE_CREDENTIALS);
  });

  it('sets attributions if included in options', function() {
    var testOptions = {
      'attributions': ['mock attribution', 'ex libris']
    };
    var source = new ol.source.XYZ({});
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
    var lc = new os.layer.config.AbstractTileLayerConfig();
    spyOn(lc, 'getSource').andCallFake(function() {return source;});
    var layer = lc.createLayer(testOptions);
    expect(layer.getSource().getAttributions()[0].getHTML()).toBe('mock attribution');
    expect(layer.getSource().getAttributions()[1].getHTML()).toBe('ex libris');
  });

});

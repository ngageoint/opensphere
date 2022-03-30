goog.require('os.layer.MockLayer');
goog.require('os.layer.config.AbstractTileLayerConfig');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.mock');
goog.require('os.net');
goog.require('os.net.CrossOrigin');
goog.require('os.proj');

import XYZ from 'ol/src/source/XYZ.js';
import MockTileLayerConfig from './tilelayerconfig.mock.js';

describe('os.layer.config.AbstractTileLayerConfig', function() {
  const {default: AbstractTileLayerConfig} = goog.module.get('os.layer.config.AbstractTileLayerConfig');
  const {default: LayerConfigManager} = goog.module.get('os.layer.config.LayerConfigManager');
  const net = goog.module.get('os.net');
  const {default: CrossOrigin} = goog.module.get('os.net.CrossOrigin');
  const osProj = goog.module.get('os.proj');

  const MockLayer = goog.module.get('os.layer.MockLayer');

  it('configures for an explicitType', function() {
    var lc = new AbstractTileLayerConfig();
    var layer = new MockLayer();
    var options = {'explicitType': 'someType'};
    lc.configureLayer(layer, options);
    expect(layer.getExplicitType()).toBe('someType');
  });

  it('correctly replaces URLs with rotating numeric ranges', function() {
    var expandedURL = AbstractTileLayerConfig.getUrlPattern('https://{0-4}.tile.bits/{x}/{y}/{z}.png');
    expect(expandedURL.toString()).toBe('/^https:\\/\\/\\d.tile.bits\\/\\d+\\/\\d+\\/\\d+.png/');
  });

  it('correctly replaces URLs with rotating alpha ranges', function() {
    var expandedURL = AbstractTileLayerConfig.getUrlPattern('https://{d-f}.tile.bits/{x}/{y}/{z}.png');
    expect(expandedURL.toString()).toBe('/^https:\\/\\/[a-zA-Z].tile.bits\\/\\d+\\/\\d+\\/\\d+.png/');
  });

  it('returns URLs as Regexp when no rotating range', function() {
    var expandedURL = AbstractTileLayerConfig.getUrlPattern('https://abc.tile.bits/{x}/{y}/{z}.png');
    expect(expandedURL.toString()).toBe('/^https:\\/\\/abc.tile.bits\\/\\d+\\/\\d+\\/\\d+.png/');
  });

  it('sets desired projection for web Mercator if included in options', function() {
    var testLayerId = 'test-layer';
    var testOptions = {
      'id': testLayerId,
      'url': 'https://abc.layer.bits/{x}/{y}/{z}',
      'type': MockTileLayerConfig.TYPE,
      'projection': osProj.EPSG3857
    };
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    var lc = new AbstractTileLayerConfig();
    lc.initializeConfig(testOptions);
    expect(lc.projection.getCode()).toBe(osProj.EPSG3857);
  });

  it('sets desired projection for WGS-84 if included in options', function() {
    var testLayerId = 'test-layer';
    var testOptions = {
      'id': testLayerId,
      'url': 'https://abc.layer.bits/{x}/{y}/{z}',
      'type': MockTileLayerConfig.TYPE,
      'projection': osProj.EPSG4326
    };
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    var lc = new AbstractTileLayerConfig();
    lc.initializeConfig(testOptions);
    expect(lc.projection.getCode()).toBe(osProj.EPSG4326);
  });

  it('sets cross origin if included in options', function() {
    var testLayerId = 'test-layer';
    var testOptions = {
      'id': testLayerId,
      'url': 'https://{a-b}.layer.bits',
      'type': MockTileLayerConfig.TYPE,
      'crossOrigin': CrossOrigin.USE_CREDENTIALS
    };
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    var lc = new AbstractTileLayerConfig();
    lc.initializeConfig(testOptions);
    expect(net.getCrossOrigin('https://a.layer.bits')).toBe(CrossOrigin.USE_CREDENTIALS);
    expect(net.getCrossOrigin('https://b.layer.bits')).toBe(CrossOrigin.USE_CREDENTIALS);
  });

  it('sets attributions if included in options', function() {
    var testOptions = {
      'attributions': ['mock attribution', 'ex libris']
    };
    var source = new XYZ({});
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    var lc = new AbstractTileLayerConfig();
    spyOn(lc, 'getSource').andCallFake(function() {
      return source;
    });
    var layer = lc.createLayer(testOptions);
    var attributionsGetter = layer.getSource().getAttributions();
    expect(attributionsGetter()[0]).toBe('mock attribution');
    expect(attributionsGetter()[1]).toBe('ex libris');
  });
});

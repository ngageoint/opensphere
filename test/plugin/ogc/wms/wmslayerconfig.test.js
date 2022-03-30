goog.require('os.net.ProxyHandler');
goog.require('plugin.ogc.wms.WMSLayerConfig');

import {get} from 'ol/src/proj.js';

describe('plugin.ogc.wms.WMSLayerConfig', function() {
  const {default: ProxyHandler} = goog.module.get('os.net.ProxyHandler');
  const {default: WMSLayerConfig} = goog.module.get('plugin.ogc.wms.WMSLayerConfig');

  it('should proxy URLs properly', function() {
    var options = {
      url: 'http://www.example.com/wms',
      params: 'LAYERS=test',
      title: 'Test'
    };

    var lc = new WMSLayerConfig();
    var original = lc.createLayer(options);

    options['proxy'] = true;
    var proxy = lc.createLayer(options);

    var originalFunc = original.getSource().getTileUrlFunction();
    var proxyFunc = proxy.getSource().getTileUrlFunction();

    var tileCoord = [0, 0, 0];
    var pixelRatio = 1;
    var proj = get('EPSG:4326');

    var originalUrl = originalFunc(tileCoord, pixelRatio, proj);
    var proxyUrl = proxyFunc(tileCoord, pixelRatio, proj);

    expect(proxyUrl).toBe(ProxyHandler.getProxyUri(originalUrl));
  });
});

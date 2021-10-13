goog.require('plugin.georss.GeoRSSLayerConfig');
goog.require('plugin.georss.GeoRSSParser');

describe('plugin.georss.GeoRSSLayerConfig', function() {
  const {default: GeoRSSLayerConfig} = goog.module.get('plugin.georss.GeoRSSLayerConfig');
  const {default: GeoRSSParser} = goog.module.get('plugin.georss.GeoRSSParser');

  it('should return a GeoRSS parser', function() {
    var config = new GeoRSSLayerConfig();
    expect(config.getParser() instanceof GeoRSSParser).toBe(true);
  });
});

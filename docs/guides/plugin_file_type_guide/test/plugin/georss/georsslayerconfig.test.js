goog.require('plugin.georss.GeoRSSLayerConfig');
goog.require('plugin.georss.GeoRSSParser');

describe('plugin.georss.GeoRSSLayerConfig', function() {
  it('should return a GeoRSS parser', function() {
    var config = new plugin.georss.GeoRSSLayerConfig();
    expect(config.getParser() instanceof plugin.georss.GeoRSSParser).toBe(true);
  });
});

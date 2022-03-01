goog.require('os.im.FeatureImporter');
goog.require('plugin.georss.GeoRSSLayerConfig');
goog.require('plugin.georss.GeoRSSParser');

describe('plugin.georss.GeoRSSLayerConfig', function() {
  const {default: FeatureImporter} = goog.module.get('os.im.FeatureImporter');
  const {default: GeoRSSLayerConfig} = goog.module.get('plugin.georss.GeoRSSLayerConfig');
  const {default: GeoRSSParser} = goog.module.get('plugin.georss.GeoRSSParser');

  it('should return a GeoRSS parser', function() {
    var config = new GeoRSSLayerConfig();
    expect(config.getParser() instanceof GeoRSSParser).toBe(true);
  });

  it('should return a GeoRSS importer', function() {
    var config = new GeoRSSLayerConfig();
    expect(config.getImporter('http://www.example.com/testname.rss', {}) instanceof FeatureImporter).toBe(true);
  });
});

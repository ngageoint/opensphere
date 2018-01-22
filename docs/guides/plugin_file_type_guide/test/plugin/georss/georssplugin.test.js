// os.mock sets up a bunch of basic opensphere APIs, like settings, which is
// used in our example plugin
goog.require('os.mock');
goog.require('plugin.georss.GeoRSSPlugin');

describe('plugin.georss.GeoRSSPlugin', function() {
  it('should have the proper ID', function() {
    expect(new plugin.georss.GeoRSSPlugin().id).toBe('georss');
  });

  it('should not throw an error', function() {
    var fn = function() {
      var p = new plugin.georss.GeoRSSPlugin();
      p.init();
    };

    expect(fn).not.toThrow();
  });
});

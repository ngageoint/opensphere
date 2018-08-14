goog.require('plugin.georss.GeoRSSProvider');

describe('plugin.georss.GeoRSSProvider', function() {
  it('should configure properly', function() {
    var p = new plugin.georss.GeoRSSProvider();

    p.configure({
      type: 'georss'
    });

    expect(p.getId()).toBe('georss');
    expect(p.getLabel()).toBe('GeoRSS Files');
  });
});

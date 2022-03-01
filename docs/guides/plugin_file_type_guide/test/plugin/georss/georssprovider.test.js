goog.require('plugin.georss.GeoRSSProvider');

describe('plugin.georss.GeoRSSProvider', function() {
  const {default: GeoRSSProvider} = goog.module.get('plugin.georss.GeoRSSProvider');

  it('should configure properly', function() {
    const p = new GeoRSSProvider();

    p.configure({
      type: 'georss'
    });

    expect(p.getId()).toBe('georss');
    expect(p.getLabel()).toBe('GeoRSS Files');
  });
});

goog.require('plugin.georss.GeoRSSTypeMethod');

describe('plugin.georss.GeoRSSTypeMethod', function() {
  it('should detect Atom feeds as GeoRSS by xmlns', function() {
    var feed = '<?xml version="1.0" encoding="utf-8"?>' +
      '<whatever xmlns="http://www.w3.org/2005/Atom"/>';

    var file = new os.file.File();
    file.setContent(feed);

    var typeMethod = new plugin.georss.GeoRSSTypeMethod();
    expect(typeMethod.isType(file)).toBe(true);
  });

  it('should detect Atom feeds as GeoRSS by root tag name', function() {
    var feed = '<?xml version="1.0" encoding="utf-8"?><feed/>';

    var file = new os.file.File();
    file.setContent(feed);

    var typeMethod = new plugin.georss.GeoRSSTypeMethod();
    expect(typeMethod.isType(file)).toBe(true);
  });

  it('should not detect other XML as GeoRSS', function() {
    var xml = '<?xml version="1.0" encoding="utf-8"?><something xmlns="http://something.com/schema"/>';
    var file = new os.file.File();
    file.setContent(xml);
    var typeMethod = new plugin.georss.GeoRSSTypeMethod();
    expect(typeMethod.isType(file)).toBe(false);
  });

  it('should report the GeoRSS plugin ID as its type', function() {
    var typeMethod = new plugin.georss.GeoRSSTypeMethod();
    expect(typeMethod.getLayerType()).toBe('georss');
  });
});

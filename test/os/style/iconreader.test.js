goog.require('goog.object');
goog.require('ol.style.Icon');
goog.require('ol.style.IconAnchorUnits');
goog.require('ol.style.IconOrigin');
goog.require('os.style.IconReader');

describe('os.style.IconReader', function() {
  var reader;
  var config;

  beforeEach(function() {
    config = {
      type: 'icon',
      src: '/something.png'
    };

    reader = new os.style.IconReader();
  });

  it('should create an icon without the cache', function() {
    var icon = reader.getOrCreateStyle(config);

    expect(icon.getSrc()).toBe(config.src);
  });

  it('should create an icon with the cache', function() {
    var icon1 = reader.getOrCreateStyle(config);
    var icon2 = reader.getOrCreateStyle(config);
    expect(icon1).toBe(icon2);
  });

  it('should convert a style to a config', function() {
    var config = {};

    // try a simple one
    var style = new ol.style.Icon({
      src: '/something.png'
    });

    reader.toConfig(style, config);

    // count the fields in the config
    var count = goog.object.getCount(config);

    expect(config.src).toBe('/something.png');
    expect(config.type).toBe('icon');
    expect(count).toBe(2);

    // try a complex one
    style = new ol.style.Icon({
      anchor: [2, 4],
      anchorOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
      anchorXUnits: ol.style.IconAnchorUnits.PIXELS,
      anchorYUnits: ol.style.IconAnchorUnits.PIXELS,
      offset: [1, 2],
      offsetOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
      rotation: 90,
      scale: 0.8,
      size: [16, 14],
      src: '/better.png'
    });

    config = {};
    reader.toConfig(style, config);

    expect(config.anchor[0]).toBe(2);
    expect(config.anchor[1]).toBe(4);
    expect(config.anchorOrigin).toBe(ol.style.IconOrigin.BOTTOM_LEFT);
    expect(config.anchorXUnits).toBe(ol.style.IconAnchorUnits.PIXELS);
    expect(config.anchorYUnits).toBe(ol.style.IconAnchorUnits.PIXELS);
    expect(config.offset[0]).toBe(1);
    expect(config.offset[1]).toBe(2);
    expect(config.offsetOrigin).toBe(ol.style.IconOrigin.BOTTOM_LEFT);
    expect(config.rotation).toBe(90);
    expect(config.scale).toBe(0.8);
    expect(config.size[0]).toBe(16);
    expect(config.size[1]).toBe(14);
    expect(config.src).toBe('/better.png');
    expect(config.type).toBe('icon');
  });

  it('should replace Google maps/earth icons with local copies', function() {
    config.src = 'http://maps.google.com/mapfiles/kml/pal4/icon28.png';

    var icon = reader.getOrCreateStyle(config);

    // this should point back a directory to where we keep all of the KML icons
    expect(icon.getSrc()).toBe(os.ROOT + 'images/icons/kml/pal4/icon28.png');
  });
});

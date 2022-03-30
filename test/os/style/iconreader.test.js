goog.require('goog.object');
goog.require('os');
goog.require('os.style.IconReader');

import Icon from 'ol/src/style/Icon.js';
import IconAnchorUnits from 'ol/src/style/IconAnchorUnits.js';
import IconOrigin from 'ol/src/style/IconOrigin.js';

describe('os.style.IconReader', function() {
  const googObject = goog.module.get('goog.object');
  const os = goog.module.get('os');
  const {default: IconReader} = goog.module.get('os.style.IconReader');

  var config;
  var reader;

  beforeEach(function() {
    config = {
      type: 'icon',
      src: '/something.png'
    };

    reader = new IconReader();
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
    var style = new Icon({
      src: '/something.png'
    });

    reader.toConfig(style, config);

    // count the fields in the config
    var count = googObject.getCount(config);

    expect(config.src).toBe('/something.png');
    expect(config.type).toBe('icon');
    expect(count).toBe(2);

    // try a complex one
    style = new Icon({
      anchor: [2, 4],
      anchorOrigin: IconOrigin.BOTTOM_LEFT,
      anchorXUnits: IconAnchorUnits.PIXELS,
      anchorYUnits: IconAnchorUnits.PIXELS,
      offset: [1, 2],
      offsetOrigin: IconOrigin.BOTTOM_LEFT,
      rotation: 90,
      scale: 0.8,
      size: [16, 14],
      src: '/better.png'
    });

    config = {};
    reader.toConfig(style, config);

    expect(config.anchor[0]).toBe(2);
    expect(config.anchor[1]).toBe(4);
    expect(config.anchorOrigin).toBe(IconOrigin.BOTTOM_LEFT);
    expect(config.anchorXUnits).toBe(IconAnchorUnits.PIXELS);
    expect(config.anchorYUnits).toBe(IconAnchorUnits.PIXELS);
    expect(config.offset[0]).toBe(1);
    expect(config.offset[1]).toBe(2);
    expect(config.offsetOrigin).toBe(IconOrigin.BOTTOM_LEFT);
    expect(config.rotation).toBe(90);
    expect(config.scale).toBe(0.8);
    expect(config.size[0]).toBe(16);
    expect(config.size[1]).toBe(14);
    expect(config.src).toBe('/better.png');
    expect(config.type).toBe('icon');
  });

  it('should replace Google maps/earth icons with local copies', function() {
    config.src = 'http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png';

    var icon = reader.getOrCreateStyle(config);

    // this should point back a directory to where we keep all of the KML icons
    expect(icon.getSrc()).toBe(os.ROOT + 'images/icons/kml/pushpin/wht-pushpin.png');
  });
});

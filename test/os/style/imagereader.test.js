goog.require('os.style.CircleReader');
goog.require('os.style.IconReader');
goog.require('os.style.ImageReader');

import Icon from 'ol/src/style/Icon.js';

describe('os.style.ImageReader', function() {
  const {default: CircleReader} = goog.module.get('os.style.CircleReader');
  const {default: IconReader} = goog.module.get('os.style.IconReader');
  const {default: ImageReader} = goog.module.get('os.style.ImageReader');

  var config;
  var reader;

  beforeEach(function() {
    config = {
      type: 'icon',
      src: '/something.png'
    };

    reader = new ImageReader();
    reader.setReaders({
      'icon': new IconReader(),
      'circle': new CircleReader()
    });
  });

  it('should create an image without the cache', function() {
    var icon = reader.getOrCreateStyle(config);

    expect(icon instanceof Icon).toBe(true);
    expect(icon.getSrc()).toBe('/something.png');
  });

  it('should create an image with the cache', function() {
    var icon1 = reader.getOrCreateStyle(config);
    var icon2 = reader.getOrCreateStyle(config);

    expect(icon1).toBe(icon2);
  });

  it('should convert a style to a config', function() {
    var config = {};
    var style = new Icon({
      src: '/something.png'
    });

    reader.toConfig(style, config);
    expect(config.image.src).toBe('/something.png');
    expect(config.image.type).toBe('icon');
  });
});

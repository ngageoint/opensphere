goog.require('os.style.ImageReader');


describe('os.style.ImageReader', function() {
  var config, reader;

  beforeEach(function() {
    config = {
      type: 'icon',
      src: '/something.png'
    };

    reader = new os.style.ImageReader();
    reader.setReaders({
      'icon': new os.style.IconReader(),
      'circle': new os.style.CircleReader()
    });
  });

  it('should create an image without the cache', function() {
    var icon = reader.getOrCreateStyle(config);

    expect(icon instanceof ol.style.Icon).toBe(true);
    expect(icon.getSrc()).toBe('/something.png');
  });

  it('should create an image with the cache', function() {
    var icon1 = reader.getOrCreateStyle(config);
    var icon2 = reader.getOrCreateStyle(config);

    expect(icon1).toBe(icon2);
  });

  it('should convert a style to a config', function() {
    var config = {};
    var style = new ol.style.Icon({
      src: '/something.png'
    });

    reader.toConfig(style, config);
    expect(config.image.src).toBe('/something.png');
    expect(config.image.type).toBe('icon');
  });
});

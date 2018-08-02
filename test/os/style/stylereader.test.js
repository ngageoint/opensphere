goog.require('os.style.CircleReader');
goog.require('os.style.FillReader');
goog.require('os.style.IconReader');
goog.require('os.style.ImageReader');
goog.require('os.style.StrokeReader');
goog.require('os.style.StyleReader');


describe('os.style.StyleReader', function() {
  var config, reader;

  beforeEach(function() {
    config = {
      fill: {
        color: 'rgba(0,0,255,1)'
      },
      image: {
        type: 'circle',
        radius: 3,
        fill: {
          color: 'rgba(0,0,255,1)'
        },
        stroke: {
          color: 'rgba(0,0,255,1)',
          width: 5
        }
      },
      stroke: {
        width: 2,
        color: 'rgba(0,255,0,1)'
      }
    };

    reader = new os.style.StyleReader();

    var readers = {
      'circle': new os.style.CircleReader(),
      'fill': new os.style.FillReader(),
      'icon': new os.style.IconReader(),
      'image': new os.style.ImageReader(),
      'stroke': new os.style.StrokeReader()
    };

    for (var key in readers) {
      readers[key].setReaders(readers);
    }
    reader.setReaders(readers);
  });

  it('should create a style without the cache', function() {
    var style = reader.getOrCreateStyle(config);
    expect(style instanceof ol.style.Style).toBe(true);
    expect(style.getFill().getColor()).toBe(config.fill.color);
    expect(style.getStroke().getColor()).toBe(config.stroke.color);
    expect(style.getStroke().getWidth()).toBe(config.stroke.width);

    var image = style.getImage();
    expect(image instanceof ol.style.Circle).toBe(true);
    expect(image.getRadius()).toBe(config.image.radius);
    expect(image.getFill().getColor()).toBe(config.image.fill.color);
    expect(image.getStroke().getColor()).toBe(config.image.stroke.color);
    expect(image.getStroke().getWidth()).toBe(config.image.stroke.width);
  });

  it('should create a style with the cache', function() {
    var style1 = reader.getOrCreateStyle(config);
    var style2 = reader.getOrCreateStyle(config);
    expect(style1).toBe(style2);
    expect(style1.getImage()).toBe(style2.getImage());
    expect(style1.getFill()).toBe(style2.getFill());
    expect(style1.getStroke()).toBe(style2.getStroke());
  });

  it('should create a new style from items in the cache', function() {
    var style1 = reader.getOrCreateStyle(config);

    var firstId = style1.id;
    config.stroke.width = 5;

    var style2 = reader.getOrCreateStyle(config);
    expect(style2).not.toBe(style1);
    expect(style2.id).not.toBe(firstId);

    expect(style2.getImage()).toBe(style1.getImage());
    expect(style2.getFill()).toBe(style1.getFill());

    expect(style2.getStroke()).not.toBe(style1.getStroke());
    expect(style2.getStroke().getWidth()).toBe(config.stroke.width);
  });

  it('should convert a style to a config', function() {
    var newConfig = {};
    var style = reader.getOrCreateStyle(config);

    reader.toConfig(style, newConfig);
    expect(newConfig.fill.color).toBe(config.fill.color);
    expect(newConfig.image.type).toBe(config.image.type);
    expect(newConfig.image.radius).toBe(config.image.radius);
    expect(newConfig.image.fill.color).toBe(config.image.fill.color);
    expect(newConfig.image.stroke.color).toBe(config.image.stroke.color);
    expect(newConfig.image.stroke.width).toBe(config.image.stroke.width);
    expect(newConfig.stroke.color).toBe(config.stroke.color);
    expect(newConfig.stroke.width).toBe(config.stroke.width);
  });
});

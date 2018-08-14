goog.require('os.style.CircleReader');
goog.require('os.style.FillReader');
goog.require('os.style.StrokeReader');


describe('os.style.CircleReader', function() {
  var reader, config;

  beforeEach(function() {
    config = {
      radius: 5,
      fill: {
        color: 'rgba(255,0,0,1)'
      },
      stroke: {
        color: 'rgba(255,255,0,1)',
        width: 2
      }
    };

    reader = new os.style.CircleReader();
    reader.setReaders({
      'fill': new os.style.FillReader(),
      'stroke': new os.style.StrokeReader()
    });
  });

  it('should create a circle without the cache', function() {
    var circle = reader.getOrCreateStyle(config);
    expect(circle.getRadius()).toBe(config.radius);
    expect(circle.getFill().getColor()).toBe(config.fill.color);
    expect(circle.getStroke().getColor()).toBe(config.stroke.color);
    expect(circle.getStroke().getWidth()).toBe(config.stroke.width);

    var firstId = circle.id;
    config.radius = 10;
    circle = reader.getOrCreateStyle(config);
    expect(circle.getRadius()).toBe(config.radius);
    expect(circle.id).not.toBe(firstId);
  });

  it('should create a circle with the cache', function() {
    var circle1 = reader.getOrCreateStyle(config);
    var circle2 = reader.getOrCreateStyle(config);
    expect(circle1).toBe(circle2);
  });

  it('should convert a style to a config', function() {
    var style = reader.getOrCreateStyle(config);
    var newConfig = {};

    reader.toConfig(style, newConfig);
    expect(newConfig.type).toBe('circle');
    expect(newConfig.radius).toBe(config.radius);
    expect(newConfig.fill.color).toBe(config.fill.color);
    expect(newConfig.stroke.color).toBe(config.stroke.color);
    expect(newConfig.stroke.width).toBe(config.stroke.width);
  });
});

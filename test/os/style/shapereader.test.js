goog.require('goog.math');
goog.require('os.style.FillReader');
goog.require('os.style.ShapeReader');
goog.require('os.style.StrokeReader');


describe('os.style.ShapeReader', function() {
  const math = goog.module.get('goog.math');
  const {default: FillReader} = goog.module.get('os.style.FillReader');
  const {default: ShapeReader} = goog.module.get('os.style.ShapeReader');
  const {default: StrokeReader} = goog.module.get('os.style.StrokeReader');

  var config;
  var reader;

  beforeEach(function() {
    config = {
      radius: 5,
      subType: 'square',
      stroke: {
        width: 2,
        color: 'rgba(0,255,0,1)'
      },
      fill: {
        color: 'rgba(0,0,255,1)'
      }
    };

    reader = new ShapeReader();
    reader.setReaders({
      'fill': new FillReader(),
      'stroke': new StrokeReader()
    });
  });

  it('should create a shape without the cache', function() {
    var shape = reader.getOrCreateStyle(config);
    expect(shape.getRadius()).toBe(Math.round(config.radius * ShapeReader.RADIUS_MULTIPLIER));
    expect(shape.getFill().getColor()).toBe(config.fill.color);
    expect(shape.getStroke().getColor()).toBe(config.stroke.color);
    expect(shape.getStroke().getWidth()).toBe(config.stroke.width);
    expect(shape.points_).toBe(4);
    expect(shape.angle_).toBe(math.toRadians(45));

    var firstId = shape.id;
    config.subType = 'triangle';
    shape = reader.getOrCreateStyle(config);
    expect(shape.angle_).toBe(0);
    expect(shape.points_).toBe(3);
    expect(shape.id).not.toBe(firstId);
  });

  it('should create a shape with the cache', function() {
    var shape1 = reader.getOrCreateStyle(config);
    var shape2 = reader.getOrCreateStyle(config);
    expect(shape1).toBe(shape2);
  });
});

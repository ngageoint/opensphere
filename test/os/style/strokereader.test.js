goog.require('os.style.StrokeReader');

import Stroke from 'ol/src/style/Stroke.js';

describe('os.style.StrokeReader', function() {
  const {default: StrokeReader} = goog.module.get('os.style.StrokeReader');

  var config;
  var reader;

  beforeEach(function() {
    config = {
      color: 'rgba(255,0,0,1)',
      width: 2,
      bogus: true
    };

    reader = new StrokeReader();
  });

  it('should create a stroke without the cache', function() {
    var stroke = reader.getOrCreateStyle(config);

    expect(stroke.getColor()).toBe(config.color);
    expect(stroke.getWidth()).toBe(config.width);

    var firstId = stroke.id;
    config.width = 3;

    stroke = reader.getOrCreateStyle(config);
    expect(stroke.getColor()).toBe(config.color);
    expect(stroke.getWidth()).toBe(config.width);
    expect(stroke.id).not.toBe(firstId);
  });

  it('should create a stroke with the cache', function() {
    var stroke1 = reader.getOrCreateStyle(config);
    var stroke2 = reader.getOrCreateStyle(config);

    expect(stroke1).toBe(stroke2);
  });

  it('should convert a style to config', function() {
    var config = {};
    var style = new Stroke({
      color: 'rgba(255,0,255,1)'
    });

    reader.toConfig(style, config);
    expect(config.stroke.color).toBe(style.getColor());
    expect(config.stroke.width).toBe(undefined);

    style = new Stroke({
      color: 'rgba(0,0,0,1)',
      width: 2
    });

    config = {};
    reader.toConfig(style, config);

    expect(config.stroke.color).toBe(style.getColor());
    expect(config.stroke.width).toBe(style.getWidth());
  });
});

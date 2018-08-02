goog.require('os.style.FillReader');


describe('os.style.FillReader', function() {
  var config, reader;

  beforeEach(function() {
    config = {
      color: 'rgba(255,255,0,1)',
      bogus: true
    };

    reader = new os.style.FillReader();
  });

  it('should create a fill without the cache', function() {
    var fill = reader.getOrCreateStyle(config);
    expect(fill.getColor()).toBe(config.color);

    var firstId = fill.id;
    config.color = 'rgba(255,0,0,1)';
    fill = reader.getOrCreateStyle(config);
    expect(fill.getColor()).toBe(config.color);
    expect(fill.id).not.toBe(firstId);
  });

  it('should create a fill with the cache', function() {
    var fill1 = reader.getOrCreateStyle(config);
    var fill2 = reader.getOrCreateStyle(config);

    expect(fill1).toBe(fill2);
  });

  it('should convert a style to a config', function() {
    var config = {};
    var style = new ol.style.Fill({
      color: 'rgba(255,0,255,1)'
    });

    reader.toConfig(style, config);
    expect(config.fill.color).toBe(style.getColor());
  });
});

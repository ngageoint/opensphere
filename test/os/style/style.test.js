goog.require('goog.object');
goog.require('ol.Feature');
goog.require('os.style');


describe('os.style', function() {
  it('should convert colors properly', function() {
    expect(os.style.toRgbaString('#f84')).toBe('rgba(255,136,68,1)');
    expect(os.style.toRgbaString('  AB C Def')).toBe('rgba(171,205,239,1)');
    expect(os.style.toRgbaString(' rgb(50, 150, 200)')).toBe('rgba(50,150,200,1)');
    expect(os.style.toRgbaString([255, 0, 255, 1])).toBe('rgba(255,0,255,1)');
    expect(os.style.toRgbaString('0x00ff00')).toBe('rgba(0,255,0,1)');
  });

  it('should set config colors in rgba', function() {
    var config = {};
    os.style.setConfigColor(config, os.style.toRgbaString('#f84'));
    expect(goog.object.isEmpty(config)).toBeTruthy();

    config.image = {
      color: '#fff'
    };
    os.style.setConfigColor(config, os.style.toRgbaString('#f84'));
    expect(config.image.color).toBe('rgba(255,136,68,1)');

    os.style.setConfigColor(config, os.style.toRgbaString([255, 0, 255, 1]));
    expect(config.image.color).toBe('rgba(255,0,255,1)');

    os.style.setConfigColor(config, os.style.toRgbaString(' rgb(50, 150, 200)'));
    expect(config.image.color).toBe('rgba(50,150,200,1)');
  });

  it('should set config colors when color is absent', function() {
    var color = 'rgba(11,22,33,1)';
    var config = {};
    os.style.setConfigColor(config, color);
    expect(goog.object.isEmpty(config)).toBeTruthy();

    config.image = {};
    os.style.setConfigColor(config, color);
    expect(config.image.color).toBe(color);

    config.image.color = 'rgba(255,255,255,1)';
    os.style.setConfigColor(config, color);
    expect(config.image.color).toBe(color);

    config.image.fill = {};
    config.image.stroke = {};
    os.style.setConfigColor(config, color);
    expect(config.image.color).toBe(color);
    expect(config.image.fill.color).toBe(color);
    expect(config.image.stroke.color).toBe(color);

    config.stroke = {};
    os.style.setConfigColor(config, color);
    expect(config.stroke.color).toBe(color);
  });

  it('should get the icon from a config', function() {
    var config = null;
    expect(os.style.getConfigIcon(config)).toBeNull();

    config = {};
    expect(os.style.getConfigIcon(config)).toBeNull();

    config.image = {};
    expect(os.style.getConfigIcon(config)).toBeNull();

    config.image.src = 'test';
    var icon = os.style.getConfigIcon(config);
    expect(icon).toBeDefined();
    expect(icon.path).toBe('test');
  });

  it('should set the icon in a config', function() {
    var config = {
      image: {
        src: 'oldvalue'
      }
    };

    os.style.setConfigIcon(config, {
      path: 'newvalue'
    });
    expect(os.style.getConfigIcon(config).path).toBe('newvalue');
  });
});

describe('os.style.createFeatureStyle', function() {
  var base;
  var layer;
  var opacity = 0.25;

  // base style opacity (0.99) should be multiplied by the feature opacity (0.25)
  var featureRgba = 'rgba(0,255,100,0.2475)';
  var labelRgba = 'rgba(0,123,123,0.2475)';

  beforeEach(function() {
    base = {
      'image': {
        'type': 'circle',
        'radius': 2,
        'fill': {
          'color': 'rgba(0,255,100,0.99)'
        }
      },
      'stroke': {
        'width': '3',
        'color': 'rgba(0,255,100,0.99)'
      }
    };

    layer = {
      'image': {
        'type': 'circle',
        'radius': 3,
        'fill': {
          'color': 'rgba(0,255,100,0.99)'
        }
      },
      'text': {
        'fill': {
          'color': 'rgba(0,255,0,0.99)'
        }
      },
      'labelColor': 'rgba(0,123,123,0.99)',
      'labels': [{'column': 'some_field', 'showColumn': 'true'}]
    };
  });

  it('should never ever modify the incoming config parameters', function() {
    var baseExpected = JSON.stringify(base);
    var layerExpected = JSON.stringify(layer);

    var feature = new ol.Feature();
    feature.set(os.style.StyleType.FEATURE, base);

    expect(JSON.stringify(base)).toBe(baseExpected);
    expect(JSON.stringify(layer)).toBe(layerExpected);
  });

  it('should create styles with a new opacity value', function() {
    var feature = new ol.Feature();
    feature.set(os.style.StyleType.FEATURE, base);
    feature.set(os.style.StyleField.OPACITY, opacity);
    feature.set('some_field', 'test');

    var style = os.style.createFeatureStyle(feature, base, layer);

    // check all the colors and verify the rgba value
    expect(style.length).toBe(2);
    expect(style[0].image_.fill_.color_).toBe(featureRgba);
    expect(style[0].stroke_.color_).toBe(featureRgba);
    expect(style[1].text_.fill_.color_).toBe(labelRgba);


    // attempt the same again with an empty base config
    // to make sure no exceptions are thrown
    feature = new ol.Feature();
    feature.set(os.style.StyleType.FEATURE, {});
    feature.set(os.style.StyleField.OPACITY, opacity);
    feature.set('some_field', 'test');

    var style = os.style.createFeatureStyle(feature, {}, layer);

    // check all the colors and verify the rgba value
    expect(style.length).toBe(2);
  });
});

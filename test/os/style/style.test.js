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

  describe('os.style.getConfigColor', function() {
    var testColor = 'rgba(12,34,56,.5)';
    var testColorArray = os.color.toRgbArray(testColor);
    var colorConfig = {
      color: testColor
    };
    var fillConfig = {
      fill: colorConfig
    };
    var imageConfig = {
      image: colorConfig
    };
    var strokeConfig = {
      stroke: colorConfig
    };
    var nullFillConfig = {
      fill: null
    };
    var nullImageConfig = {
      image: null
    };
    var nullStrokeConfig = {
      stroke: null
    };
    var undefinedFillConfig = {
      fill: undefined
    };
    var undefinedImageConfig = {
      image: undefined
    };
    var undefinedStrokeConfig = {
      stroke: undefined
    };

    it('should get the color from a config using default fields', function() {
      expect(os.style.getConfigColor(null)).toBeNull();
      expect(os.style.getConfigColor({})).toBeNull();

      expect(os.style.getConfigColor(colorConfig)).toBe(testColor);
      expect(os.style.getConfigColor(fillConfig)).toBe(testColor);
      expect(os.style.getConfigColor(imageConfig)).toBe(testColor);
      expect(os.style.getConfigColor(strokeConfig)).toBe(testColor);
    });

    it('should get the color from a config using the array parameter', function() {
      expect(os.style.getConfigColor(colorConfig, false)).toEqual(testColor);
      expect(os.style.getConfigColor(fillConfig, false)).toEqual(testColor);
      expect(os.style.getConfigColor(imageConfig, false)).toEqual(testColor);
      expect(os.style.getConfigColor(strokeConfig, false)).toEqual(testColor);

      expect(os.style.getConfigColor(colorConfig, true)).toEqual(testColorArray);
      expect(os.style.getConfigColor(fillConfig, true)).toEqual(testColorArray);
      expect(os.style.getConfigColor(imageConfig, true)).toEqual(testColorArray);
      expect(os.style.getConfigColor(strokeConfig, true)).toEqual(testColorArray);
    });

    it('should get the color from a config using a field hint parameter', function() {
      // hint doesn't exist in config
      expect(os.style.getConfigColor(colorConfig, undefined, os.style.StyleField.FILL)).toBeUndefined();
      expect(os.style.getConfigColor(imageConfig, undefined, os.style.StyleField.FILL)).toBeUndefined();
      expect(os.style.getConfigColor(strokeConfig, undefined, os.style.StyleField.FILL)).toBeUndefined();

      expect(os.style.getConfigColor(colorConfig, undefined, os.style.StyleField.STROKE)).toBeUndefined();
      expect(os.style.getConfigColor(fillConfig, undefined, os.style.StyleField.STROKE)).toBeUndefined();
      expect(os.style.getConfigColor(imageConfig, undefined, os.style.StyleField.STROKE)).toBeUndefined();

      expect(os.style.getConfigColor(colorConfig, undefined, os.style.StyleField.IMAGE)).toBeUndefined();
      expect(os.style.getConfigColor(fillConfig, undefined, os.style.StyleField.IMAGE)).toBeUndefined();
      expect(os.style.getConfigColor(strokeConfig, undefined, os.style.StyleField.IMAGE)).toBeUndefined();

      // hint is defined in config
      expect(os.style.getConfigColor(fillConfig, false, os.style.StyleField.FILL)).toBe(testColor);
      expect(os.style.getConfigColor(imageConfig, false, os.style.StyleField.IMAGE)).toBe(testColor);
      expect(os.style.getConfigColor(strokeConfig, false, os.style.StyleField.STROKE)).toBe(testColor);

      expect(os.style.getConfigColor(fillConfig, true, os.style.StyleField.FILL)).toEqual(testColorArray);
      expect(os.style.getConfigColor(imageConfig, true, os.style.StyleField.IMAGE)).toEqual(testColorArray);
      expect(os.style.getConfigColor(strokeConfig, true, os.style.StyleField.STROKE)).toEqual(testColorArray);

      // hint is undefined in config
      expect(os.style.getConfigColor(undefinedFillConfig, undefined, os.style.StyleField.FILL)).toBeUndefined();
      expect(os.style.getConfigColor(undefinedImageConfig, undefined, os.style.StyleField.IMAGE)).toBeUndefined();
      expect(os.style.getConfigColor(undefinedStrokeConfig, undefined, os.style.StyleField.STROKE)).toBeUndefined();

      // hint is null in config
      expect(os.style.getConfigColor(nullFillConfig, undefined, os.style.StyleField.FILL)).toBeNull();
      expect(os.style.getConfigColor(nullImageConfig, undefined, os.style.StyleField.IMAGE)).toBeNull();
      expect(os.style.getConfigColor(nullStrokeConfig, undefined, os.style.StyleField.STROKE)).toBeNull();
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

  describe('os.style.mergeConfig', function() {
    it('should merge basic style configs', function() {
      var from = {
        'string': 'This is a test',
        'number': 1,
        'boolean': true
      };

      var to = {};

      os.style.mergeConfig(from, to);
      expect(to).toEqual(from);
      expect(to).not.toBe(from);
    });

    it('should merge nested style configs', function() {
      var from = {
        'nested': {
          'string': 'test',
          'number': 1,
          'boolean': true
        },
        'string': 'This is a test',
        'number': 2,
        'boolean': false
      };

      var to = {};
      os.style.mergeConfig(from, to);
      expect(to).toEqual(from);
    });

    it('should overwrite when merging', function() {
      var from = {
        'nested': {
          'egg': 2
        },
        'string': 'test',
        'number': 1,
        'boolean': true
      };

      var toMergeAll = {
        'nested': {
          'egg': 1
        },
        'string': 'mergeAll',
        'number': 0,
        'boolean': false,
        'other': 'no change'
      };

      os.style.mergeConfig(from, toMergeAll);
      expect(toMergeAll).toEqual(ol.obj.assign({}, toMergeAll, from));

      var toMergeSome = {
        'string': 'mergeSome',
        'number': -1
      };

      os.style.mergeConfig(from, toMergeSome);
      expect(toMergeSome).toEqual(from);

      var toMergeSomeNested = {
        'nested': {},
        'string': 'mergeSomeNested'
      };

      os.style.mergeConfig(from, toMergeSomeNested);
      expect(toMergeSomeNested).toEqual(from);
    });

    it('should use null for deletions', function() {
      var from = {'value': null};

      var to = {'value': {'color': 'red'}};

      os.style.mergeConfig(from, to);
      expect(to).toEqual(from);

      var newAddition = {'value': {'color': 'blue'}};

      os.style.mergeConfig(newAddition, to);
      expect(to).toEqual(newAddition);
    });

    it('should use undefined for inheritence', function() {
      // we've already tested implicit undefined above, so test explicit undefined
      var to = {'value': undefined};
      var from = {'value': 1};
      os.style.mergeConfig(from, to);
      expect(to).toEqual(from);

      var to = {'stroke': undefined};
      var from = {'stroke': {'color': 'red'}};
      os.style.mergeConfig(from, to);
      expect(to).toEqual(from);
    });

    it('should detect non-zero opacity fills', function() {
      var fill = new ol.style.Fill();
      fill.setColor('rgba(1,1,1,1)');
      var style = new ol.style.Style();
      style.setFill(fill);

      expect(os.style.hasNonZeroFillOpacity(style)).toBe(true);
      fill.setColor('rgba(1,1,1,0)');
      expect(os.style.hasNonZeroFillOpacity(style)).toBe(false);
    });

    it('should detect non-zero opacity strokes', function() {
      var stroke = new ol.style.Stroke();
      stroke.setColor('rgba(1,1,1,1)');
      var style = new ol.style.Style();
      style.setStroke(stroke);

      expect(os.style.hasNonZeroStrokeOpacity(style)).toBe(true);
      stroke.setColor('rgba(1,1,1,0)');
      expect(os.style.hasNonZeroStrokeOpacity(style)).toBe(false);
    });
  });
});

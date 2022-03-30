goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('os.color');
goog.require('os.source.PropertyChange');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.style.StyleField');
goog.require('os.style.StyleType');

import {toString} from 'ol/src/color.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import Feature from 'ol/src/Feature.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import {assign} from 'ol/src/obj.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('os.style', function() {
  const GoogEventType = goog.module.get('goog.events.EventType');
  const googObject = goog.module.get('goog.object');
  const osColor = goog.module.get('os.color');
  const {default: PropertyChange} = goog.module.get('os.source.PropertyChange');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const osStyle = goog.module.get('os.style');
  const {default: StyleField} = goog.module.get('os.style.StyleField');
  const {default: StyleType} = goog.module.get('os.style.StyleType');

  it('should convert colors properly', function() {
    expect(osStyle.toRgbaString('#f84')).toBe('rgba(255,136,68,1)');
    expect(osStyle.toRgbaString('  AB C Def')).toBe('rgba(171,205,239,1)');
    expect(osStyle.toRgbaString(' rgb(50, 150, 200)')).toBe('rgba(50,150,200,1)');
    expect(osStyle.toRgbaString([255, 0, 255, 1])).toBe('rgba(255,0,255,1)');
    expect(osStyle.toRgbaString('0x00ff00')).toBe('rgba(0,255,0,1)');
  });

  it('should set config colors in rgba', function() {
    var config = {};
    osStyle.setConfigColor(config, osStyle.toRgbaString('#f84'));
    expect(googObject.isEmpty(config)).toBeTruthy();

    config.image = {
      color: '#fff'
    };
    osStyle.setConfigColor(config, osStyle.toRgbaString('#f84'));
    expect(config.image.color).toBe('rgba(255,136,68,1)');

    osStyle.setConfigColor(config, osStyle.toRgbaString([255, 0, 255, 1]));
    expect(config.image.color).toBe('rgba(255,0,255,1)');

    osStyle.setConfigColor(config, osStyle.toRgbaString(' rgb(50, 150, 200)'));
    expect(config.image.color).toBe('rgba(50,150,200,1)');
  });

  it('should set config colors when color is absent', function() {
    var color = 'rgba(11,22,33,1)';
    var config = {};
    osStyle.setConfigColor(config, color);
    expect(googObject.isEmpty(config)).toBeTruthy();

    config.image = {};
    osStyle.setConfigColor(config, color);
    expect(config.image.color).toBe(color);

    config.image.color = 'rgba(255,255,255,1)';
    osStyle.setConfigColor(config, color);
    expect(config.image.color).toBe(color);

    config.image.fill = {};
    config.image.stroke = {};
    osStyle.setConfigColor(config, color);
    expect(config.image.color).toBe(color);
    expect(config.image.fill.color).toBe(color);
    expect(config.image.stroke.color).toBe(color);

    config.stroke = {};
    osStyle.setConfigColor(config, color);
    expect(config.stroke.color).toBe(color);
  });

  it('should get the icon from a config', function() {
    var config = null;
    expect(osStyle.getConfigIcon(config)).toBeNull();

    config = {};
    expect(osStyle.getConfigIcon(config)).toBeNull();

    config.image = {};
    expect(osStyle.getConfigIcon(config)).toBeNull();

    config.image.src = 'test';
    var icon = osStyle.getConfigIcon(config);
    expect(icon).toBeDefined();
    expect(icon.path).toBe('test');
  });

  it('should set the icon in a config', function() {
    var config = {
      image: {
        src: 'oldvalue'
      }
    };

    osStyle.setConfigIcon(config, {
      path: 'newvalue'
    });
    expect(osStyle.getConfigIcon(config).path).toBe('newvalue');
  });

  describe('os.style.getConfigColor', function() {
    var testColor = 'rgba(12,34,56,.5)';
    var testColorArray = osColor.toRgbArray(testColor);
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
      expect(osStyle.getConfigColor(null)).toBeNull();
      expect(osStyle.getConfigColor({})).toBeNull();

      expect(osStyle.getConfigColor(colorConfig)).toBe(testColor);
      expect(osStyle.getConfigColor(fillConfig)).toBe(testColor);
      expect(osStyle.getConfigColor(imageConfig)).toBe(testColor);
      expect(osStyle.getConfigColor(strokeConfig)).toBe(testColor);
    });

    it('should get the color from a config using the array parameter', function() {
      expect(osStyle.getConfigColor(colorConfig, false)).toEqual(testColor);
      expect(osStyle.getConfigColor(fillConfig, false)).toEqual(testColor);
      expect(osStyle.getConfigColor(imageConfig, false)).toEqual(testColor);
      expect(osStyle.getConfigColor(strokeConfig, false)).toEqual(testColor);

      expect(osStyle.getConfigColor(colorConfig, true)).toEqual(testColorArray);
      expect(osStyle.getConfigColor(fillConfig, true)).toEqual(testColorArray);
      expect(osStyle.getConfigColor(imageConfig, true)).toEqual(testColorArray);
      expect(osStyle.getConfigColor(strokeConfig, true)).toEqual(testColorArray);
    });

    it('should get the color from a config using a field hint parameter', function() {
      // hint doesn't exist in config
      expect(osStyle.getConfigColor(colorConfig, undefined, StyleField.FILL)).toBeUndefined();
      expect(osStyle.getConfigColor(imageConfig, undefined, StyleField.FILL)).toBeUndefined();
      expect(osStyle.getConfigColor(strokeConfig, undefined, StyleField.FILL)).toBeUndefined();

      expect(osStyle.getConfigColor(colorConfig, undefined, StyleField.STROKE)).toBeUndefined();
      expect(osStyle.getConfigColor(fillConfig, undefined, StyleField.STROKE)).toBeUndefined();
      expect(osStyle.getConfigColor(imageConfig, undefined, StyleField.STROKE)).toBeUndefined();

      expect(osStyle.getConfigColor(colorConfig, undefined, StyleField.IMAGE)).toBeUndefined();
      expect(osStyle.getConfigColor(fillConfig, undefined, StyleField.IMAGE)).toBeUndefined();
      expect(osStyle.getConfigColor(strokeConfig, undefined, StyleField.IMAGE)).toBeUndefined();

      // hint is defined in config
      expect(osStyle.getConfigColor(fillConfig, false, StyleField.FILL)).toBe(testColor);
      expect(osStyle.getConfigColor(imageConfig, false, StyleField.IMAGE)).toBe(testColor);
      expect(osStyle.getConfigColor(strokeConfig, false, StyleField.STROKE)).toBe(testColor);

      expect(osStyle.getConfigColor(fillConfig, true, StyleField.FILL)).toEqual(testColorArray);
      expect(osStyle.getConfigColor(imageConfig, true, StyleField.IMAGE)).toEqual(testColorArray);
      expect(osStyle.getConfigColor(strokeConfig, true, StyleField.STROKE)).toEqual(testColorArray);

      // hint is undefined in config
      expect(osStyle.getConfigColor(undefinedFillConfig, undefined, StyleField.FILL)).toBeUndefined();
      expect(osStyle.getConfigColor(undefinedImageConfig, undefined, StyleField.IMAGE)).toBeUndefined();
      expect(osStyle.getConfigColor(undefinedStrokeConfig, undefined, StyleField.STROKE)).toBeUndefined();

      // hint is null in config
      expect(osStyle.getConfigColor(nullFillConfig, undefined, StyleField.FILL)).toBeNull();
      expect(osStyle.getConfigColor(nullImageConfig, undefined, StyleField.IMAGE)).toBeNull();
      expect(osStyle.getConfigColor(nullStrokeConfig, undefined, StyleField.STROKE)).toBeNull();
    });
  });

  describe('os.style.createFeatureStyle', function() {
    var base;
    var layer;
    var opacity = 0.25;

    // base style opacity (0.99) should be multiplied by the feature opacity (0.25)
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

      var feature = new Feature();
      feature.set(StyleType.FEATURE, base);

      expect(JSON.stringify(base)).toBe(baseExpected);
      expect(JSON.stringify(layer)).toBe(layerExpected);
    });

    it('should create styles with a new opacity value', function() {
      var feature = new Feature();
      feature.set(StyleType.FEATURE, base);
      feature.set(StyleField.OPACITY, opacity);
      feature.set('some_field', 'test');

      var style = osStyle.createFeatureStyle(feature, base, layer);

      // check all the colors and verify the rgba value
      expect(style.length).toBe(2);
      const featureRgba = [0, 255, 100, 0.2475];
      expect(style[0].image_.fill_.color_).toBe(toString(featureRgba));
      expect(style[0].stroke_.color_).toBe(toString(featureRgba));
      const labelRgba = [0, 123, 123, 0.2475];
      expect(style[1].text_.fill_.color_).toBe(toString(labelRgba));


      // attempt the same again with an empty base config
      // to make sure no exceptions are thrown
      feature = new Feature();
      feature.set(StyleType.FEATURE, {});
      feature.set(StyleField.OPACITY, opacity);
      feature.set('some_field', 'test');

      var style = osStyle.createFeatureStyle(feature, {}, layer);

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

      osStyle.mergeConfig(from, to);
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
      osStyle.mergeConfig(from, to);
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

      osStyle.mergeConfig(from, toMergeAll);
      expect(toMergeAll).toEqual(assign({}, toMergeAll, from));

      var toMergeSome = {
        'string': 'mergeSome',
        'number': -1
      };

      osStyle.mergeConfig(from, toMergeSome);
      expect(toMergeSome).toEqual(from);

      var toMergeSomeNested = {
        'nested': {},
        'string': 'mergeSomeNested'
      };

      osStyle.mergeConfig(from, toMergeSomeNested);
      expect(toMergeSomeNested).toEqual(from);
    });

    it('should use null for deletions', function() {
      var from = {'value': null};

      var to = {'value': {'color': 'red'}};

      osStyle.mergeConfig(from, to);
      expect(to).toEqual(from);

      var newAddition = {'value': {'color': 'blue'}};

      osStyle.mergeConfig(newAddition, to);
      expect(to).toEqual(newAddition);
    });

    it('should use undefined for inheritence', function() {
      // we've already tested implicit undefined above, so test explicit undefined
      var to = {'value': undefined};
      var from = {'value': 1};
      osStyle.mergeConfig(from, to);
      expect(to).toEqual(from);

      var to = {'stroke': undefined};
      var from = {'stroke': {'color': 'red'}};
      osStyle.mergeConfig(from, to);
      expect(to).toEqual(from);
    });

    it('should detect non-zero opacity fills', function() {
      var fill = new Fill();
      fill.setColor('rgba(1,1,1,1)');
      var style = new Style();
      style.setFill(fill);

      expect(osStyle.hasNonZeroFillOpacity(style)).toBe(true);
      fill.setColor('rgba(1,1,1,0)');
      expect(osStyle.hasNonZeroFillOpacity(style)).toBe(false);
    });

    it('should detect non-zero opacity strokes', function() {
      var stroke = new Stroke();
      stroke.setColor('rgba(1,1,1,1)');
      var style = new Style();
      style.setStroke(stroke);

      expect(osStyle.hasNonZeroStrokeOpacity(style)).toBe(true);
      stroke.setColor('rgba(1,1,1,0)');
      expect(osStyle.hasNonZeroStrokeOpacity(style)).toBe(false);
    });
  });

  describe('os.style.notifyStyleChange', function() {
    it('should send events at the layer level ONLY by default', function() {
      var source = new VectorSource();
      source.setId('style.test.js');

      var layer = new OLVectorLayer({source});
      var colormodel = source.createColorModel();
      source.setColorModel(colormodel);

      var on = {
        'layer': 0,
        'source': 0,
        'colormodel': 0
      };

      const layerListenKey = listen(layer, GoogEventType.PROPERTYCHANGE, function(evt) {
        on['layer']++;
      });

      const sourceListenKey = listen(source, GoogEventType.PROPERTYCHANGE, function(evt) {
        on['source']++;
      });

      const colorListenKey = listen(colormodel, GoogEventType.PROPERTYCHANGE, function(evt) {
        on['colormodel']++;
      });

      // the call being tested
      osStyle.notifyStyleChange(layer);

      expect(on['layer']).toBe(1);
      expect(on['source']).toBe(0);
      expect(on['colormodel']).toBe(0);

      unlistenByKey(layerListenKey);
      unlistenByKey(sourceListenKey);
      unlistenByKey(colorListenKey);
    });

    it('should send events at the layer, source, and colormodel levels when configured', function() {
      var source = new VectorSource();
      source.setId('style.test.js');

      var layer = new OLVectorLayer({source});
      var colormodel = source.createColorModel();
      source.setColorModel(colormodel);

      var on = {
        'layer': 0,
        'source': {
          'total': 0,
          'configured': 0
        },
        'colormodel': 0
      };

      const layerListenKey = listen(layer, GoogEventType.PROPERTYCHANGE, function(evt) {
        on['layer']++;
      });

      const sourceListenKey = listen(source, GoogEventType.PROPERTYCHANGE, function(evt) {
        on['source']['total']++;

        var p = evt.getProperty();
        switch (p) {
          case PropertyChange.VISIBLE:
          case PropertyChange.CLEARED:
            on['source']['configured']++;
            break;
          default:
            break;
        }
      });

      const colorListenKey = listen(colormodel, GoogEventType.PROPERTYCHANGE, function(evt) {
        on['colormodel']++;
      });

      // the call being tested
      osStyle.notifyStyleChange(
          layer,
          undefined,
          PropertyChange.VISIBLE,
          [PropertyChange.VISIBLE, PropertyChange.CLEARED], // 2
          true
      );

      expect(on['layer']).toBe(1);

      // Bumping the color model throws 3 extra propchange events on the source; don't test since
      // that is somewhat likely to change as more source propertychange types are added
      // expect(on['source']['total']).toBe(5);

      expect(on['source']['configured']).toBe(2);
      expect(on['colormodel']).toBe(1);

      unlistenByKey(layerListenKey);
      unlistenByKey(sourceListenKey);
      unlistenByKey(colorListenKey);
    });
  });
});

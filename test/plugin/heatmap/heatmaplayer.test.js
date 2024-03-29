goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.events');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.MapContainer');
goog.require('os.color');
goog.require('os.layer.LayerType');
goog.require('os.source.Vector');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.Heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.HeatmapPropertyType');
goog.require('plugin.heatmap.SynchronizerType');


describe('plugin.heatmap.Heatmap', function() {
  const GoogEventType = goog.module.get('goog.events.EventType');
  const googString = goog.module.get('goog.string');
  const Feature = goog.module.get('ol.Feature');
  const events = goog.module.get('ol.events');
  const LineString = goog.module.get('ol.geom.LineString');
  const MultiPoint = goog.module.get('ol.geom.MultiPoint');
  const MultiPolygon = goog.module.get('ol.geom.MultiPolygon');
  const Point = goog.module.get('ol.geom.Point');
  const Polygon = goog.module.get('ol.geom.Polygon');
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const color = goog.module.get('os.color');
  const {default: LayerType} = goog.module.get('os.layer.LayerType');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const heatmap = goog.module.get('plugin.heatmap');
  const {default: HeatmapLayerConfig} = goog.module.get('plugin.heatmap.HeatmapLayerConfig');
  const {default: HeatmapPropertyType} = goog.module.get('plugin.heatmap.HeatmapPropertyType');
  const {default: SynchronizerType} = goog.module.get('plugin.heatmap.SynchronizerType');

  var createLayer = function() {
    var options = {
      'id': googString.getRandomString(),
      'source': new VectorSource(),
      'title': 'My Heatmap',
      'animate': false,
      'layerType': LayerType.FEATURES,
      'explicitType': '',
      'type': heatmap.ID,
      'loadOnce': true
    };

    var layerConfig = new HeatmapLayerConfig();
    return layerConfig.createLayer(options);
  };

  var getPixel = function(coordinate) {
    return coordinate;
  };

  it('should initialize', function() {
    var layer = createLayer();

    expect(layer.getSize()).toBe(5);
    expect(layer.getIntensity()).toBe(25);
    expect(layer.getGradient()).toBe(color.THERMAL_HEATMAP_GRADIENT_HEX);
    expect(layer.getOSType()).toBe('Image');
    expect(layer.getTitle()).toBe('Heatmap - My Heatmap');
    expect(layer.getSynchronizerType()).toBe(SynchronizerType.HEATMAP);
  });

  xit('should draw points correctly', function() {
    var layer = createLayer();
    var feature = new Feature(new Point([5, 10]));
    var clone = heatmap.cloneFeature(feature);

    var context = layer.createImage(clone);

    /* eslint-disable-next-line max-len */
    expect(context.toDataURL()).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABIUlEQVQ4T8XV10oEQRCF4W8VTBgRFCMoCMb3fxAjCApGFMSICQyU1Mo6jBcLtltQ9PQw/Z/q02EaCkWjEFdHwCHahe5s4zniPfMt24+6Wf9WccB60I+BzOhHvOIx8yn7IfIj6sABDeAwRjGOsYTH4IBe4wo3uEMI/IBXwdHvS+AEpjCNSQxmSQ+4wBnOcZkCz/i2pQqOakcSOIcFLGKmAj7FAQ5xnAK3rVVXweFjVBrAJaxgFSEylBXfJ2wHu9hPgag8/P+KKjhsmMcy1rCODcxWPD7BJrawjT0cIeyoBccOiKk3gQGNDK97c8xLTj3AzQyBsCYW9n/BxawotnjFtluxAxIrWuRIN3dLkUuodSv++bVZd8W29a4jf5C2Kqx+/AkT13QXFOheRwAAAABJRU5ErkJggg==');
  });

  xit('should draw multipoints correctly', function() {
    spyOn(MapContainer.getInstance().getMap(), 'get2DPixelFromCoordinate').andCallFake(getPixel);
    var layer = createLayer();
    var feature = new Feature(new MultiPoint([[5, 10], [30, 50], [20, 12]]));
    var clone = heatmap.cloneFeature(feature);

    var context = layer.createImage(clone);
    /* eslint-disable-next-line max-len */
    expect(context.toDataURL()).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAyCAYAAADWU2JnAAAB/0lEQVRYR+3ZiWoUQRSF4S8G1ARXJAZXUBDUKL6Gz+Fb+AB5wriBoOCKirjiBi4cqIEmOG2V2mEgVVA0AzPT55669zb37yXTrSXsxxEcxwmcxDoOlNt+xAs8w/P8YKq1jMNFxBmcw3mc2ibmKR7g4ZRi9hZHIuICLuEyIuxgceADHuMO7k4pJkd0FhexgSu4itNYLWI+4Qm2cGtKMblhjmUmIkKykzv7ipivyZUiZmvXiFmoY1qoBF6o0l6oppeCiTsrOFQ68TEc3Vbab/Aab6espllnj6DkT0Sl3LPzOesb0muyP++EmNw099lTnMo1O+tH2d9z3SkxVc+/LmaeTd2Z7kxVCQ2+1HOm50zPmVYHes60Otb7TM+ZnjOtDuyKnKkaQfCzxr1/6TPVw1kZ1jIbja6I+ZvomsZWvM/EiFFBEZKx84+j5yC65oEeLzNL48vYkeWPg0ODR0eH8kF0sbqJYhaIGFz2bsydiLlWw2gH0cXqcN1qion7QavlPzLs/3ZFzPUaRjuILlaHWFZTTNzGPTwqRzVXzI0aRjuILuw2LLeaYs7QaoHPwR9zxdysYbSD6F4Vyj2JmM3CZ0cZ7SC64PW1qY6pVUzwenD7JAncekzB62G8Id1VLyhaSrs1gdPA0oGrX920NL3W0k7jyqqmmC2Pg9amN2vp//1B+Qv0Zf8FPX9LlQAAAABJRU5ErkJggg==');
  });

  xit('should draw polygons correctly', function() {
    spyOn(MapContainer.getInstance().getMap(), 'get2DPixelFromCoordinate').andCallFake(getPixel);
    var layer = createLayer();
    var feature = new Feature(new Polygon([[[5, 3], [30, 5], [32, 21], [12, 22], [5, 3]]]));
    var clone = heatmap.cloneFeature(feature);

    var context = layer.createImage(clone);
    /* eslint-disable-next-line max-len */
    expect(context.toDataURL()).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAnCAYAAACfdBHBAAAFLElEQVRYR9WZ144bRxBFS5Zly7ac4///nKOcc8Yh+hCXxZoZcvVgeIHG5OGp27drqnsf1f/479ELsL/Is9PP/nMvy0MA8hn3p3OdZQuunz86Pr/3XviEZT8bL/V4S8QEc3/a9nO87yr4W+En6JcWbN9uBdDBE5B92t9r63FurwK4B14oYG2Pq4rGsVuD2fJ1BxOY7VbzmYsAboFPawj9clVNzWBSffb7j3fgv6rK9mfse673yEmYW+FVEzign1TVK61xjsZ17/f9aZGurrB/VNXUNgM4gk+rJPirVUV7WlWvrS37BEQAWijh09cEIJTAv1fVb1X169qyzzmuG2D2wKHy/HhaBTCgX4/2RuwbAOoTQIrjgFR5gGgJ/XNV0X5ZzUC4h3t99uT9PeW76oKjNMBvtvYsekH1fcekOjCoCiDtp9V+qKof45hA7AF666z+LfDaRZsA/lZVvb3aO2tLMASQ6tNr/ql82gUo4AAH+Puq+m419g2C4LjXZ09iHMHz4w5QoLALkAC/W1XvrcY+wQDPPXg/B64pLr2uXbAJagP9bVV9vbbfrGC4RoCMAb2/C293qzow2AU4IIF+v6o+XFv2CYjAgKeX9H1XngD0OoqqOLCAf1VVz1cjGHqAALn3YuBuKe9ABV6vaxcgP1jgH60tx5zHTsLzXH6w0jbCo6iqAwz4F1X15donGHoEWwHPGDn7fg8+U2OqruIfVxWNADiHdRK+Z5wOjw1QFGVRHXjAP1+NADiH+sAT6CF8t4ypETAAURngTwKec1zTNpPnsY+eB0J4lEVhYAH/bDUCER5r3QxvrQIE8Ol1fA64TeWxjenyaMAKj6IoCyTwgH+6tgSCjQgOa5lxzPVjtsmPkgPVDJOqC++gNduQlax7ssYx12d+R1Hg9LrgbBOe+zJdEsDVFzYtk19TLEOGAT5Vx/Oc49qW3y3MtE3PNCif8IDT0jbTgB3h0zKoSJbBEgDuWYbeYWDTW1Nt0+HxMIoyWLvy2Ed4sw1jBLudS4SebTiecrvpEX+jtoOVYFSdIAm2p8jM86S5niZTeQcrlmEMMJDN85YIm/CqjmcZqCiJHRIecIKgmd9T9fyyTqUw6lkWMBCFN9uYLhnE9IpfWIszBDi9N5Wf/G4BlilScFS3LFD1KbdnUabyWEDbmG2wDgHYLBMyx1tZbsJby6C8X1Ug+RCZbdhaEkzp0VpmqiZNk1kaAGppQBDsW9uMpUEqbw9oG3xrIaZtrGfMLn6UCJBAu9enuSnKaxvLYK1jbcOW3mCgmiKvirIjeL+s+JkcDqzNMhhwxoXTv5w5nT8m8WVNeL+w2CJLYT9KBIXqzqisaU45/gg+K0kDsIa3dgd8qiC3VgGEz0Gr91HZiQj72iUHqr05wpsqnUwDZ1GGt4V26qddcsrXB2ifhGQAzlmd/vUpYM5hL+avk/KZ502Xej/nrSqedskljgTOuWsub5jv+8TbMiCnfqbHXEIZU2Xmepc4CMDmykFf5sgMc7SQlEFoodxa/6TPL8CnPM+5XA3LNRoD0VJ9gckPUoL3Zbw+FnpP9AWnfNfhcl+uGNgDlgtWikLr8768kct5OcDSs9OKmYFpkb5KpjjnGf1U26h+rtlsrUf25/uy3tbx3nplv3aleE+VsUJxsUw9rQD3pbx8NmuZ3E+A6XwPcro/f+ciVfYLKqqN+vE0F+gKdcisLrcCns5fQe8pP13rBdzmC6d/AqybrzwbL9m79iD4WwJ8SBB7z9x1bW/F7K4X/Rc3/wuzaKhGOLndqwAAAABJRU5ErkJggg==');
  });

  xit('should draw multipolygons correctly', function() {
    spyOn(MapContainer.getInstance().getMap(), 'get2DPixelFromCoordinate').andCallFake(getPixel);
    var layer = createLayer();
    var multiPolygon = new MultiPolygon([
      [[[5, 3], [30, 5], [32, 21], [12, 22], [5, 3]]],
      [[[50, 8], [170, 20], [190, 15], [60, 22], [50, 8]]],
      [[[5, 200], [220, 200], [205, 170], [300, 30], [5, 200]]]
    ]);
    var feature = new Feature(multiPolygon);
    var clone = heatmap.cloneFeature(feature);

    var context = layer.createImage(clone);
    /* eslint-disable-next-line max-len */
    expect(context.toDataURL()).toBe('data:image/png;base64,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');
  });

  xit('should draw linestrings correctly', function() {
    spyOn(MapContainer.getInstance().getMap(), 'get2DPixelFromCoordinate').andCallFake(getPixel);
    var layer = createLayer();
    var feature = new Feature(new LineString([[5, 10], [30, 50], [80, 50]]));
    var clone = heatmap.cloneFeature(feature);

    var context = layer.createImage(clone);
    /* eslint-disable-next-line max-len */
    expect(context.toDataURL()).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAF8AAAA8CAYAAAAALGYBAAAECklEQVR4Xu2ch46jQBBEay/nnKMu6uL/f8jlnPdyzvn0Tt0Sspwwg4cxjTSCZb0GHu3qGrbbS4olG4GlbEeOAyvgZwyCgN9j+Nz8FdL/T6Bvg6PEoPgrifHH1r498vbmvEigr5a01sYaW6/MGIxNDg30H5K+2/Bt9g9dcsHnuMDeLGmLpK225mf2l7j8kvRe0gdb+/bPrsEnugG9W9JeSXtsbC8YPhH/XNKLyprtb12Cj9ysM/CHJR2xcUjSjoLhf5H0UNIDW/s2+zshO8gNOo/MAP6UpNO25mcin9978mJdyvJR0q0h41NX4CM3GyXtk3RS0nkbbCM/fCI8cZGwfpdCXhLwb0u6OXADOgGfqAfuTklHJZ2TdFHSWUkHzemQnLgIkhYnTRIrZfncZdlBTnA2gEZqAH9B0jH7NJCYXlvCemmOoST4nH812XryzZ5wSbIbTFqOm9QAn5uA4yHiOdlHFj3Lkt4VFvlcQ+espnt6nAzOBpkh4tF7HM4qSa8k3ano5ZMC4ZOffGJVnWxlnWSRZJGb/eZqXG5O2H60/Z6kKzZwDEQ++0tKuJ17vFD19Gi7J9kzJkFEBaCvSbok6ar5ZLSfSUtJVrO2MWjz8cKgpwc4UY/c4HZ4pvPGbBngiXysGtqPcygp6muDb/vp4aCnR+cZTKyYTOECmA1etnFd0mPT+pHPQ2a6yo7+UVuRP87TH7BHxs8kAdzlBt0n8X5ddLnxWGgL/jhPj+VkEoXEeNSTZJ/aBGvh5aZN+JM8PTYMeUHjiXqin4dQb82qLXSSrSpg6sif1tPfMPDcgLuWZJGbkZ64o7Ld6LRSw5/W0yM3RD0PoZhQIUMlPUpoBL0N2QlPX/OWpIr88PQ1waf0+eHpM8EPTz8D+FSRH54+E/zw9DOCbxr54ekbgG8KPzx9Jvjh6RuCnzXyw9MnAD8r/PD0meCHp08EfpbID0+fCX54+oTg60R+ePrE4OvAD0+fCX54+hbATxP54elbAj8N/PD0meCHp28R/KTID0+fCb57eroEqSamvrJaTx+1NwluzKh/oFMzT9NatZ6eOksKXOmTpawvam8a3oBx8ClmpYuEsm7As6ZpjSJWKsy84qzXtTdN+E+CT6TTukM3CfKzzZoWqC6mzI+6erZ7UU/fBPSwv50kO1QUIz00NtDCQzchfUdUmd23jpLe1NPPCz7+fpPV0SM1tPTssm8IoVWTSKfEm8piGtd6UU8/L/g+s6Wcm8SL/nMz2E+7Dp0jVBUDvjf19POC73MAPgG076yvfCcCJdwUtQKd0Zt6+nnC92Ph+X34Pv8iH/9in9Tn1Yv3S1Uo2wtYqS8y4KcmWuP9An4NWKlfGvBTE63xfgG/BqzULw34qYnWeL9/XdqmTE4qWL4AAAAASUVORK5CYII=');
  });

  it('should fire events when setting heatmap properties', function() {
    var sizeCount = 0;
    var intensityCount = 0;
    var gradientCount = 0;
    var onPropertyChange = function(event) {
      var property = event.getProperty();
      if (property == HeatmapPropertyType.GRADIENT) {
        gradientCount++;
      } else if (property == HeatmapPropertyType.SIZE) {
        sizeCount++;
      } else if (property == HeatmapPropertyType.INTENSITY) {
        intensityCount++;
      }
    };

    var layer = createLayer();
    events.listen(layer, GoogEventType.PROPERTYCHANGE, onPropertyChange);

    layer.setSize(20);
    layer.setGradient(color.RAINBOW_HEATMAP_GRADIENT_HEX);
    layer.setIntensity(10);

    expect(gradientCount).toBe(1);
    expect(sizeCount).toBe(1);
    expect(intensityCount).toBe(1);
    events.unlisten(layer, GoogEventType.PROPERTYCHANGE, onPropertyChange);
  });

  it('should create styles and cache them for points', function() {
    var layer = createLayer();
    var feature = new Feature(new Point([5, 10]));
    var clone = heatmap.cloneFeature(feature);
    clone.setId('myId');

    var style = layer.styleFunc(clone, .5);
    expect(style.length).toBe(1);
    expect(style[0].getImage()).not.toBe(null);
    expect(layer.pointStyleCache_[layer.intensity_]).toBe(style);
  });
});

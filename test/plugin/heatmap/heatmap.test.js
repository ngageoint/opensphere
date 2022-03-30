goog.require('goog.string');
goog.require('os.Dispatcher');
goog.require('os.data.RecordField');
goog.require('os.events.LayerConfigEventType');
goog.require('os.layer.LayerType');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapField');
goog.require('plugin.heatmap.HeatmapLayerConfig');

import Feature from 'ol/src/Feature.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import Point from 'ol/src/geom/Point.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.heatmap', function() {
  const googString = goog.module.get('goog.string');
  const Dispatcher = goog.module.get('os.Dispatcher');
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: LayerConfigEventType} = goog.module.get('os.events.LayerConfigEventType');
  const {default: LayerType} = goog.module.get('os.layer.LayerType');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const style = goog.module.get('os.style');
  const heatmap = goog.module.get('plugin.heatmap');
  const {default: HeatmapField} = goog.module.get('plugin.heatmap.HeatmapField');
  const {default: HeatmapLayerConfig} = goog.module.get('plugin.heatmap.HeatmapLayerConfig');

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

  it('clones features', function() {
    var feature = new Feature(new MultiPoint([[5, 10], [30, 50], [25, 12]]));
    var clone = heatmap.cloneFeature(feature);

    var pointGeom = clone.getGeometry();
    var type = /** @type {string} */ (clone.get(HeatmapField.GEOMETRY_TYPE));
    var geom = /** @type {ol.geom.Geometry} */ (clone.get(HeatmapField.HEATMAP_GEOMETRY));
    var ellipse = /** @type {ol.geom.Geometry} */ (clone.get(RecordField.ELLIPSE));

    // check that it has a centered point geometry
    expect(pointGeom instanceof Point).toBe(true);
    expect(pointGeom.getCoordinates()).toEqual([17.5, 30]);

    expect(type).toBe('MultiPoint');
    expect(geom instanceof MultiPoint).toBe(true);
    expect(ellipse).toBe(undefined);
  });

  it('creates gradients', function() {
    // var thermal = plugin.heatmap.createGradient(os.color.THERMAL_HEATMAP_GRADIENT_HEX);
    // var rainbow = plugin.heatmap.createGradient(os.color.RAINBOW_HEATMAP_GRADIENT_HEX);

    // expect(thermal).toBe([]);
    // expect(rainbow).toBe([]);
  });

  it('should clone features without styles'), function() {
    var feature = new Feature(new Point([5, 10]));
    feature.setStyle(new Style(
        {
          fill: new Fill({
            color: style.toRgbaString('#fff')
          }),
          stroke: new Stroke({
            color: '#000',
            width: 1
          })
        }
    ));
    var clone = heatmap.cloneFeature(feature);

    expect(clone).toBeDefined();
    expect(clone.getStyle()).not().toBe(feature.getStyle());
  };

  it('should emit an event for a new heatmap layer based on an vector layer'), function() {
    var count = 0;
    var onEvent = function(e) {
      count++;
    };
    Dispatcher.getInstance().listen(src, LayerConfigEventType.CONFIGURE_AND_ADD, onEvent);

    var layer = createLayer();
    runs(function() {
      heatmap.createHeatmap(layer);
    });

    waitsFor(function() {
      return count > 0;
    }, 'add layer event to be fired');
  };
});

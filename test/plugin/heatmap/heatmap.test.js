goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.Dispatcher');
goog.require('os.data.RecordField');
goog.require('os.events.LayerConfigEventType');
goog.require('os.layer.LayerType');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapField');
goog.require('plugin.heatmap.HeatmapLayerConfig');


describe('plugin.heatmap', function() {
  const googString = goog.module.get('goog.string');
  const Feature = goog.module.get('ol.Feature');
  const MultiPoint = goog.module.get('ol.geom.MultiPoint');
  const Point = goog.module.get('ol.geom.Point');
  const Fill = goog.module.get('ol.style.Fill');
  const Stroke = goog.module.get('ol.style.Stroke');
  const Style = goog.module.get('ol.style.Style');
  const Dispatcher = goog.module.get('os.Dispatcher');
  const RecordField = goog.module.get('os.data.RecordField');
  const LayerConfigEventType = goog.module.get('os.events.LayerConfigEventType');
  const LayerType = goog.module.get('os.layer.LayerType');
  const VectorSource = goog.module.get('os.source.Vector');
  const style = goog.module.get('os.style');
  const heatmap = goog.module.get('plugin.heatmap');
  const HeatmapField = goog.module.get('plugin.heatmap.HeatmapField');
  const HeatmapLayerConfig = goog.module.get('plugin.heatmap.HeatmapLayerConfig');

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

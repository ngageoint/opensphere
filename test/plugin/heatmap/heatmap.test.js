goog.require('os.events.LayerConfigEventType');
goog.require('os.source.Vector');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');


describe('plugin.heatmap', function() {
  var createLayer = function() {
    var options = {
      'id': goog.string.getRandomString(),
      'source': new os.source.Vector(),
      'title': 'My Heatmap',
      'animate': false,
      'layerType': os.layer.LayerType.FEATURES,
      'explicitType': '',
      'type': plugin.heatmap.HeatmapLayerConfig.ID,
      'loadOnce': true
    };

    var layerConfig = new plugin.heatmap.HeatmapLayerConfig();
    return layerConfig.createLayer(options);
  };

  it('clones features', function() {
    var feature = new ol.Feature(new ol.geom.MultiPoint([[5, 10], [30, 50], [25, 12]]));
    var clone = plugin.heatmap.cloneFeature(feature);

    var pointGeom = clone.getGeometry();
    var type = /** @type {string} */ (clone.get(plugin.heatmap.HeatmapField.GEOMETRY_TYPE));
    var geom = /** @type {ol.geom.Geometry} */ (clone.get(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY));
    var ellipse = /** @type {ol.geom.Geometry} */ (clone.get(os.data.RecordField.ELLIPSE));

    // check that it has a centered point geometry
    expect(pointGeom instanceof ol.geom.Point).toBe(true);
    expect(pointGeom.getCoordinates()).toEqual([17.5, 30]);

    expect(type).toBe('MultiPoint');
    expect(geom instanceof ol.geom.MultiPoint).toBe(true);
    expect(ellipse).toBe(undefined);
  });

  it('creates gradients', function() {
    // var thermal = plugin.heatmap.createGradient(os.color.THERMAL_HEATMAP_GRADIENT_HEX);
    // var rainbow = plugin.heatmap.createGradient(os.color.RAINBOW_HEATMAP_GRADIENT_HEX);

    // expect(thermal).toBe([]);
    // expect(rainbow).toBe([]);
  });

  it('should clone features without styles'), function() {
    var feature = new ol.Feature(new ol.geom.Point([5, 10]));
    feature.setStyle(new ol.style.Style(
        {
          fill: new ol.style.Fill({
            color: os.style.toRgbaString('#fff')
          }),
          stroke: new ol.style.Stroke({
            color: '#000',
            width: 1
          })
        }
    ));
    var clone = plugin.heatmap.cloneFeature(feature);

    expect(clone).toBeDefined();
    expect(clone.getStyle()).not().toBe(feature.getStyle());
  };

  it('should emit an event for a new heatmap layer based on an vector layer'), function() {
    var count = 0;
    var onEvent = function(e) {
      count++;
    };
    os.dispatcher.listen(src, os.events.LayerConfigEventType.CONFIGURE_AND_ADD, onEvent);

    var layer = createLayer();
    runs(function() {
      plugin.heatmap.createHeatmap(layer);
    });

    waitsFor(function() {
      return count > 0;
    }, 'add layer event to be fired');
  };
});

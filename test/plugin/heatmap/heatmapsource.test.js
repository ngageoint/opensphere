goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapSource');


describe('plugin.heatmap.HeatmapSource', function() {
  it('clones features', function() {
    var feature = new ol.Feature(new ol.geom.MultiPoint([[5, 10], [30, 50], [25, 12]]));
    var clone = plugin.heatmap.HeatmapSource.clone(feature);

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
    var thermal = plugin.heatmap.HeatmapSource.createGradient(os.color.THERMAL_HEATMAP_GRADIENT_HEX);
    var rainbow = plugin.heatmap.HeatmapSource.createGradient(os.color.RAINBOW_HEATMAP_GRADIENT_HEX);

    // expect(thermal).toBe([]);
    // expect(rainbow).toBe([]);
  });
});

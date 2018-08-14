goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.cmd.Intensity');


describe('plugin.heatmap.cmd.Intensity', function() {
  var createLayer = function() {
    var options = {
      'id': 'heatmapLayer',
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

  it('should execute by setting the new intensity value and revert by setting the old', function() {
    var layer = createLayer();

    spyOn(plugin.heatmap.cmd.Intensity.prototype, 'getLayer').andCallFake(function() {
      return layer;
    });
    var cmd = new plugin.heatmap.cmd.Intensity('heatmapLayer', 3);

    cmd.execute();
    expect(layer.getIntensity()).toBe(3);

    cmd.revert();
    expect(layer.getIntensity()).toBe(25);
  });
});

goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.cmd.Gradient');


describe('plugin.heatmap.cmd.Gradient', function() {
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

  it('should execute by setting the new gradient value and revert by setting the old', function() {
    var layer = createLayer();

    spyOn(plugin.heatmap.cmd.Gradient.prototype, 'getLayer').andCallFake(function() {
      return layer;
    });
    var cmd = new plugin.heatmap.cmd.Gradient('heatmapLayer', os.color.RAINBOW_HEATMAP_GRADIENT_HEX);

    cmd.execute();
    expect(layer.getGradient()).toEqual(os.color.RAINBOW_HEATMAP_GRADIENT_HEX);

    cmd.revert();
    expect(layer.getGradient()).toBe(os.color.THERMAL_HEATMAP_GRADIENT_HEX);
  });
});

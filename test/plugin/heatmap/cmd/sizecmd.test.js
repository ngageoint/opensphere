goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.cmd.Size');


describe('plugin.heatmap.cmd.Size', function() {
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

  it('should execute by setting the new size value and revert by setting the old', function() {
    var layer = createLayer();

    spyOn(plugin.heatmap.cmd.Size.prototype, 'getLayer').andCallFake(function() {
      return layer;
    });
    var cmd = new plugin.heatmap.cmd.Size('heatmapLayer', 20);

    cmd.execute();
    expect(layer.getSize()).toBe(20);

    cmd.revert();
    expect(layer.getSize()).toBe(5);
  });
});

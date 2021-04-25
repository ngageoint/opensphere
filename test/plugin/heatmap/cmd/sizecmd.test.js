goog.require('os.layer.LayerType');
goog.require('os.source.Vector');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.cmd.Size');


describe('plugin.heatmap.cmd.Size', function() {
  const LayerType = goog.module.get('os.layer.LayerType');
  const VectorSource = goog.module.get('os.source.Vector');
  const heatmap = goog.module.get('plugin.heatmap');
  const HeatmapLayerConfig = goog.module.get('plugin.heatmap.HeatmapLayerConfig');
  const Size = goog.module.get('plugin.heatmap.cmd.Size');

  var createLayer = function() {
    var options = {
      'id': 'heatmapLayer',
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

  it('should execute by setting the new size value and revert by setting the old', function() {
    var layer = createLayer();

    spyOn(Size.prototype, 'getLayer').andCallFake(function() {
      return layer;
    });
    var cmd = new Size('heatmapLayer', 20);

    cmd.execute();
    expect(layer.getSize()).toBe(20);

    cmd.revert();
    expect(layer.getSize()).toBe(5);
  });
});

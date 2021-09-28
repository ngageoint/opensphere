goog.require('os.layer.LayerType');
goog.require('os.source.Vector');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.cmd.Intensity');


describe('plugin.heatmap.cmd.Intensity', function() {
  const {default: LayerType} = goog.module.get('os.layer.LayerType');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const heatmap = goog.module.get('plugin.heatmap');
  const {default: HeatmapLayerConfig} = goog.module.get('plugin.heatmap.HeatmapLayerConfig');
  const {default: Intensity} = goog.module.get('plugin.heatmap.cmd.Intensity');

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

  it('should execute by setting the new intensity value and revert by setting the old', function() {
    var layer = createLayer();

    spyOn(Intensity.prototype, 'getLayer').andCallFake(function() {
      return layer;
    });
    var cmd = new Intensity('heatmapLayer', 3);

    cmd.execute();
    expect(layer.getIntensity()).toBe(3);

    cmd.revert();
    expect(layer.getIntensity()).toBe(25);
  });
});

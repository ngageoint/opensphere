goog.require('os.color');
goog.require('os.layer.LayerType');
goog.require('os.source.Vector');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.cmd.Gradient');


describe('plugin.heatmap.cmd.Gradient', function() {
  const osColor = goog.module.get('os.color');
  const {default: LayerType} = goog.module.get('os.layer.LayerType');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const heatmap = goog.module.get('plugin.heatmap');
  const {default: HeatmapLayerConfig} = goog.module.get('plugin.heatmap.HeatmapLayerConfig');
  const {default: Gradient} = goog.module.get('plugin.heatmap.cmd.Gradient');

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

  it('should execute by setting the new gradient value and revert by setting the old', function() {
    var layer = createLayer();

    spyOn(Gradient.prototype, 'getLayer').andCallFake(function() {
      return layer;
    });
    var cmd = new Gradient('heatmapLayer', osColor.RAINBOW_HEATMAP_GRADIENT_HEX);

    cmd.execute();
    expect(layer.getGradient()).toEqual(osColor.RAINBOW_HEATMAP_GRADIENT_HEX);

    cmd.revert();
    expect(layer.getGradient()).toBe(osColor.THERMAL_HEATMAP_GRADIENT_HEX);
  });
});

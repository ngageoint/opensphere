goog.require('os.data.event.DataEvent');
goog.require('os.source.Vector');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.HeatmapPlugin');


describe('plugin.heatmap.HeatmapPlugin', function() {
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

  it('should register the appropriate stuffs', function() {
    var p = new plugin.heatmap.HeatmapPlugin();
    p.init();

    var lcm = os.layer.config.LayerConfigManager.getInstance();
    var lc = lcm.getLayerConfig(plugin.heatmap.HeatmapLayerConfig.ID);
    expect(lc instanceof plugin.heatmap.HeatmapLayerConfig).toBe(true);
    lcm.layerConfigs_ = {};

    var layer = createLayer();
    var sm = os.olcs.sync.SynchronizerManager.getInstance();
    var synchronizer = sm.getSynchronizer(layer);
    expect(synchronizer).toBe(plugin.heatmap.HeatmapSynchronizer);
    sm.synchronizers_ = {};

    var dm = os.dataManager;
    var source = new os.source.Vector();

    var event = new os.data.event.DataEvent(os.data.event.DataEventType.SOURCE_ADDED, source);
    dm.dispatchEvent(event);
    expect(source.getSupportsAction(plugin.heatmap.action.EventType.GENERATE_HEATMAP)).toBe(true);

    var manager = os.action.layer.manager;
    expect(manager.getAction(plugin.heatmap.action.EventType.EXPORT)).not.toBe(null);
    expect(manager.getAction(plugin.heatmap.action.EventType.GENERATE_HEATMAP)).not.toBe(null);
  });
});

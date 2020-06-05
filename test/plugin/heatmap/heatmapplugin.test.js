goog.require('os.data.event.DataEvent');
goog.require('os.source.Vector');
goog.require('os.ui.menu.layer');
goog.require('os.webgl.SynchronizerManager');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.HeatmapPlugin');
goog.require('plugin.heatmap.menu');


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
    os.ui.menu.layer.setup();

    var p = new plugin.heatmap.HeatmapPlugin();
    p.init();

    var lcm = os.layer.config.LayerConfigManager.getInstance();
    var lc = lcm.getLayerConfig(plugin.heatmap.HeatmapLayerConfig.ID);
    expect(lc instanceof plugin.heatmap.HeatmapLayerConfig).toBe(true);
    lcm.layerConfigs_ = {};

    var layer = createLayer();
    var sm = os.webgl.SynchronizerManager.getInstance();
    var synchronizer = sm.getSynchronizer(layer);
    expect(synchronizer).toBe(plugin.cesium.sync.HeatmapSynchronizer);
    sm.synchronizers_ = {};

    var dm = os.dataManager;
    var source = new os.source.Vector();

    var event = new os.data.event.DataEvent(os.data.event.DataEventType.SOURCE_ADDED, source);
    dm.dispatchEvent(event);
    expect(source.getSupportsAction(plugin.heatmap.menu.EventType.GENERATE_HEATMAP)).toBe(true);

    var menu = os.ui.menu.layer.MENU;
    // expect(menu.getRoot().find(plugin.heatmap.menu.EventType.EXPORT)).not.toBe(null);
    expect(menu.getRoot().find(plugin.heatmap.menu.EventType.GENERATE_HEATMAP)).not.toBe(null);

    os.ui.menu.layer.dispose();
  });
});

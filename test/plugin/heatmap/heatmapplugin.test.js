goog.require('goog.string');
goog.require('os.data.DataManager');
goog.require('os.data.event.DataEvent');
goog.require('os.data.event.DataEventType');
goog.require('os.layer.LayerType');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.source.Vector');
goog.require('os.ui.menu.layer');
goog.require('os.webgl.SynchronizerManager');
goog.require('plugin.cesium.sync.HeatmapSynchronizer');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.HeatmapPlugin');
goog.require('plugin.heatmap.SynchronizerType');
goog.require('plugin.heatmap.menu');


describe('plugin.heatmap.HeatmapPlugin', function() {
  const googString = goog.module.get('goog.string');
  const DataManager = goog.module.get('os.data.DataManager');
  const DataEvent = goog.module.get('os.data.event.DataEvent');
  const DataEventType = goog.module.get('os.data.event.DataEventType');
  const LayerType = goog.module.get('os.layer.LayerType');
  const LayerConfigManager = goog.module.get('os.layer.config.LayerConfigManager');
  const VectorSource = goog.module.get('os.source.Vector');
  const layerMenu = goog.module.get('os.ui.menu.layer');
  const SynchronizerManager = goog.module.get('os.webgl.SynchronizerManager');
  const heatmap = goog.module.get('plugin.heatmap');
  const HeatmapLayerConfig = goog.module.get('plugin.heatmap.HeatmapLayerConfig');
  const HeatmapPlugin = goog.module.get('plugin.heatmap.HeatmapPlugin');
  const SynchronizerType = goog.module.get('plugin.heatmap.SynchronizerType');
  const heatmapMenu = goog.module.get('plugin.heatmap.menu');
  const HeatmapSynchronizer = goog.module.get('plugin.cesium.sync.HeatmapSynchronizer');

  var createLayer = function() {
    var options = {
      'id': googString.getRandomString(),
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

  it('should register the appropriate stuffs', function() {
    layerMenu.setup();

    var p = new HeatmapPlugin();
    p.init();

    var lcm = LayerConfigManager.getInstance();
    var lc = lcm.getLayerConfig(heatmap.ID);
    expect(lc instanceof HeatmapLayerConfig).toBe(true);
    lcm.layerConfigs_ = {};

    var layer = createLayer();
    var sm = SynchronizerManager.getInstance();

    // now is registered by the WebGLRenderer (e.g. Cesium) plugin; spoof it
    sm.registerSynchronizer(SynchronizerType.HEATMAP, HeatmapSynchronizer);

    var synchronizer = sm.getSynchronizer(layer);
    expect(synchronizer).toBe(HeatmapSynchronizer);
    sm.synchronizers_ = {};

    var dm = DataManager.getInstance();
    var source = new VectorSource();

    var event = new DataEvent(DataEventType.SOURCE_ADDED, source);
    dm.dispatchEvent(event);
    expect(source.getSupportsAction(heatmapMenu.EventType.GENERATE_HEATMAP)).toBe(true);

    var menu = layerMenu.MENU;
    // expect(menu.getRoot().find(plugin.heatmap.menu.EventType.EXPORT)).not.toBe(null);
    expect(menu.getRoot().find(heatmapMenu.EventType.GENERATE_HEATMAP)).not.toBe(null);

    layerMenu.dispose();
  });
});

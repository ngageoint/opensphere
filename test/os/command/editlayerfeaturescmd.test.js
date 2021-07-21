goog.require('os.MapContainer');
goog.require('os.command.EditLayerFeatures');
goog.require('os.command.LayerAdd');
goog.require('os.command.State');
goog.require('os.layer');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');

describe('os.command.addFeature', function() {
  const MapContainer = goog.module.get('os.MapContainer');
  const EditLayerFeatures = goog.module.get('os.command.EditLayerFeatures');
  const LayerAdd = goog.module.get('os.command.LayerAdd');
  const State = goog.module.get('os.command.State');
  const LayerConfigManager = goog.module.get('os.layer.config.LayerConfigManager');
  const MockTileLayerConfig = goog.module.get('os.layer.config.MockTileLayerConfig');

  var testLayerId = 'test-layer';
  var testOptions = {
    'id': testLayerId,
    'type': MockTileLayerConfig.TYPE
  };

  var addCommand;
  it('should be able to add a layer', function() {
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    addCommand = new LayerAdd(testOptions);
    addCommand.execute();
    expect(MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);
  });

  it('should fail with no null passed for feature data', function() {
    var command = new EditLayerFeatures('test-layer', null, true);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('should fail with incorrect ID passed for layer', function() {
    var command = new EditLayerFeatures('does not exist', null, true);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('should be able to remove the layer added', function() {
    expect(addCommand.revert()).toBe(true);
    expect(addCommand.state).toBe(State.READY);
    expect(MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

goog.require('os.MapContainer');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerVisibility');
goog.require('os.command.State');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');

import MockTileLayerConfig from '../layer/config/tilelayerconfig.mock.js';

describe('os.command.addFeature', function() {
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: LayerAdd} = goog.module.get('os.command.LayerAdd');
  const {default: LayerVisibility} = goog.module.get('os.command.LayerVisibility');
  const {default: State} = goog.module.get('os.command.State');
  const {default: LayerConfigManager} = goog.module.get('os.layer.config.LayerConfigManager');

  var testLayerId = 'test-layer';
  var testOptions = {
    'id': testLayerId,
    'type': MockTileLayerConfig.TYPE
  };

  it('should fail with no layer', function() {
    var command = new LayerVisibility('test-layer', true);
    expect(command.execute()).toBe(false);
  });

  var addCommand;
  it('should be able to add a layer', function() {
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    addCommand = new LayerAdd(testOptions);
    addCommand.execute();
    expect(MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);
  });

  it('should be able to', function() {
    var command = new LayerVisibility('test-layer', true);
    expect(command.execute()).toBe(true);
    expect(command.state).toBe(State.SUCCESS);
  });

  it('should be able to remove the layer added', function() {
    expect(addCommand.revert()).toBe(true);
    expect(addCommand.state).toBe(State.READY);
    expect(MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

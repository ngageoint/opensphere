goog.require('os.MapContainer');
goog.require('os.command.LayerAdd');
goog.require('os.command.State');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');

import MockTileLayerConfig from '../layer/config/tilelayerconfig.mock.js';


describe('os.command.LayerAdd', function() {
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: LayerAdd} = goog.module.get('os.command.LayerAdd');
  const {default: State} = goog.module.get('os.command.State');
  const {default: LayerConfigManager} = goog.module.get('os.layer.config.LayerConfigManager');

  var testLayerId = 'test-layer';
  var testOptions = {
    'id': testLayerId,
    'type': MockTileLayerConfig.TYPE
  };

  beforeEach(function() {
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE,
        MockTileLayerConfig);
  });

  it('should fail when layer options arent provided', function() {
    var command = new LayerAdd(null);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('should fail when id isnt provided', function() {
    var command = new LayerAdd({'type': MockTileLayerConfig.TYPE});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('should fail when type isnt provided', function() {
    var command = new LayerAdd({'id': 'nope'});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('should fail when type doesnt exist', function() {
    var command = new LayerAdd({'id': 'nope', 'type': 'superNope'});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('should add/remove a layer to the map', function() {
    var command = new LayerAdd(testOptions);
    expect(command.execute()).toBe(true);
    expect(command.state).toBe(State.SUCCESS);
    expect(MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    expect(command.revert()).toBe(true);
    expect(command.state).toBe(State.READY);
    expect(MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

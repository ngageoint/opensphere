goog.require('os.MapContainer');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.command.State');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');


describe('os.command.LayerRemove', function() {
  const MapContainer = goog.module.get('os.MapContainer');
  const LayerAdd = goog.module.get('os.command.LayerAdd');
  const LayerRemove = goog.module.get('os.command.LayerRemove');
  const State = goog.module.get('os.command.State');
  const LayerConfigManager = goog.module.get('os.layer.config.LayerConfigManager');

  const MockTileLayerConfig = goog.module.get('os.layer.config.MockTileLayerConfig');

  var testLayerId = 'test-layer';
  var testOptions = {
    'id': testLayerId,
    'type': MockTileLayerConfig.TYPE
  };

  beforeEach(function() {
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
  });

  it('should fail when layer options arent provided', function() {
    var command = new LayerRemove(null);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);
  });

  it('revert should fail when id isnt provided', function() {
    var add = new LayerAdd(testOptions);
    add.execute();
    expect(MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    var command = new LayerRemove({'type': MockTileLayerConfig.TYPE});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(State.ERROR);

    MapContainer.getInstance().removeLayer(testLayerId);
    expect(MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });

  it('should add/remove a layer to the map', function() {
    var add = new LayerAdd(testOptions);
    add.execute();
    expect(MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    var remove = new LayerRemove(testOptions);
    expect(remove.execute()).toBe(true);
    expect(remove.state).toBe(State.SUCCESS);
    expect(MapContainer.getInstance().getLayer(testLayerId)).toBe(null);

    expect(remove.revert()).toBe(true);
    expect(remove.state).toBe(State.READY);
    expect(MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    MapContainer.getInstance().removeLayer(testLayerId);
    expect(MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

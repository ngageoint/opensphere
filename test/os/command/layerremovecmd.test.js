goog.require('os.MapContainer');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');


describe('os.command.LayerRemove', function() {
  var testLayerId = 'test-layer';
  var testOptions = {
    'id': testLayerId,
    'type': os.layer.config.MockLayerConfig.TYPE
  };

  beforeEach(function() {
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
  });

  it('should fail when layer options arent provided', function() {
    var command = new os.command.LayerRemove(null);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('revert should fail when id isnt provided', function() {
    var add = new os.command.LayerAdd(testOptions);
    add.execute();
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    var command = new os.command.LayerRemove({'type': os.layer.config.MockLayerConfig.TYPE});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);

    os.MapContainer.getInstance().removeLayer(testLayerId);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });

  it('should add/remove a layer to the map', function() {
    var add = new os.command.LayerAdd(testOptions);
    add.execute();
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    var remove = new os.command.LayerRemove(testOptions);
    expect(remove.execute()).toBe(true);
    expect(remove.state).toBe(os.command.State.SUCCESS);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).toBe(null);

    expect(remove.revert()).toBe(true);
    expect(remove.state).toBe(os.command.State.READY);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    os.MapContainer.getInstance().removeLayer(testLayerId);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

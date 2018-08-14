goog.require('os.MapContainer');
goog.require('os.command.LayerAdd');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');


describe('os.command.LayerAdd', function() {
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
    var command = new os.command.LayerAdd(null);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('should fail when id isnt provided', function() {
    var command = new os.command.LayerAdd({'type': os.layer.config.MockLayerConfig.TYPE});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('should fail when type isnt provided', function() {
    var command = new os.command.LayerAdd({'id': 'nope'});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('should fail when type doesnt exist', function() {
    var command = new os.command.LayerAdd({'id': 'nope', 'type': 'superNope'});
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('should add/remove a layer to the map', function() {
    var command = new os.command.LayerAdd(testOptions);
    expect(command.execute()).toBe(true);
    expect(command.state).toBe(os.command.State.SUCCESS);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);

    expect(command.revert()).toBe(true);
    expect(command.state).toBe(os.command.State.READY);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

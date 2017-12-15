goog.require('os.MapContainer');
goog.require('os.command.EditLayerFeatures');
goog.require('os.command.LayerAdd');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockLayerConfig');
goog.require('os.mock');
goog.require('os.style.StyleManager');



describe('os.command.addFeature', function() {
  var testLayerId = 'test-layer';
  var testOptions = {
    'id': testLayerId,
    'type': os.layer.config.MockLayerConfig.TYPE
  };

  var addCommand;
  it('should be able to add a layer', function() {
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
    addCommand = new os.command.LayerAdd(testOptions);
    addCommand.execute();
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);
  });

  it('should fail with no null passed for feature data', function() {
    var command = new os.command.EditLayerFeatures('test-layer', null, true);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('should fail with incorrect ID passed for layer', function() {
    var command = new os.command.EditLayerFeatures('does not exist', null, true);
    expect(command.execute()).toBe(false);
    expect(command.state).toBe(os.command.State.ERROR);
  });

  it('should be able to remove the layer added', function() {
    expect(addCommand.revert()).toBe(true);
    expect(addCommand.state).toBe(os.command.State.READY);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

goog.require('os.MapContainer');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerVisibility');
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

  it('should fail with no layer', function() {
    var command = new os.command.LayerVisibility('test-layer', true);
    expect(command.execute()).toBe(false);
  });

  var addCommand;
  it('should be able to add a layer', function() {
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);
    addCommand = new os.command.LayerAdd(testOptions);
    addCommand.execute();
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).not.toBe(null);
  });

  it('should be able to', function() {
    var command = new os.command.LayerVisibility('test-layer', true);
    expect(command.execute()).toBe(true);
    expect(command.state).toBe(os.command.State.SUCCESS);
  });

  it('should be able to remove the layer added', function() {
    expect(addCommand.revert()).toBe(true);
    expect(addCommand.state).toBe(os.command.State.READY);
    expect(os.MapContainer.getInstance().getLayer(testLayerId)).toBe(null);
  });
});

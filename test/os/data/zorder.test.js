goog.require('os.MapContainer');
goog.require('os.data.ZOrder');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockLayerConfig');
goog.require('os.mock');


describe('os.data.ZOrder', function() {
  var z = null;
  var map = os.MapContainer.getInstance();

  it('setup', function() {
    os.layerConfigManager = os.layer.config.LayerConfigManager.getInstance();
    os.layerConfigManager.registerLayerConfig(os.layer.config.MockLayerConfig.TYPE,
        os.layer.config.MockLayerConfig);

    z = os.data.ZOrder.getInstance();
    z.clear();

    // clear the map
    var groups = z.getMap().getLayers().getArray();

    for (var i = 0, n = groups.length; i < n; i++) {
      groups[i].getLayers().clear();
    }

    expect(groups.length).toBe(5);
  });

  it('should init to an empty object', function() {
    z.init_();

    expect(goog.object.getCount(z.groups_)).toBe(0);
  });

  it('should merge in map layers from an empty map', function() {
    z.mergeFromMap_();

    // One might expect "Map Layers" to be in here, but it is provided by the
    // base map plugin.
    expect(z.groups_['Tile Layers'].length).toBe(0);
    expect(z.groups_['Feature Layers'].length).toBe(0);
    expect(z.groups_['Reference Layers'].length).toBe(0);
    z.clear();
  });

  it('should merge in map layers from a non-empty map', function() {
    var lc = os.layerConfigManager.getLayerConfig(os.layer.config.MockLayerConfig.TYPE);
    map.addLayer(lc.createLayer({id: 'layer1'}));
    map.addLayer(lc.createLayer({id: 'layer2'}));
    map.addLayer(lc.createLayer({id: 'layer3'}));

    z.init_();
    z.mergeFromMap_();

    expect(z.groups_['Tile Layers'].length).toBe(3);
  });

  it('should move layers after other layers', function() {
    z.moveAfter('layer2', 'layer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('layer3');
    expect(z.groups_['Tile Layers'][2].id).toBe('layer2');
  });

  it('should move layers before other layers', function() {
    z.moveBefore('layer3', 'layer1');
    expect(z.groups_['Tile Layers'][0].id).toBe('layer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('layer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('layer2');
  });

  it('should still work if given the same IDs', function() {
    z.moveAfter('layer2', 'layer2');
    expect(z.groups_['Tile Layers'][0].id).toBe('layer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('layer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('layer2');

    z.moveBefore('layer2', 'layer2');
    expect(z.groups_['Tile Layers'][0].id).toBe('layer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('layer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('layer2');
  });

  it('should update the map from the z-order data', function() {
    z.update();
    var tileLayers = map.getMap().getLayers().getArray()[1].getLayers().getArray();
    expect(tileLayers[0].getId()).toBe('layer3');
    expect(tileLayers[1].getId()).toBe('layer1');
    expect(tileLayers[2].getId()).toBe('layer2');
  });

  it('should save and restore properly', function() {
    z.save();
    z.groups_ = null;
    z.init_();

    expect(z.groups_['Tile Layers'][0].id).toBe('layer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('layer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('layer2');
  });

  it('should expire old data', function() {
    z.groups_['Tile Layers'][1].time = goog.now() - 31 * 24 * 60 * 60 * 1000;
    map.getMap().getLayers().getArray()[1].getLayers().getArray().splice(1, 1);

    z.save();
    z.groups_ = null;
    z.init_();

    expect(z.groups_['Tile Layers'][0].id).toBe('layer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('layer2');
  });

  it('should clean up', function() {
    var groups = z.getMap().getLayers().getArray();
    groups[2].get('layers').push(map.drawingLayer_);
  });
});

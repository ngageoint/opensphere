goog.require('goog.object');
goog.require('os.MapContainer');
goog.require('os.data.ZOrder');
goog.require('os.data.ZOrderEventType');
goog.require('os.layer');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.layer.config.MockVectorLayerConfig');
goog.require('os.map.instance');
goog.require('os.mock');

import MockTileLayerConfig from '../layer/config/tilelayerconfig.mock.js';
import MockVectorLayerConfig from '../layer/config/vectorlayerconfig.mock.js';

describe('os.data.ZOrder', function() {
  const googObject = goog.module.get('goog.object');
  const {default: ZOrder} = goog.module.get('os.data.ZOrder');
  const {default: ZOrderEventType} = goog.module.get('os.data.ZOrderEventType');
  const {default: LayerConfigManager} = goog.module.get('os.layer.config.LayerConfigManager');
  const {getMapContainer} = goog.module.get('os.map.instance');

  var z = null;
  var map;

  beforeEach(() => {
    map = getMapContainer();
  });

  it('setup', function() {
    os.layerConfigManager = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockVectorLayerConfig.TYPE, MockTileLayerConfig);
    LayerConfigManager.getInstance().registerLayerConfig(MockVectorLayerConfig.TYPE, MockVectorLayerConfig);

    z = ZOrder.getInstance();
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

    expect(googObject.getCount(z.groups_)).toBe(0);
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
    var tlc = LayerConfigManager.getInstance().getLayerConfig(MockTileLayerConfig.TYPE);
    map.addLayer(tlc.createLayer({id: 'tileLayer1'}));
    map.addLayer(tlc.createLayer({id: 'tileLayer2'}));
    map.addLayer(tlc.createLayer({id: 'tileLayer3'}));

    var vlc = LayerConfigManager.getInstance().getLayerConfig(MockVectorLayerConfig.TYPE);
    map.addLayer(vlc.createLayer({id: 'vectorLayer1'}));
    map.addLayer(vlc.createLayer({id: 'vectorLayer2'}));

    z.init_();
    z.mergeFromMap_();

    expect(z.groups_['Tile Layers'].length).toBe(3);
    expect(z.groups_['Feature Layers'].length).toBe(2);
  });

  it('should move layers after other layers', function() {
    z.moveAfter('tileLayer2', 'tileLayer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('tileLayer3');
    expect(z.groups_['Tile Layers'][2].id).toBe('tileLayer2');

    z.moveAfter('vectorLayer1', 'vectorLayer2');
    expect(z.groups_['Feature Layers'][0].id).toBe('vectorLayer2');
    expect(z.groups_['Feature Layers'][1].id).toBe('vectorLayer1');
  });

  it('should move layers before other layers', function() {
    z.moveBefore('tileLayer3', 'tileLayer1');
    expect(z.groups_['Tile Layers'][0].id).toBe('tileLayer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('tileLayer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('tileLayer2');
  });

  it('should still work if given the same IDs', function() {
    z.moveAfter('tileLayer2', 'tileLayer2');
    expect(z.groups_['Tile Layers'][0].id).toBe('tileLayer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('tileLayer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('tileLayer2');

    z.moveBefore('tileLayer2', 'tileLayer2');
    expect(z.groups_['Tile Layers'][0].id).toBe('tileLayer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('tileLayer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('tileLayer2');

    z.moveAfter('vectorLayer2', 'vectorLayer2');
    expect(z.groups_['Feature Layers'][0].id).toBe('vectorLayer2');
    expect(z.groups_['Feature Layers'][1].id).toBe('vectorLayer1');

    z.moveBefore('vectorLayer2', 'vectorLayer2');
    expect(z.groups_['Feature Layers'][0].id).toBe('vectorLayer2');
    expect(z.groups_['Feature Layers'][1].id).toBe('vectorLayer1');
  });

  it('should get the z-order type for a layer ID', () => {
    let type = z.getZType('tileLayer3');
    expect(type).toBe('Tile Layers');

    type = z.getZType('vectorLayer2');
    expect(type).toBe('Feature Layers');
  });

  it('should get the z-order index for a layer ID', () => {
    let index = z.getIndex('tileLayer3');
    expect(index).toBe(0);

    index = z.getIndex('vectorLayer1');
    expect(index).toBe(1);
  });

  it('should update the map from the z-order data', function() {
    var groups = z.getMap().getLayers().getArray();
    groups.forEach(function(group) {
      spyOn(group, 'dispatchEvent');
    });

    z.update();

    // verify layer order change was detected and notified
    groups.forEach(function(group) {
      var type = group.getOSType();
      if (type === 'Tile Layers' || type === 'Feature Layers') {
        expect(group.dispatchEvent).toHaveBeenCalledWith(ZOrderEventType.UPDATE);
      } else {
        expect(group.dispatchEvent).not.toHaveBeenCalled();
      }
    });

    var tileLayers = map.getMap().getLayers().getArray()[0].getLayers().getArray();
    expect(tileLayers[0].getId()).toBe('tileLayer3');
    expect(tileLayers[1].getId()).toBe('tileLayer1');
    expect(tileLayers[2].getId()).toBe('tileLayer2');
  });

  it('should save and restore properly', function() {
    z.save();
    z.groups_ = null;
    z.init_();

    expect(z.groups_['Tile Layers'][0].id).toBe('tileLayer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('tileLayer1');
    expect(z.groups_['Tile Layers'][2].id).toBe('tileLayer2');
  });

  it('should expire old data', function() {
    z.groups_['Tile Layers'][1].time = Date.now() - 31 * 24 * 60 * 60 * 1000;
    map.getMap().getLayers().getArray()[0].getLayers().getArray().splice(1, 1);

    z.save();
    z.groups_ = null;
    z.init_();

    expect(z.groups_['Tile Layers'][0].id).toBe('tileLayer3');
    expect(z.groups_['Tile Layers'][1].id).toBe('tileLayer2');
  });

  it('should clean up', function() {
    var groups = z.getMap().getLayers().getArray();
    groups[1].get('layers').push(map.drawingLayer_);
  });
});

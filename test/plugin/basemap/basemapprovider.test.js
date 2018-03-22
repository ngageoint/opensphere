goog.require('goog.events.EventTarget');
goog.require('os.mock');
goog.require('plugin.basemap.BaseMapProvider');

describe('plugin.basemap.BaseMapProvider', function() {
  var expectedTerrainType = 'testTerrain';
  var expectedTerrainOptions = {};

  var config = {
    defaults: {
      'EPSG:4326': ['two']
    },
    maps: {
      one: {
        type: 'BaseMap',
        title: 'First Map'
      },
      two: {
        type: 'BaseMap',
        title: 'Second Map'
      },
      three: {
        type: 'NotABaseMap',
        title: 'Ignore Me'
      },
      four: {
        type: plugin.basemap.TERRAIN_TYPE,
        baseType: expectedTerrainType,
        options: expectedTerrainOptions
      }
    },
    userMaps: {
      five: {
        type: 'BaseMap',
        title: 'Third Map'
      }
    }
  };

  var p = new plugin.basemap.BaseMapProvider();

  it('should configure from both maps and userMaps', function() {
    var terrainType;
    var terrainOptions;
    spyOn(os.MapContainer, 'getInstance').andReturn({
      setTerrainProvider: function(type, options) {
        terrainType = type;
        terrainOptions = options;
      }
    });

    p.configure(config);

    // it should've added four descriptors to the data manager, since unrecognized types should be ignored
    var dm = os.dataManager;

    // base maps are identified from config
    expect(dm.getDescriptor('basemap#one')).toBeTruthy();
    expect(dm.getDescriptor('basemap#two')).toBeTruthy();
    expect(dm.getDescriptor('basemap#five')).toBeTruthy();

    // terrain is given a static identifier
    expect(dm.getDescriptor(p.getTerrainId())).toBeTruthy();

    // no descriptor id from NotABaseMap type or terrain
    expect(dm.getDescriptor('basemap#three')).toBeFalsy();
    expect(dm.getDescriptor('basemap#four')).toBeFalsy();

    expect(p.getLabel()).toBe('Map Layers');
    expect(p.defaults_).toContain('two');

    // terrain is configured on the map
    expect(terrainType).toBe(expectedTerrainType);
    expect(terrainOptions).toBe(expectedTerrainOptions);
  });

  it('should load descriptors', function() {
    var dm = os.dataManager;

    expect(p.getDescriptors().length).toBe(4);
    expect(p.getChildren()).toBeFalsy();

    p.load(false);

    // should have four descriptors, three for base maps and one for terrain
    expect(p.getChildren().length).toBe(4);
    expect(dm.getDescriptor('basemap#two').isActive()).toBe(true);
    expect(dm.getDescriptor('basemap#five').canDelete()).toBe(true);
  });

  it('can remove descriptors', function() {
    var descriptor = os.dataManager.getDescriptor(p.getTerrainId());
    expect(descriptor).toBeTruthy();

    p.removeDescriptor(descriptor);
    expect(p.getChildren().length).toBe(3);
  });
});

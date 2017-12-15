goog.require('goog.events.EventTarget');
goog.require('os.mock');
goog.require('plugin.basemap.BaseMapProvider');

describe('plugin.basemap.BaseMapProvider', function() {
  it('should configure from both maps and userMaps', function() {
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
        }
      },
      userMaps: {
        four: {
          type: 'BaseMap',
          title: 'Third Map'
        }
      }
    };

    var p = new plugin.basemap.BaseMapProvider();
    p.configure(config);

    // it should've added three descriptors to the data manager, since unrecognized types should be ignored
    var dm = os.dataManager;

    expect(dm.getDescriptor('basemap#one')).toBeTruthy();
    expect(dm.getDescriptor('basemap#two')).toBeTruthy();
    expect(dm.getDescriptor('basemap#four')).toBeTruthy();
    expect(p.getLabel()).toBe('Map Layers');
    expect(p.defaults_).toContain('two');

    p.load(false);

    expect(p.getChildren().length).toBe(3);
    expect(dm.getDescriptor('basemap#two').isActive()).toBe(true);
    expect(dm.getDescriptor('basemap#four').canDelete()).toBe(true);
  });
});

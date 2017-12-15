goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsObjectStorage');
goog.require('os.data.ProviderEntry');
goog.require('os.data.BaseDescriptor');
goog.require('os.MapContainer');
goog.require('os.data.OSDataManager');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.data.MockProvider');
goog.require('os.layer.Tile');
goog.require('os.mock');
goog.require('ol.source.TileWMS');
goog.require('test.os.config.SettingsUtil');


describe('os.data.OSDataManager', function() {
  it('should register provider types', function() {
    var dm = os.dataManager;
    var entry = new os.data.ProviderEntry('mock', os.data.MockProvider, 'Mock Provider', 'This is a test', '');
    dm.registerProviderType(entry);
    expect(dm.providerTypes_['mock']).toBe(entry);
  });

  it('should not register provider types with the same type', function() {
    var dm = os.dataManager;
    var entry = new os.data.ProviderEntry('mock', null, '', '', '');
    dm.registerProviderType(entry);
    expect(dm.providerTypes_['mock']).not.toBe(entry);
  });

  it('should register descriptor types', function() {
    var dm = os.dataManager;
    dm.registerDescriptorType('base', os.data.BaseDescriptor);
    expect(dm.descriptorTypes_['base']).toBe(os.data.BaseDescriptor);
  });

  it('should not register descriptor types with the same type', function() {
    var dm = os.dataManager;
    dm.registerDescriptorType('base', 'yermom');
    expect(dm.descriptorTypes_['base']).not.toBe('yermom');
  });

  it('should allow overrides of descriptor types', function() {
    var dm = os.dataManager;
    dm.registerDescriptorType('base', 'yermom', true);
    expect(dm.descriptorTypes_['base']).toBe('yermom');

    // change it back for the rest of the tests
    dm.registerDescriptorType('base', os.data.BaseDescriptor, true);
  });

  it('should configure providers and load them', function() {
    var dm = os.dataManager;

    var settings = new os.config.Settings();
    settings.getStorageRegistry().addStorage(new os.config.storage.SettingsObjectStorage(['unit']));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      settings.set(['providers', 'thing1', 'type'], 'mock');
      settings.set(['providers', 'thing1', 'test'], 'A');
      settings.set(['userProviders', 'thing2', 'type'], 'mock');
      settings.set(['userProviders', 'thing2', 'test'], 'B');
      settings.set(['userProviders', 'thing2', 'enabled'], false);
      settings.set(['userProviders', 'ufo', 'type'], 'unknown');
      settings.set(['userProviders', 'ufo', 'probingYou'], true);

      dm.updateFromSettings(settings);

      // should have created two providers of type mock
      var list = dm.providerRoot_.getChildren();

      expect(list.length).toBe(2);
      expect(list[0].getEnabled()).toBe(true);
      expect(list[0].test).toBe('A');
      expect(list[0].loaded).toBe(true);
      expect(list[0].getId()).toBe('thing1');

      expect(list[1].getEnabled()).toBe(false);
      expect(list[1].test).toBe('B');
      expect(list[1].loaded).toBe(undefined);
      expect(list[1].getId()).toBe('thing2');
    });
  });

  it('should find descriptors with a prefix', function() {
    var dm = os.dataManager;

    var d = new os.data.BaseDescriptor();
    d.setId('testy');
    d.setProvider('mock');
    d.setTitle('Testy');
    d.setType('Typo');
    d.setColor('FF00FF');
    d.setDescription('some text');
    d.setMaxDate(100);
    d.setActive(true);
    d.getAliases = function() {
      return ['testy', 'testy#yermom'];
    };

    var other = new os.data.BaseDescriptor();
    other.setId('other');
    other.setProvider('mock');
    other.setTitle('Other');
    other.setType('bogus');

    var d2 = new os.data.BaseDescriptor();
    d2.setId('testy2');

    dm.addDescriptor(d);
    dm.addDescriptor(d2);
    dm.addDescriptor(other);

    var list = dm.getDescriptors('testy');

    expect(list.length).toBe(2);

    list = dm.getDescriptors('bogus');

    expect(list.length).toBe(0);
  });

  it('should get opensphere sources from layers on the map', function() {
    var layerId = 'test#layer1';

    var dm = os.dataManager;
    expect(dm.getSource(layerId)).toBeNull();

    var source = new os.source.Vector();
    var layer = new os.layer.Vector({
      source: source
    });

    layer.setId(layerId);
    source.setId(layerId);

    try {
      os.MapContainer.getInstance().addLayer(layer);
    } catch (e) {
      // catch the unimplemented method error
    }

    expect(dm.getSource(layerId)).not.toBeNull();

    try {
      os.MapContainer.getInstance().removeLayer(layer);
    } catch (e) {
      // catch the unimplemented method error
    }

    expect(dm.getSource(layerId)).toBeNull();
    layer.dispose();
  });

  it('should save and restore descriptors which have been recently active', function() {
    var dm = os.dataManager;

    var d = dm.descriptors_['testy'];
    delete dm.descriptors_['testy2'];
    dm.persistDescriptors();

    delete dm.descriptors_['testy'];
    delete dm.descriptors_['other'];

    expect(dm.descriptors_['testy']).toBeFalsy();

    dm.restoreDescriptors();
    var o = dm.descriptors_['testy'];

    expect(dm.descriptors_['other']).toBe(undefined);
    expect(o).toBeTruthy();
    expect(o.getId()).toBe(d.getId());
    expect(o.getProvider()).toBe(d.getProvider());
    expect(o.getTitle()).toBe(d.getTitle());
    expect(o.getType()).toBe(d.getType());
    expect(o.getColor()).toBe(d.getColor());
    expect(o.getDescription()).toBe(d.getDescription());
    expect(o.getMaxDate()).toBe(d.getMaxDate());
    expect(isNaN(o.getMinDate())).toBe(true);
    expect(o.getDescriptorType()).toBe(d.getDescriptorType());
  });
});

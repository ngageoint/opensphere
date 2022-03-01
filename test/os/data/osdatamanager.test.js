goog.require('os.MapContainer');
goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsObjectStorage');
goog.require('os.data');
goog.require('os.data.BaseDescriptor');
goog.require('os.data.DataManager');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.data.MockProvider');
goog.require('os.data.ProviderEntry');
goog.require('os.layer.Tile');
goog.require('os.layer.Vector');
goog.require('os.map.instance');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('test.os.config.SettingsUtil');


describe('os.data.DataManager', function() {
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {default: SettingsObjectStorage} = goog.module.get('os.config.storage.SettingsObjectStorage');
  const data = goog.module.get('os.data');
  const {default: BaseDescriptor} = goog.module.get('os.data.BaseDescriptor');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: ProviderEntry} = goog.module.get('os.data.ProviderEntry');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {getMapContainer} = goog.module.get('os.map.instance');

  const MockProvider = goog.module.get('os.data.MockProvider');
  const SettingsUtil = goog.module.get('test.os.config.SettingsUtil');

  it('should register provider types', function() {
    var dm = DataManager.getInstance();
    var entry = new ProviderEntry('mock', MockProvider, 'Mock Provider', 'This is a test', '');
    dm.registerProviderType(entry);
    expect(dm.providerTypes_['mock']).toBe(entry);
  });

  it('should not register provider types with the same type', function() {
    var dm = DataManager.getInstance();
    var entry = new ProviderEntry('mock', null, '', '', '');
    dm.registerProviderType(entry);
    expect(dm.providerTypes_['mock']).not.toBe(entry);
  });

  it('should register descriptor types', function() {
    var dm = DataManager.getInstance();
    dm.registerDescriptorType('base', BaseDescriptor);
    expect(dm.descriptorTypes_['base']).toBe(BaseDescriptor);
  });

  it('should not register descriptor types with the same type', function() {
    var dm = DataManager.getInstance();
    dm.registerDescriptorType('base', 'yermom');
    expect(dm.descriptorTypes_['base']).not.toBe('yermom');
  });

  it('should allow overrides of descriptor types', function() {
    var dm = DataManager.getInstance();
    dm.registerDescriptorType('base', 'yermom', true);
    expect(dm.descriptorTypes_['base']).toBe('yermom');

    // change it back for the rest of the tests
    dm.registerDescriptorType('base', BaseDescriptor, true);
  });

  it('should configure providers and load them', function() {
    var dm = DataManager.getInstance();

    var settings = new Settings();
    settings.getStorageRegistry().addStorage(new SettingsObjectStorage(['unit']));

    SettingsUtil.initAndLoad(settings);

    runs(function() {
      settings.set([data.ProviderKey.ADMIN, 'thing1', 'type'], 'mock');
      settings.set([data.ProviderKey.ADMIN, 'thing1', 'test'], 'A');
      settings.set([data.ProviderKey.USER, 'thing2', 'type'], 'mock');
      settings.set([data.ProviderKey.USER, 'thing2', 'test'], 'B');
      settings.set([data.ProviderKey.USER, 'thing2', 'enabled'], false);
      settings.set([data.ProviderKey.USER, 'ufo', 'type'], 'unknown');
      settings.set([data.ProviderKey.USER, 'ufo', 'probingYou'], true);

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
    var dm = DataManager.getInstance();

    var d = new BaseDescriptor();
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

    var other = new BaseDescriptor();
    other.setId('other');
    other.setProvider('mock');
    other.setTitle('Other');
    other.setType('bogus');

    var d2 = new BaseDescriptor();
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

    var dm = DataManager.getInstance();
    expect(dm.getSource(layerId)).toBeNull();

    var source = new VectorSource();
    var layer = new VectorLayer({
      source: source
    });

    layer.setId(layerId);
    source.setId(layerId);

    try {
      getMapContainer().addLayer(layer);
    } catch (e) {
      // catch the unimplemented method error
    }

    expect(dm.getSource(layerId)).not.toBeNull();

    try {
      getMapContainer().removeLayer(layer);
    } catch (e) {
      // catch the unimplemented method error
    }

    expect(dm.getSource(layerId)).toBeNull();
    layer.dispose();
  });

  it('should save and restore descriptors which have been recently active', function() {
    var dm = DataManager.getInstance();

    var d = dm.descriptors_['testy'];
    delete dm.descriptors_['testy2'];
    dm.persistDescriptors_();

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

goog.require('os.data.ConfigDescriptor');
goog.require('os.layer.LayerType');

describe('os.data.ConfigDescriptor', function() {
  var tileConfig = {
    'id': 'config#descriptor#tiles',
    'type': 'WMS',
    'layerType': os.layer.LayerType.TILES,
    'crossOrigin': 'none',
    'description': 'This is a test of a tile layer',
    'descriptorType': 'testType',
    'maxZoom': 9,
    'minZoom': 2,
    'params': {
      'LAYERS': 'blue_marble'
    },
    'projection': 'EPSG:4326',
    'provider': 'Some Service',
    'proxy': false,
    'title': 'Blue Marble Test',
    'tags': ['test', 'tile'],
    'url': 'http://localhost/bogus/wms',
    'icons': '<tile><time>'
  };

  var featureConfig = {
    'id': 'config#descriptor#features',
    'type': 'GeoJSON',
    'layerType': os.layer.LayerType.FEATURES,
    'crossOrigin': 'anonymous',
    'description': 'This is a test of a GeoJSON layer.',
    'provider': 'Some Service\'s GeoJSON stuff',
    'title': 'GeoJSON Test',
    'tags': ['test', 'feature'],
    'url': 'http://localhost/bogus/test.geojson',
    'icons': '<feature><time>'
  };

  var bareConfig = {
    'id': 'config#descriptor#bare',
    'type': 'GeoJSON',
    'url': 'http://localhost/bogus/test.geojson'
  };

  [bareConfig, tileConfig].forEach(function(config) {
    it('should get id from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getId()).toEqual(config.id);
    });

    it('should get own id if set', function() {
      var id = 'test#descriptor#id';
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      d.setId(id);
      expect(d.getId()).toEqual(id);
    });

    it('should get title from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getTitle()).toEqual(config.title);
    });

    it('should get type from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getType()).toEqual(config.layerType);
    });

    it('should get provider from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getProvider()).toEqual(config.provider);
    });

    it('should get description from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getDescription()).toEqual(config.description);
    });

    it('should get tags from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getTags()).toEqual(config.tags);
    });

    it('should get descriptor type from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getDescriptorType()).toBe(config.descriptorType || 'config');
    });

    it('should get icons from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getIcons()).toBe(config.icons || '');
    });

    it('should get search type from config', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.getSearchType() || '').toBe((config.layerType || '').toLowerCase().replace(/s$/, ''));
    });

    it('should match URLs', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      expect(d.matchesURL('https://nope.com')).toBe(false);
      expect(d.matchesURL(config.url)).toBe(true);
      expect(d.matchesURL('http://localhost/bogus')).toBe(false);
    });

    it('should persist properly', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      var obj = d.persist();
      expect(obj.base).toEqual(config);
    });

    it('should restore properly', function() {
      var d = new os.data.ConfigDescriptor();
      d.setBaseConfig(config);
      var obj = d.persist();
      d = new os.data.ConfigDescriptor();
      d.restore(obj);
      expect(d.getBaseConfig()).toEqual(config);
    });
  });

  // Multi Layer Tests
  it('should get id from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getId()).toBe('config#descriptor#');
  });

  it('should get title from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getTitle()).toBe(tileConfig.title);
  });

  it('should get type from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getType()).toBe(os.layer.LayerType.GROUPS);
  });

  it('should get provider from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getProvider()).toBe(tileConfig.provider);
  });

  it('should get description from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getDescription()).toBe(tileConfig.description + '\n\n' + featureConfig.description);
  });

  it('should get tags from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getTags()).toEqual(['test', 'tile', 'feature']);
  });

  it('should get descriptor type from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getDescriptorType()).toBe(tileConfig.descriptorType);
  });

  it('should get icons from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getIcons()).toBe(tileConfig.icons + featureConfig.icons);
  });

  it('should determine icons from multiple configs', function() {
    var config1 = Object.assign({}, tileConfig);
    delete config1['icons'];
    var config2 = Object.assign({}, featureConfig);
    delete config2['icons'];

    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([config1]);
    expect(d.getIcons()).toBe(os.ui.Icons.TILES);

    d.setBaseConfig([config1, config2]);
    expect(d.getIcons()).toBe(os.ui.Icons.TILES + os.ui.Icons.FEATURES);

    config1['animate'] = true;
    config2['animate'] = true;
    d.setBaseConfig([config1, config2]);
    expect(d.getIcons()).toBe(os.ui.Icons.TILES + os.ui.Icons.FEATURES + os.ui.Icons.TIME);
  });

  it('should get search type from multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.getSearchType()).toBe(os.layer.LayerType.GROUPS.toLowerCase().replace(/s$/, ''));
  });

  it('should match URLs in multiple configs', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    expect(d.matchesURL('https://nope.com')).toBe(false);
    expect(d.matchesURL(tileConfig.url)).toBe(true);
    expect(d.matchesURL(featureConfig.url)).toBe(true);
    expect(d.matchesURL('http://localhost/bogus')).toBe(false);
  });

  it('should persist multiple configs properly', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    var obj = d.persist();
    expect(obj.base).toEqual([tileConfig, featureConfig]);
  });

  it('should restore from configs properly', function() {
    var d = new os.data.ConfigDescriptor();
    d.setBaseConfig([tileConfig, featureConfig]);
    var obj = d.persist();
    d = new os.data.ConfigDescriptor();
    d.restore(obj);
    expect(d.getBaseConfig()).toEqual([tileConfig, featureConfig]);
  });
});

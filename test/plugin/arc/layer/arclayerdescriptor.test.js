goog.require('plugin.arc.ArcPlugin');
goog.require('plugin.arc.layer.ArcLayerDescriptor');


describe('plugin.arc.layer.ArcLayerDescriptor', function() {
  var config = {
    'name': 'My Little Arc Layer',
    'description': 'The Power of Arc Layers',
    'id': 'someLayerId',
    'extent': {
      'wkid': 4326,
      'xmin': 40,
      'ymin': 20,
      'xmax': 60,
      'ymax': 56
    },
    'timeInfo': {
      'startTimeField': 'start_field',
      'endTimeField': 'end_field',
      'timeExtent': [99999, 1010101010]
    },
    'drawingInfo': {
      'renderer': {
        'symbol': {
          'color': [56, 0, 112, 1]
        }
      }
    },
    'fields': [
      {
        'name': 'GEOMETRY',
        'type': 'esriFieldTypeGeometry'
      },
      {
        'name': 'NAME',
        'type': 'esriFieldTypeString'
      },
      {
        'name': 'FREQUENCY',
        'type': 'esriFieldTypeNumber'
      }
    ],
    'capabilities': 'Map,Query,Data'
  };

  var mapConfig = {
    'name': 'Map-Only Arc Layer',
    'description': 'An arc layer that only supports tiles',
    'id': 'someLayerId',
    'extent': {
      'wkid': 4326,
      'xmin': 40,
      'ymin': 20,
      'xmax': 60,
      'ymax': 56
    },
    'drawingInfo': {
      'renderer': {
        'symbol': {
          'color': [56, 0, 112, 1]
        }
      }
    },
    'fields': null,
    'capabilities': 'Map,Query'
  };

  it('should provide its type correctly based on the layer it represents', function() {
    var d = new plugin.arc.layer.ArcLayerDescriptor();

    d.setTilesEnabled(true);
    expect(d.getType()).toBe(os.layer.LayerType.TILES);
    expect(d.getIcons()).toBe(os.ui.Icons.TILES);

    d.setTilesEnabled(false);
    d.setFeaturesEnabled(true);
    expect(d.getType()).toBe(os.layer.LayerType.FEATURES);
    expect(d.getIcons()).toBe(os.ui.Icons.FEATURES);

    d.setTilesEnabled(true);
    d.setFeaturesEnabled(true);
    expect(d.getType()).toBe(os.layer.LayerType.GROUPS);
    expect(d.getIcons()).toBe(os.ui.Icons.TILES + os.ui.Icons.FEATURES);
  });

  it('should configure itself', function() {
    var d = new plugin.arc.layer.ArcLayerDescriptor();
    var id = 'someLayerId';
    var url = 'https://some.fake.arc.layer/arcgis/rest/services/MyLayer';

    d.configureDescriptor(config, id, url);

    expect(d.getUrl()).toBe(url);
    expect(d.getId()).toBe(id);
    expect(d.getTitle()).toBe(config.name);
    expect(d.getDescription()).toBe(config.description);
    expect(d.getLayerId()).toBe(id);
    expect(d.getExtent()).toEqual([40, 20, 60, 56]);
    expect(d.hasTimeExtent()).toBe(true);
    expect(d.getMinDate()).toBe(99999);
    expect(d.getMaxDate()).toBe(1010101010);

    var featureType = d.getFeatureType();
    expect(featureType).not.toBe(null);
    expect(featureType.getColumns()[0]['name']).toBe('FREQUENCY');
    expect(featureType.getColumns()[0]['type']).toBe('decimal');
    expect(featureType.getColumns()[1]['name']).toBe('GEOMETRY');
    expect(featureType.getColumns()[1]['type']).toBe('gml');
    expect(featureType.getColumns()[2]['name']).toBe('NAME');
    expect(featureType.getColumns()[2]['type']).toBe('string');

    expect(d.getTilesEnabled()).toBe(true);
    expect(d.getFeaturesEnabled()).toBe(true);
  });

  it('should configure itself', function() {
    var d = new plugin.arc.layer.ArcLayerDescriptor();
    var id = 'someLayerId';
    var url = 'https://some.fake.arc.layer/arcgis/rest/services/MyLayer';

    d.configureDescriptor(mapConfig, id, url);

    expect(d.getUrl()).toBe(url);
    expect(d.getId()).toBe(id);
    expect(d.getTitle()).toBe(mapConfig.name);
    expect(d.getDescription()).toBe(mapConfig.description);
    expect(d.getLayerId()).toBe(id);
    expect(d.getExtent()).toEqual([40, 20, 60, 56]);

    var featureType = d.getFeatureType();
    expect(featureType).toBe(null);

    expect(d.getTilesEnabled()).toBe(true);
    expect(d.getFeaturesEnabled()).toBe(false);
  });

  it('should return the correct tile layer params', function() {
    var d = new plugin.arc.layer.ArcLayerDescriptor();
    var id = 'someLayerId';
    var url = 'https://some.fake.arc.layer/arcgis/rest/services/MyLayer';

    d.configureDescriptor(config, id, url);

    var tileOptions = d.getTileOptions();
    var params = tileOptions['params'];
    expect(params.get('layers')).toBe('show: someLayerId');
    expect(tileOptions['type']).toBe('arctile');
    expect(tileOptions['id']).toBe('someLayerId#tiles');
    expect(tileOptions['layerType']).toBe('Tile and Feature Groups');
    expect(tileOptions['animate']).toBe(true);
    expect(tileOptions['url']).toBe('https://some.fake.arc.layer/arcgis/rest/services/MyLayer');
    expect(tileOptions['title']).toBe('My Little Arc Layer');
    expect(tileOptions['baseColor']).toBe('#380070');
    expect(tileOptions['extent']).toEqual([40, 20, 60, 56]);
    expect(tileOptions['timeParam']).toBe('time');
    expect(tileOptions['timeFormat']).toBe('{start},{end}');
    expect(tileOptions['dateFormat']).toBe('timestamp');
  });

  it('should return the correct feature layer params', function() {
    var d = new plugin.arc.layer.ArcLayerDescriptor();
    var id = 'someLayerId';
    var url = 'https://some.fake.arc.layer/arcgis/rest/services/MyLayer';

    d.configureDescriptor(config, id, url);

    var featureOptions = d.getFeatureOptions();
    var params = featureOptions['params'];
    expect(params.get('f')).toBe('json');
    expect(params.get('inSR')).toBe('4326');
    expect(params.get('outSR')).toBe('4326');
    expect(params.get('outFields')).toBe('*');
    expect(params.get('geometryType')).toBe('esriGeometryPolygon');
    expect(params.get('geometry')).toBe('{geom}');
    expect(params.get('returnIdsOnly')).toBe('true');
    expect(params.get('time')).toBe('{time}');

    expect(featureOptions['type']).toBe('arcfeature');
    expect(featureOptions['id']).toBe('someLayerId#features');
    expect(featureOptions['layerType']).toBe('Tile and Feature Groups');
    expect(featureOptions['animate']).toBe(true);
    expect(featureOptions['url']).toBe('https://some.fake.arc.layer/arcgis/rest/services/MyLayer/someLayerId/query');
    expect(featureOptions['title']).toBe('My Little Arc Layer');
    expect(featureOptions['spatial']).toBe(true);
    expect(featureOptions['temporal']).toBe(true);
    expect(featureOptions['filter']).toBe(true);
  });
});

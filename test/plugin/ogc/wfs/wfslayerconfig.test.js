goog.require('goog.net.XhrIo');
goog.require('plugin.ogc.wfs.WFSLayerConfig');


describe('plugin.ogc.wfs.WFSLayerConfig', function() {
  const preferredTypes = plugin.ogc.wfs.WFSLayerConfig.TYPE_CONFIGS;
  const avroConfig = {
    regex: /^avro\/binary$/,
    parser: 'avro',
    type: 'avro',
    priority: 500,
    responseType: goog.net.XhrIo.ResponseType.ARRAY_BUFFER
  };

  it('should use provided outputformat given available supported server formats', function() {
    ['application/json', 'gml3', 'gml2'].forEach((format, i) => {
      const wfs = new plugin.ogc.wfs.WFSLayerConfig();
      const config = {
        'url': 'https://example.com/geoserver/ogc',
        'params': {
          'typename': 'test#layer1',
          'outputformat': format
        },
        'formats': ['kml', 'something', 'application/json', 'gml2', 'gml3']
      };

      wfs.initializeConfig(config);
      const result = wfs.getBestType(config);
      expect(result).toBe(preferredTypes[i]);
      expect(wfs.params.get('outputformat')).toBe(format);
    });
  });

  it('should use the provided outputformat if the application supports it', function() {
    ['application/json', 'gml3', 'gml2'].forEach((format, i) => {
      const wfs = new plugin.ogc.wfs.WFSLayerConfig();
      const config = {
        'url': 'https://example.com/geoserver/ogc',
        'params': {
          'typename': 'test#layer1',
          'outputformat': format
        }
      };

      wfs.initializeConfig(config);
      const result = wfs.getBestType(config);
      expect(result).toBe(preferredTypes[i]);
      expect(wfs.params.get('outputformat')).toBe(format);
    });
  });

  it('should default to formats supported by the application and the server', function() {
    const wfs = new plugin.ogc.wfs.WFSLayerConfig();
    const config = {
      'url': 'https://example.com/geoserver/ogc',
      'params': {
        'typename': 'test#layer1',
        'outputformat': 'somebogusformat'
      },
      'formats': ['GML3', 'gml2', 'application/json']
    };

    wfs.initializeConfig(config);
    const result = wfs.getBestType(config);
    expect(result).toBe(preferredTypes[0]);
    expect(wfs.params.get('outputformat')).toBe('application/json');
  });

  it('should default to a format supported by the application', function() {
    const wfs = new plugin.ogc.wfs.WFSLayerConfig();
    const config = {
      'url': 'https://example.com/geoserver/ogc',
      'params': {
        'typename': 'test#layer1',
        'outputformat': 'somebogusformat'
      }
    };

    wfs.initializeConfig(config);
    const result = wfs.getBestType(config);
    expect(result).toBe(preferredTypes[1]);
    expect(wfs.params.get('outputformat')).toBe(undefined);
  });

  it('should default to a format supported by both the application and the server', function() {
    const wfs = new plugin.ogc.wfs.WFSLayerConfig();
    const config = {
      'url': 'https://example.com/geoserver/ogc',
      'params': {
        'typename': 'test#layer1',
        'outputformat': 'somebogusformat'
      },
      'formats': ['application/json', 'gml3', 'GML2']
    };

    wfs.initializeConfig(config);
    const result = wfs.getBestType(config);
    expect(result).toBe(preferredTypes[0]);
    expect(wfs.params.get('outputformat')).toBe('application/json');
  });

  it('should register new type configs and sort them by priority', function() {
    plugin.ogc.wfs.WFSLayerConfig.registerType(avroConfig);

    expect(preferredTypes.length).toBe(4);
    expect(preferredTypes[0]).toBe(avroConfig);
  });

  it('should select new type configs if they match a layer', function() {
    const wfs = new plugin.ogc.wfs.WFSLayerConfig();
    const config = {
      'url': 'https://example.com/geoserver/ogc',
      'params': {
        'typename': 'test#layer1',
        'outputformat': 'avro/binary'
      },
      'formats': ['application/json', 'avro/binary', 'gml3', 'GML2']
    };

    wfs.initializeConfig(config);
    const result = wfs.getBestType(config);
    expect(result).toBe(avroConfig);
    expect(wfs.params.get('outputformat')).toBe('avro/binary');
  });

  it('should respect the responseType defined on a type config', function() {
    const wfs = new plugin.ogc.wfs.WFSLayerConfig();
    const config = {
      'url': 'https://example.com/geoserver/ogc',
      'params': {
        'typename': 'test#layer1',
        'outputformat': 'avro/binary'
      },
      'formats': ['application/json', 'avro/binary', 'gml3', 'GML2']
    };

    wfs.initializeConfig(config);
    const request = wfs.getRequest(config);
    expect(request.getResponseType()).toBe(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
  });
});

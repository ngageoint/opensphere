goog.require('os.data.DataProviderEventType');
goog.require('plugin.wmts.Server');

describe('plugin.wmts.Server', function() {
  afterEach(() => {
    os.net.URLModifier.replace_.length = 0;
  });

  var loadAndRun = function(server, config, func) {
    server.setId('testwmts');

    var count = 0;
    var listener = function() {
      count++;
    };

    server.listenOnce(os.data.DataProviderEventType.LOADED, listener);

    runs(function() {
      server.configure(config);
      server.load();
    });

    waitsFor(function() {
      return count;
    }, 'server to load');

    runs(func);
  };

  it('should parse WMTS 1.0.0 properly', function() {
    var server = new plugin.wmts.Server();
    loadAndRun(server, {
        url: '/base/test/resources/ogc/wmts-100.xml'
      },
      function() {
        expect(server.getId()).toBe('testwmts');
        expect(server.getLabel()).toBe('Test WMTS');

        var d = os.dataManager.getDescriptor('testwmts#test-3857-1');
        expect(d).toBeTruthy();
        expect(d.getLayerOptions()['wmtsOptions'][0]['format']).toBe('image/png');
        expect(d.getLayerOptions()['wmtsOptions'][0]['urls'][0]).toBe('https://wmts.example.com/ows?');
        expect(d.getLayerOptions()['projections'][0]).toBe('EPSG:3857');

        var d = os.dataManager.getDescriptor('testwmts#test-4326-1');
        expect(d).toBeTruthy();
        expect(d.getLayerOptions()['wmtsOptions'][0]['format']).toBe('image/png');
        expect(d.getLayerOptions()['wmtsOptions'][0]['urls'][0]).toBe('https://wmts.example.com/ows?');
        expect(d.getLayerOptions()['projections'][0]).toBe('EPSG:4326');
    }
    );
  });
});

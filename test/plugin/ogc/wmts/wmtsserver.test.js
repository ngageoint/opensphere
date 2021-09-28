goog.require('os.data.DataManager');
goog.require('os.data.DataProviderEventType');
goog.require('plugin.ogc.wmts.WMTSServer');

describe('plugin.ogc.wmts.WMTSServer', () => {
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: DataProviderEventType} = goog.module.get('os.data.DataProviderEventType');
  const {default: WMTSServer} = goog.module.get('plugin.ogc.wmts.WMTSServer');

  const loadAndRun = function(server, config, func) {
    server.setId('testogc');

    let count = 0;
    const listener = function() {
      count++;
    };

    server.listenOnce(DataProviderEventType.LOADED, listener);

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
    const server = new WMTSServer();
    loadAndRun(server, {
      url: '/base/test/resources/ogc/wmts-100.xml'
    }, function() {
      expect(server.getId()).toBe('testogc');
      expect(server.getLabel()).toBe('Test WMTS');

      var d = DataManager.getInstance().getDescriptor('testogc#test-3857-1');
      expect(d).toBeTruthy();

      var wmtsOptions = d.getWmtsOptions();
      expect(wmtsOptions).toBeDefined();
      expect(wmtsOptions.length).toBe(1);
      expect(wmtsOptions[0]['format']).toBe('image/png');
      expect(wmtsOptions[0]['urls'][0]).toBe('https://wmts.example.com/ows?');
      expect(wmtsOptions[0]['projection'].getCode()).toBe('EPSG:3857');

      var d = DataManager.getInstance().getDescriptor('testogc#test-4326-1');
      expect(d).toBeTruthy();

      wmtsOptions = d.getWmtsOptions();
      expect(wmtsOptions).toBeDefined();
      expect(wmtsOptions.length).toBe(1);
      expect(wmtsOptions[0]['format']).toBe('image/png');
      expect(wmtsOptions[0]['urls'][0]).toBe('https://wmts.example.com/ows?');
      expect(wmtsOptions[0]['projection'].getCode()).toBe('EPSG:4326');
    });
  });
});

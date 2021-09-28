goog.require('os.data.DataManager');
goog.require('os.data.DataProviderEventType');
goog.require('os.ui.ogc.OGCServer');

describe('os.ui.ogc.OGCServer', function() {
  const DataManager = goog.module.get('os.data.DataManager');
  const DataProviderEventType = goog.module.get('os.data.DataProviderEventType');
  const {default: OGCServer} = goog.module.get('os.ui.ogc.OGCServer');

  var loadAndRun = function(server, config, func) {
    server.setId('testogc');

    var count = 0;
    var listener = function() {
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

  it('should merge CRS lists properly', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-130.xml'
    }, function() {
      var d = DataManager.getInstance().getDescriptor('testogc#inherit');
      expect(d).toBeTruthy();

      var list = d.getSupportedCRS();
      expect(list).toBeTruthy();
      expect(list.length).toBe(3);
      expect(list).toContain('EPSG:4326');
      expect(list).toContain('EPSG:3857');
      expect(list).toContain('CRS:84');

      d = DataManager.getInstance().getDescriptor('testogc#add_crs');
      expect(d).toBeTruthy();

      list = d.getSupportedCRS();
      expect(list).toBeTruthy();
      expect(list.length).toBe(4);
      expect(list).toContain('EPSG:4326');
      expect(list).toContain('EPSG:3857');
      expect(list).toContain('CRS:84');
      expect(list).toContain('EPSG:3395');
    });
  });

  it('should parse time properly for WMS 1.3.0', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-130.xml'
    }, function() {
      var d = DataManager.getInstance().getDescriptor('testogc#add_crs');
      expect(d).toBeTruthy();
      expect(d.hasTimeExtent()).toBe(true);
    });
  });

  it('should parse time properly for WMS 1.1.1', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-111.xml'
    }, function() {
      for (var i = 1; i <= 2; i++) {
        var d = DataManager.getInstance().getDescriptor('testogc#OSDS:Layer_' + i);
        expect(d).toBeTruthy();
        expect(d.hasTimeExtent()).toBe(true);
      }
    });
  });

  it('should parse WFS 1.1.0 properly', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wfs: '/base/test/resources/ogc/wfs-110.xml'
    }, function() {
      expect(server.getWfsUrl()).toBe('https://example.com/geoserver/wfs');
      expect(server.getWfsPost()).toBe(true);
      expect(server.getWfsFormats()).toBeTruthy();
      expect(server.getWfsFormats()).toContain('text/xml; subtype=gml/3.1.1');
      expect(server.getWfsFormats()).toContain('GML2');
      expect(server.getWfsFormats()).toContain('application/json');
      expect(server.getWfsFormats()).toContain('gml3');
      expect(server.getWfsFormats()).toContain('json');
      expect(server.getWfsContentType()).toBe('text/xml');

      for (var i = 1; i <= 2; i++) {
        var d = DataManager.getInstance().getDescriptor('testogc#OSDS:Layer_' + i);
        expect(d).toBeTruthy();
        expect(d.isWfsEnabled()).toBe(true);
        expect(d.getWfsContentType()).toBe('text/xml');
      }
    });
  });

  it('should keep configured WMS operation URLs', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-130.xml',
      parseOperationURLs: false
    },
    function() {
      var d = DataManager.getInstance().getDescriptor('testogc#inherit');
      expect(d).toBeTruthy();
      expect(d.getWmsUrl()).toBe('/base/test/resources/ogc/wms-130.xml');
    });
  });

  it('should keep configured WFS operation URLs', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wfs: '/base/test/resources/ogc/wfs-110.xml',
      parseOperationURLs: false
    },
    function() {
      var d = DataManager.getInstance().getDescriptor('testogc#OSDS:Layer_2');
      expect(d).toBeTruthy();
      expect(d.getWfsUrl()).toBe('/base/test/resources/ogc/wfs-110.xml');
    });
  });

  it('should parse WMTS 1.0.0 properly', function() {
    var server = new OGCServer();
    loadAndRun(server, {
      wmts: '/base/test/resources/ogc/wmts-100.xml'
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

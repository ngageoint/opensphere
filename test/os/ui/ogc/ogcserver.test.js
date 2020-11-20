goog.require('os.data.DataProviderEventType');
goog.require('os.ui.ogc.OGCServer');

describe('os.ui.ogc.OGCServer', function() {
  var loadAndRun = function(server, config, func) {
    server.setId('testogc');

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

  it('should merge CRS lists properly', function() {
    var server = new os.ui.ogc.OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-130.xml'
    }, function() {
      var d = os.dataManager.getDescriptor('testogc#inherit');
      expect(d).toBeTruthy();

      var list = d.getSupportedCRS();
      expect(list).toBeTruthy();
      expect(list.length).toBe(3);
      expect(list).toContain('EPSG:4326');
      expect(list).toContain('EPSG:3857');
      expect(list).toContain('CRS:84');

      d = os.dataManager.getDescriptor('testogc#add_crs');
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
    var server = new os.ui.ogc.OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-130.xml'
    }, function() {
      var d = os.dataManager.getDescriptor('testogc#add_crs');
      expect(d).toBeTruthy();
      expect(d.hasTimeExtent()).toBe(true);
    });
  });

  it('should parse time properly for WMS 1.1.1', function() {
    var server = new os.ui.ogc.OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-111.xml'
    }, function() {
      for (var i = 1; i <= 2; i++) {
        var d = os.dataManager.getDescriptor('testogc#OSDS:Layer_' + i);
        expect(d).toBeTruthy();
        expect(d.hasTimeExtent()).toBe(true);
      }
    });
  });

  it('should parse WFS 1.1.0 properly', function() {
    var server = new os.ui.ogc.OGCServer();
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

      for (var i = 1; i <= 2; i++) {
        var d = os.dataManager.getDescriptor('testogc#OSDS:Layer_' + i);
        expect(d).toBeTruthy();
        expect(d.isWfsEnabled()).toBe(true);
      }
    });
  });

  it('should keep configured WMS operation URLs', function() {
    var server = new os.ui.ogc.OGCServer();
    loadAndRun(server, {
      wms: '/base/test/resources/ogc/wms-130.xml',
      parseOperationURLs: false
    },
    function() {
      var d = os.dataManager.getDescriptor('testogc#inherit');
      expect(d).toBeTruthy();
      expect(d.getWmsUrl()).toBe('/base/test/resources/ogc/wms-130.xml');
    });
  });

  it('should keep configured WFS operation URLs', function() {
    var server = new os.ui.ogc.OGCServer();
    loadAndRun(server, {
      wfs: '/base/test/resources/ogc/wfs-110.xml',
      parseOperationURLs: false
    },
    function() {
      var d = os.dataManager.getDescriptor('testogc#OSDS:Layer_2');
      expect(d).toBeTruthy();
      expect(d.getWfsUrl()).toBe('/base/test/resources/ogc/wfs-110.xml');
    });
  });
});

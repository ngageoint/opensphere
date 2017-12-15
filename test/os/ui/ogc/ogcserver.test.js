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
        wms: '/base/test/os/ui/ogc/wms.xml'
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
});

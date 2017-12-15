goog.require('goog.net.XhrIo');
goog.require('plugin.arc.layer.ArcFeatureLayerConfig');
goog.require('plugin.arc.layer.ArcTileLayerConfig');
goog.require('plugin.arc.state.v2.arcstate');


describe('plugin.arc.state.v2.arcstate', function() {
  it('should modify loaded arc layers in states', function() {
    var url = '/base/test/plugin/arc/state/v2/loadstate.xml';
    var xhr = new goog.net.XhrIo();
    var stateString = null;

    xhr.listenOnce(goog.net.EventType.SUCCESS, function() {
      stateString = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(url);
    });

    waitsFor(function() {
      return stateString != null;
    }, 'test state to load');

    runs(function() {
      var xml = goog.dom.xml.loadXml(stateString);
      plugin.arc.state.v2.arcstate.load(xml.firstChild);

      // it should have an arcfeature type layer
      var featureLayer = xml.querySelector('layer[type="' + plugin.arc.layer.ArcFeatureLayerConfig.ID + '"]');
      expect(!!featureLayer).toBe(true);

      // it should have an arctile type layer
      var tileLayer = xml.querySelector('layer[type="' + plugin.arc.layer.ArcTileLayerConfig.ID + '"]');
      expect(!!tileLayer).toBe(true);

      // it should have a url WITHOUT /export on the end
      var urlEle = tileLayer.querySelector('url');
      expect(urlEle.textContent).toBe('https://fake.server.com/arcgis/services/rest/SomeLayer/MapServer');
    });
  });

  it('should modify loaded arc layers in states', function() {
    var url = '/base/test/plugin/arc/state/v2/savestate.xml';
    var xhr = new goog.net.XhrIo();
    var stateString = null;

    xhr.listenOnce(goog.net.EventType.SUCCESS, function() {
      stateString = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(url);
    });

    waitsFor(function() {
      return stateString != null;
    }, 'test state to load');

    runs(function() {
      var xml = goog.dom.xml.loadXml(stateString);
      plugin.arc.state.v2.arcstate.save(xml.firstChild);

      // it should have an arc type layer
      var featureLayer = xml.querySelector('layer[type="arc"]');
      expect(!!featureLayer).toBe(true);

      // it should have an wms type layer with a provider element
      var tileLayer = xml.querySelector('layer[type="wms"]');
      expect(!!tileLayer).toBe(true);
      expect(tileLayer.querySelector('provider').textContent).toBe('ArcMap');

      // it should have a url WITH /export on the end
      var urlEle = tileLayer.querySelector('url');
      expect(urlEle.textContent).toBe('https://fake.server.com/arcgis/services/rest/SomeLayer/MapServer/export');
    });
  });
});

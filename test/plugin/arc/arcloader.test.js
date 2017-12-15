goog.require('goog.net.EventType');
goog.require('plugin.arc.ArcLoader');
goog.require('plugin.arc.ArcServer');
goog.require('plugin.arc.node.ArcFolderNode');


describe('plugin.arc.ArcLoader', function() {
  it('should throw assertion errors if it doesnt have a URL or node', function() {
    var loader = new plugin.arc.ArcLoader();
    var server = new plugin.arc.ArcServer();
    var node = new plugin.arc.node.ArcFolderNode(server);

    expect(loader.load).toThrow();

    loader.setUrl('https://fake.url.com');
    expect(loader.load.bind(loader)).toThrow();

    loader.setServer(server);
    expect(loader.load.bind(loader)).toThrow();

    loader.setNode(node);
    expect(loader.load.bind(loader)).not.toThrow();
  });

  it('should load Arc folders and services', function() {
    var server = new plugin.arc.ArcServer();
    var url = '/base/test/plugin/arc/arcresponse.json';
    var successFired = false;
    var listener = function() {
      successFired = true;
    };

    var loader = new plugin.arc.ArcLoader(server, url, server);
    loader.listenOnce(goog.net.EventType.SUCCESS, listener);
    loader.load();

    // Each child node attempts to load its set of folders and fails in a test setting, which causes them to
    // not be added to the tree. Override that functionality and leave them in the tree.
    spyOn(loader, 'shouldAddNode').andCallFake(goog.functions.TRUE);

    waitsFor(function() {
      return !!server.getChildren();
    }, 'child nodes to be loaded and added');

    runs(function() {
      var children = server.getChildren();
      expect(children.length).toBe(6);
      expect(server.getVersion()).toBe('10.31');
      expect(successFired).toBe(true);

      var folderCount = 0;
      var serviceCount = 0;
      var folderNames = ['Analysis', 'Elevation', 'Locators'];
      var serviceNames = ['Blank', 'Geometry', 'GEONAMES'];
      for (var i = 0, ii = children.length; i < ii; i++) {
        var child = children[i];

        if (child instanceof plugin.arc.node.ArcFolderNode) {
          folderCount++;
          expect(folderNames).toContain(child.getLabel());
        }

        if (child instanceof plugin.arc.node.ArcServiceNode) {
          serviceCount++;
          expect(serviceNames).toContain(child.getLabel());
        }
      }

      expect(folderCount).toBe(3);
      expect(serviceCount).toBe(3);
    });
  });

  it('should fire an error event on failing to load', function() {
    var server = new plugin.arc.ArcServer();
    var url = '/base/test/plugin/arc/FAKEARCRESPONSE.json';
    var errorFired = false;
    var listener = function() {
      errorFired = true;
    };

    var loader = new plugin.arc.ArcLoader(server, url, server);
    loader.listenOnce(goog.net.EventType.ERROR, listener);
    loader.load();

    waitsFor(function() {
      return errorFired;
    }, 'error event to be fired');

    runs(function() {
      expect(errorFired).toBe(true);
    });
  });
});

goog.require('os.net.LocalFileHandler');
goog.require('goog.Uri');
goog.require('goog.net.EventType');

describe('os.net.LocalFileHandler', function() {
  var file = new os.file.File();
  file.setFileName('testFile.xml');
  file.setUrl('local://testfileurl');
  file.setContent('some content');
  file.setType('test');

  var lfh = new os.net.LocalFileHandler();

  it('should handle file uris', function() {
    var uri = new goog.Uri(file.getUrl());
    expect(lfh.handles('GET', uri)).toBe(true);
    expect(lfh.handles('POST', uri)).toBe(true);
    expect(lfh.handles('PUT', uri)).toBe(true);
    expect(lfh.handles('DELETE', uri)).toBe(true);
  });

  it('should not handle relative uris', function() {
    var uri = new goog.Uri(window.location.toString());
    expect(lfh.handles('GET', uri)).toBe(false);
    expect(lfh.handles('POST', uri)).toBe(false);
    expect(lfh.handles('PUT', uri)).toBe(false);
    expect(lfh.handles('DELETE', uri)).toBe(false);
  });

  it('should not handle remote uris', function() {
    var uri = new goog.Uri('http://www.google.com');

    expect(lfh.handles('GET', uri)).toBe(false);
    expect(lfh.handles('POST', uri)).toBe(false);
    expect(lfh.handles('PUT', uri)).toBe(false);
    expect(lfh.handles('DELETE', uri)).toBe(false);
  });

  it('should load files from local storage', function() {
    var counter = 0;
    var callback = function() {
      counter++;
    };

    var fs = os.file.FileStorage.getInstance();
    fs.storeFile(file).addCallback(callback);

    waitsFor(function() {
      return counter > 0;
    }, 'file to be stored');

    runs(function() {
      var uri = new goog.Uri(file.getUrl());
      counter = 0;

      lfh.addEventListener(goog.net.EventType.SUCCESS, callback);
      lfh.execute('GET', uri);
    });

    waitsFor(function() {
      return counter > 0;
    }, 'file to be loaded');

    runs(function() {
      lfh.removeEventListener(goog.net.EventType.SUCCESS, callback);
      expect(lfh.getErrors()).toBeNull();
      expect(lfh.getStatusCode()).toBe(200);
      expect(lfh.getResponse()).not.toBeNull();
      expect(lfh.getResponse()).toBe(file.getContent());

      counter = 0;
      fs.clear().addCallback(callback);
    });

    waitsFor(function() {
      return counter > 0;
    }, 'file storage to clear');
  });

  it('should report an error when a file cannot be found in local storage', function() {
    var uri = new goog.Uri(file.getUrl());
    var counter = 0;
    var callback = function() {
      counter++;
    };

    lfh.addEventListener(goog.net.EventType.ERROR, callback);
    lfh.execute('GET', uri);

    waitsFor(function() {
      return counter > 0;
    }, 'file load to fail');

    runs(function() {
      lfh.removeEventListener(goog.net.EventType.ERROR, callback);
      expect(lfh.getErrors()).not.toBeNull();
      expect(lfh.getStatusCode()).toBe(404);
      expect(lfh.getErrors().length).toBe(1);
      expect(lfh.getResponse()).toBeNull();
    });
  });
});

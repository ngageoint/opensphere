goog.require('goog.Uri');
goog.require('goog.net.EventType');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.net.LocalFileHandler');

describe('os.net.LocalFileHandler', function() {
  const Uri = goog.module.get('goog.Uri');
  const EventType = goog.module.get('goog.net.EventType');
  const OSFile = goog.module.get('os.file.File');
  const FileStorage = goog.module.get('os.file.FileStorage');
  const LocalFileHandler = goog.module.get('os.net.LocalFileHandler');

  var file = new OSFile();
  file.setFileName('testFile.xml');
  file.setUrl('local://testfileurl');
  file.setContent('some content');
  file.setType('test');

  var lfh = new LocalFileHandler();

  it('should handle file uris', function() {
    var uri = new Uri(file.getUrl());
    expect(lfh.handles('GET', uri)).toBe(true);
    expect(lfh.handles('POST', uri)).toBe(true);
    expect(lfh.handles('PUT', uri)).toBe(true);
    expect(lfh.handles('DELETE', uri)).toBe(true);
  });

  it('should not handle relative uris', function() {
    var uri = new Uri(window.location.toString());
    expect(lfh.handles('GET', uri)).toBe(false);
    expect(lfh.handles('POST', uri)).toBe(false);
    expect(lfh.handles('PUT', uri)).toBe(false);
    expect(lfh.handles('DELETE', uri)).toBe(false);
  });

  it('should not handle remote uris', function() {
    var uri = new Uri('http://www.google.com');

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

    var fs = FileStorage.getInstance();
    fs.storeFile(file).addCallback(callback);

    waitsFor(function() {
      return counter > 0;
    }, 'file to be stored');

    runs(function() {
      var uri = new Uri(file.getUrl());
      counter = 0;

      lfh.addEventListener(EventType.SUCCESS, callback);
      lfh.execute('GET', uri);
    });

    waitsFor(function() {
      return counter > 0;
    }, 'file to be loaded');

    runs(function() {
      lfh.removeEventListener(EventType.SUCCESS, callback);
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
    var uri = new Uri(file.getUrl());
    var counter = 0;
    var callback = function() {
      counter++;
    };

    lfh.addEventListener(EventType.ERROR, callback);
    lfh.execute('GET', uri);

    waitsFor(function() {
      return counter > 0;
    }, 'file load to fail');

    runs(function() {
      lfh.removeEventListener(EventType.ERROR, callback);
      expect(lfh.getErrors()).not.toBeNull();
      expect(lfh.getStatusCode()).toBe(404);
      expect(lfh.getErrors().length).toBe(1);
      expect(lfh.getResponse()).toBeNull();
    });
  });
});

goog.require('ol.xml');
goog.require('os.events.EventType');
goog.require('os.file.File');
goog.require('os.mock');
goog.require('os.ui.file.method.UrlMethod');
goog.require('plugin.file.kml.type.KMLTypeMethod');

describe('plugin.file.kml.type.KMLTypeMethod', function() {
  var testUrl = '/base/test/plugin/file/kml/kml_test.xml';

  var str1 = '<kml></kml>';
  var str2 = '<xml></xml>';
  var str3 = '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" ' +
      'xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"></kml>';
  var str4 = '<xml xmlns="http://www.opengis.net/kml/2.2"></xml>';
  var str5 = '<KmL></KmL>';

  var doc1 = ol.xml.parse(str1);
  var doc2 = ol.xml.parse(str2);
  var doc3 = ol.xml.parse(str3);
  var doc4 = ol.xml.parse(str4);
  var doc5 = ol.xml.parse(str5);

  var method = new plugin.file.kml.type.KMLTypeMethod();

  it('detects kml content from a string', function() {
    var file = new os.file.File();
    file.setContent(str1);
    expect(method.isType(file)).toBe(true);
    file.setContent(str2);
    expect(method.isType(file)).toBe(false);
    file.setContent(str3);
    expect(method.isType(file)).toBe(true);
    file.setContent(str4);
    expect(method.isType(file)).toBe(true);
    file.setContent(str5);
    expect(method.isType(file)).toBe(true);
  });

  it('detects kml content from a document', function() {
    var file = new os.file.File();
    file.setContent(doc1);
    expect(method.isType(file)).toBe(true);
    file.setContent(doc2);
    expect(method.isType(file)).toBe(false);
    file.setContent(doc3);
    expect(method.isType(file)).toBe(true);
    file.setContent(doc4);
    expect(method.isType(file)).toBe(true);
    file.setContent(doc5);
    expect(method.isType(file)).toBe(true);
  });

  it('detects kml content loaded from a url', function() {
    var urlMethod = new os.ui.file.method.UrlMethod();
    urlMethod.setUrl(testUrl);

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    urlMethod.listenOnce(os.events.EventType.COMPLETE, onComplete);
    urlMethod.loadFile();

    waitsFor(function() {
      return methodComplete == true;
    }, 'url to load');

    runs(function() {
      var file = urlMethod.getFile();
      expect(method.isType(file)).toBe(true);
    });
  });

  it('ignores content with a zip content url', function() {
    var file = new os.file.File();
    file.setContent(str1);
    expect(method.isType(file, '/fake/zipcontent/url')).toBe(false);
  });
});

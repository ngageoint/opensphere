goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.text');
goog.require('os.file.mime.xml');

describe('os.file.mime.xml', function() {
  const OSFile = goog.module.get('os.file.File');
  const mime = goog.module.get('os.file.mime');
  const text = goog.module.get('os.file.mime.text');
  const xml = goog.module.get('os.file.mime.xml');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not xml files', function() {
    mockMime.testFiles([
      '/base/test/plugin/file/geojson/10k.json',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/xml/ERROR_text-before-root.xml'],
    mockMime.testNo(xml.TYPE));
  });

  it('should detect files that are xml files', function() {
    var expected = {
      '/base/test/resources/xml/namespaced-root-partial.xml': {
        rootTag: 'one',
        rootNS: 'http://example.com/thing'
      },
      '/base/test/resources/xml/comment-with-embedded-xml.xml': {
        rootTag: 'root',
        rootNS: ''
      },
      '/base/test/plugin/file/kml/kml_test.xml': {
        rootTag: 'kml',
        rootNS: 'http://www.opengis.net/kml/2.2'
      }
    };

    mockMime.testFiles(Object.keys(expected),
        function(buffer, filename) {
          var eVal = expected[filename];
          var result = null;
          runs(function() {
            text.detectText(buffer).then(function(context) {
              return xml.isXML(buffer, undefined, context);
            }).then(function(val) {
              result = val;
            });
          });

          waitsFor(function() {
            return !!result;
          }, 'promise to conclude');

          runs(function() {
            expect(result).toBeTruthy();
            for (var key in eVal) {
              expect(result[key]).toBe(eVal[key]);
            }
          });
        });
  });

  it('should detect empty root tags as xml', function() {
    var test = '<something/>';
    var buffer = new TextEncoder().encode(test).buffer;

    // pretend this came from a file
    var file = new OSFile();
    file.setFileName('something.xml');
    file.setUrl(file.getFileName());

    var testFunc = mockMime.testYes(xml.TYPE);
    testFunc(buffer, file);
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain('text/xml').join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml');
  });
});

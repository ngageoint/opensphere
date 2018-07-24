goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.xml');

describe('os.file.mime.xml', function() {
  it('should not detect files that are not xml files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/geojson/10k.json',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/xml/ERROR_text-before-root.xml'],
        os.file.mime.mock.testNo(os.file.mime.xml.TYPE));
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

    os.file.mime.mock.testFiles(Object.keys(expected),
        function(buffer, filename) {
          var eVal = expected[filename];
          var result = null;
          runs(function() {
            os.file.mime.text.detectText(buffer).then(function(context) {
              return os.file.mime.xml.isXML(buffer, undefined, context);
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

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain('text/xml').join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml');
  });
});

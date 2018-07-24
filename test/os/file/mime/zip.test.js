goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.zip');

describe('os.file.mime.zip', function() {
  it('should not detect files that are not zip files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/plugin/file/geojson/10k.json',
      '/base/test/resources/bin/rand.bin'],
        function(buffer) {
          expect(os.file.mime.zip.isZip(buffer)).toBe(false);
        });
  });

  it('should detect files that are zip files even if it only has a partial', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/zip/test.zip',
      '/base/test/resources/zip/test.kmz'],
        function(buffer, filename) {
          var result = Number.POSITIVE_INFINITY;
          runs(function() {
            os.file.mime.zip.detectZip(buffer).then(function(val) {
              result = val;
            });
          });

          waitsFor(function() {
            return result != Number.POSITIVE_INFINITY;
          }, 'promise to conclude ' + filename, 10000);

          runs(function() {
            expect(result).toBeTruthy();
          });
        });
  });

  it('should detect files that are zip files and return the entries if given a complete file', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/zip/test.zip',
      '/base/test/resources/zip/test.kmz'],
        function(buffer, filename) {
          var result = Number.POSITIVE_INFINITY;
          runs(function() {
            os.file.mime.zip.detectZip(buffer).then(function(val) {
              result = val;
            });
          });

          waitsFor(function() {
            return result != Number.POSITIVE_INFINITY;
          }, 'promise to conclude ' + filename, 10000);

          runs(function() {
            expect(result).toBeTruthy();
            expect(Array.isArray(result)).toBe(true);
          });
        }, Number.POSITIVE_INFINITY);
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.file.mime.zip.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, application/zip');
  });
});

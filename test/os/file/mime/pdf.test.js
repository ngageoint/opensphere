goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.pdf');

describe('os.file.mime.pdf', function() {
  it('should not detect files that are not pdf files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/zip/test.zip',
      '/base/test/resources/zip/test.kmz'],
        function(buffer, filename) {
          var result = Number.POSITIVE_INFINITY;
          runs(function() {
            os.file.mime.pdf.isPDF(buffer).then(function(val) {
              result = val;
            });
          });

          waitsFor(function() {
            return result !== Number.POSITIVE_INFINITY;
          });

          runs(function() {
            expect(result).toBe(false);
          });
        });
  });

  it('should detect files that are pdf files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/pdf/test.pdf'],
        os.file.mime.mock.testYes(os.file.mime.pdf.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.file.mime.pdf.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, ' + os.file.mime.pdf.TYPE);
  });
});

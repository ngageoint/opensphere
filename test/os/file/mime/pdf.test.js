goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.pdf');

describe('os.file.mime.pdf', function() {
  const mime = goog.module.get('os.file.mime');
  const pdf = goog.module.get('os.file.mime.pdf');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not pdf files', function() {
    mockMime.testFiles([
      '/base/test/resources/zip/test.zip',
      '/base/test/resources/zip/test.kmz'
    ], function(buffer, filename) {
      var result = Number.POSITIVE_INFINITY;
      runs(function() {
        pdf.isPDF(buffer).then(function(val) {
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
    mockMime.testFiles([
      '/base/test/resources/pdf/test.pdf'
    ], mockMime.testYes(pdf.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(pdf.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, ' + pdf.TYPE);
  });
});

goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.html');
goog.require('os.file.mime.mock');

describe('os.file.mime.html', function() {
  const mime = goog.module.get('os.file.mime');
  const html = goog.module.get('os.file.mime.html');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not HTML files', function() {
    mockMime.testFiles([
      '/base/test/os/ui/filter/parse/state.xml',
      '/base/test/resources/json/partial_array.json'
    ], mockMime.testNo(html.TYPE));
  });

  it('should detect files that are HTML files', function() {
    mockMime.testFiles([
      '/base/test/resources/html/sample.html',
      '/base/test/resources/html/sample.xhtml',
      '/base/test/resources/html/no-doctype.html',
      '/base/test/resources/html/old-doctype.html'
    ], mockMime.testYes(html.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(html.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/html');
  });
});

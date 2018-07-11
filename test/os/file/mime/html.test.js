goog.require('os.file.File');
goog.require('os.file.mime.html');
goog.require('os.file.mime.mock');

describe('os.file.mime.html', function() {
  it('should not detect files that are not HTML files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/os/ui/filter/parse/state.xml',
      '/base/test/resources/json/partial_array.json'],
        os.file.mime.mock.testNo(os.file.mime.html.TYPE));
  });

  it('should detect files that are HTML files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/html/sample.html',
      '/base/test/resources/html/sample.xhtml'],
        os.file.mime.mock.testYes(os.file.mime.html.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.file.mime.html.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/html');
  });
});

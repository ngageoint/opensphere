goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.file.zip.mime');

describe('plugin.file.zip.mime', function() {
  it('should not detect files that are not zip files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml'],
        os.file.mime.mock.testNo(plugin.file.zip.mime.TYPE));
  });

  it('should detect files that are zip files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/zip/test.zip'],
        os.file.mime.mock.testYes(plugin.file.zip.mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain('application/zip').join(', ');
    expect(chain).toBe('application/octet-stream, application/zip');
  });
});

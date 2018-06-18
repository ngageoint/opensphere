goog.require('os.file.File');
goog.require('os.file.mime.columnmapping');
goog.require('os.file.mime.mock');

describe('os.file.mime.columnmapping', function() {
  it('should not detect files that are not columnmapping files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/os/ui/filter/parse/state.xml'],
        os.file.mime.mock.testNo(os.file.mime.columnmapping.TYPE));
  });

  it('should detect files that are columnmapping files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/os/file/mime/columnmapping.xml'],
        os.file.mime.mock.testYes(os.file.mime.columnmapping.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.file.mime.columnmapping.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, text/xml; subtype=COLUMNMAPPING');
  });
});

goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.xmlstate');

describe('os.file.mime.xmlstate', function() {
  it('should not detect files that are not state files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/os/ui/filter/parse/filters.xml',
      '/base/test/plugin/file/kml/kml_test.xml'],
        os.file.mime.mock.testNo(os.file.mime.xmlstate.TYPE));
  });

  it('should detect files that are state files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/os/ui/filter/parse/state.xml'],
        os.file.mime.mock.testYes(os.file.mime.xmlstate.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.file.mime.xmlstate.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + os.file.mime.xmlstate.TYPE);
  });
});

goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.xmlstate');

describe('os.file.mime.xmlstate', function() {
  const mime = goog.module.get('os.file.mime');
  const xmlstate = goog.module.get('os.file.mime.xmlstate');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not state files', function() {
    mockMime.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/os/ui/filter/parse/filters.xml',
      '/base/test/plugin/file/kml/kml_test.xml'
    ], mockMime.testNo(xmlstate.TYPE));
  });

  it('should detect files that are state files', function() {
    mockMime.testFiles([
      '/base/test/os/ui/filter/parse/state.xml'
    ], mockMime.testYes(xmlstate.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(xmlstate.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + xmlstate.TYPE);
  });
});

goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.columnmapping');
goog.require('os.file.mime.mock');

describe('os.file.mime.columnmapping', function() {
  const mime = goog.module.get('os.file.mime');
  const columnmapping = goog.module.get('os.file.mime.columnmapping');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not columnmapping files', function() {
    mockMime.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/os/ui/filter/parse/state.xml'
    ], mockMime.testNo(columnmapping.TYPE));
  });

  it('should detect files that are columnmapping files', function() {
    mockMime.testFiles(['/base/test/os/file/mime/columnmapping.xml'], mockMime.testYes(columnmapping.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(columnmapping.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, text/xml; subtype=COLUMNMAPPING');
  });
});

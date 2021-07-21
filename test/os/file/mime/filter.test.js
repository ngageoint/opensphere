goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.filter');
goog.require('os.file.mime.mock');

describe('os.file.mime.filter', function() {
  const mime = goog.module.get('os.file.mime');
  const filter = goog.module.get('os.file.mime.filter');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not filter files', function() {
    mockMime.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/os/ui/filter/parse/state.xml'
    ], mockMime.testNo(filter.TYPE));
  });

  it('should detect files that are filter files', function() {
    mockMime.testFiles([
      '/base/test/os/ui/filter/parse/filters.xml'
    ], mockMime.testYes(filter.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(filter.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, text/xml; subtype=FILTER');
  });
});

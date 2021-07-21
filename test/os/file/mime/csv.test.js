goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.csv');
goog.require('os.file.mime.mock');

describe('os.file.mime.csv', function() {
  const mime = goog.module.get('os.file.mime');
  const csv = goog.module.get('os.file.mime.csv');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not CSV files', function() {
    mockMime.testFiles([
      '/base/test/os/ui/filter/parse/state.xml',
      '/base/test/resources/text/utf8.bin'
    ], mockMime.testNo(csv.TYPE));
  });

  it('should detect files that are CSV files', function() {
    mockMime.testFiles(['/base/test/resources/csv/areas.csv'], mockMime.testYes(csv.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(csv.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/csv');
  });
});

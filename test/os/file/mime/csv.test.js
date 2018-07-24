goog.require('os.file.File');
goog.require('os.file.mime.csv');
goog.require('os.file.mime.mock');

describe('os.file.mime.csv', function() {
  it('should not detect files that are not CSV files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/os/ui/filter/parse/state.xml',
      '/base/test/resources/text/utf8.bin'],
        os.file.mime.mock.testNo(os.file.mime.csv.TYPE));
  });

  it('should detect files that are CSV files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/csv/areas.csv'],
        os.file.mime.mock.testYes(os.file.mime.csv.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.file.mime.csv.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/csv');
  });
});

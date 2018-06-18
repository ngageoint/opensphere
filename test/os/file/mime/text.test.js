goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.text');

describe('os.file.mime.text', function() {
  it('should not detect files that are not text files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/zip/test.zip',
      '/base/test/resources/zip/test.kmz',
      '/base/test/resources/bin/rand.bin'],
        function(buffer, file) {
          expect(os.file.mime.text.getText(buffer)).toBeFalsy();
        });
  });

  it('should detect files that are text files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/geojson/10k.json',
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/text/big5.bin',
      '/base/test/resources/text/euc-jp.bin',
      '/base/test/resources/text/euc-kr.bin',
      '/base/test/resources/text/gb-2312.bin',
      // '/base/test/resources/text/hz-2312.bin', // detected by jschardet but isn't working in Chrome 66 and FF59
      '/base/test/resources/text/iso-2022-jp.2.bin',
      '/base/test/resources/text/iso-2022-jp.bin',
      '/base/test/resources/text/iso-8859-5.russian.bin',
      '/base/test/resources/text/iso-8859-7.greek.bin',
      '/base/test/resources/text/iso-8859-8.hebrew1.bin',
      '/base/test/resources/text/iso-8859-8.hebrew2.bin',
      '/base/test/resources/text/shift-jis.bin',
      '/base/test/resources/text/utf16.bin',
      '/base/test/resources/text/utf16be.bin',
      '/base/test/resources/text/utf16le.bin',
      '/base/test/resources/text/utf8.bin',
      '/base/test/resources/text/utf8.truncated-multibyte.bin',
      '/base/test/resources/text/windows-1252.french.bin',
      '/base/test/resources/text/windows-1252.german.bin'],
        function(buffer) {
          expect(os.file.mime.text.getText(buffer)).toBeTruthy();
        });
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain('text/plain').join(', ');
    expect(chain).toBe('application/octet-stream, text/plain');
  });
});

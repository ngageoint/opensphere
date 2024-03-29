goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.text');

describe('os.file.mime.text', function() {
  const mime = goog.module.get('os.file.mime');
  const text = goog.module.get('os.file.mime.text');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should detect files that are text files', function() {
    mockMime.testFiles([
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
      '/base/test/resources/text/windows-1252.german.bin'
    ], function(buffer) {
      expect(text.getText(buffer)).toBeTruthy();
    });
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain('text/plain').join(', ');
    expect(chain).toBe('application/octet-stream, text/plain');
  });
});

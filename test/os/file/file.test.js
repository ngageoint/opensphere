goog.require('goog.userAgent');
goog.require('os.file');
goog.require('os.file.File');


describe('os.file.File', function() {
  const userAgent = goog.module.get('goog.userAgent');
  const osFile = goog.module.get('os.file');
  const OSFile = goog.module.get('os.file.File');

  var fsFile = new OSFile();
  fsFile.setFileName('testFile.xml');
  fsFile.setUrl('file:///path/to/some/testFile.xml');
  fsFile.setContent('test content');
  fsFile.setContentType('test+content+and+stuff');
  fsFile.setType('test');

  var localFile = new OSFile();
  localFile.setFileName('testFile.xml');
  localFile.setUrl('local://testfileurl');
  localFile.setContent('test content');
  localFile.setContentType('test+content+and+stuff');
  localFile.setType('test');

  it('gets file:// URLs from a path', function() {
    var path = '/path/to/some/file.xml';
    expect(osFile.getFileUrl(path)).toBe('file://' + path);

    var isWin = userAgent.WINDOWS;
    userAgent.WINDOWS = true;

    var winPath = 'C:\\Program Files\\My File.xml';
    expect(osFile.getFileUrl(winPath)).toBe('file:///C:/Program Files/My File.xml');

    userAgent.WINDOWS = isWin;
  });

  it('tests for file:// URLs', function() {
    expect(osFile.isFileSystem(fsFile)).toBe(true);
    expect(osFile.isFileSystem('file:///test')).toBe(true);

    expect(osFile.isFileSystem(localFile)).toBe(false);
    expect(osFile.isFileSystem('local://test')).toBe(false);
    expect(osFile.isFileSystem('not file:///test')).toBe(false);
  });

  it('tests for local:// URLs', function() {
    expect(osFile.isLocal(localFile)).toBe(true);
    expect(osFile.isLocal('local://test')).toBe(true);

    expect(osFile.isLocal(fsFile)).toBe(false);
    expect(osFile.isLocal('file:///test')).toBe(false);
    expect(osFile.isLocal('not local://test')).toBe(false);
  });

  it('should persist and restore properly', function() {
    var p = localFile.persist();
    expect(p.fileName).toBe(localFile.getFileName());
    expect(p.url).toBe(localFile.getUrl());
    expect(p.content).toBe(localFile.getContent());
    expect(p.contentType).toBe(localFile.getContentType());
    expect(p.type).toBe(localFile.getType());

    var r = new OSFile();
    r.restore(p);

    expect(r.getFileName()).toBe(localFile.getFileName());
    expect(r.getUrl()).toBe(localFile.getUrl());
    expect(r.getContent()).toBe(localFile.getContent());
    expect(r.getContentType()).toBe(localFile.getContentType());
    expect(r.getType()).toBe(localFile.getType());
  });
});
